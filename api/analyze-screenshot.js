const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Configure Multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper to run Multer middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// The main serverless function
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Process multipart form data
    await runMiddleware(req, res, upload.single('screenshot'));

    // Extract shared data
    const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : {};
    const additionalNotes = req.body.additionalNotes || '';
    const manualData = req.body.manualData ? JSON.parse(req.body.manualData) : null;

    let userContent;

    // Define the core analysis prompt structure
    const systemPrompt = `
      You are a world-class financial analyst and personalized advisor.
      Your task is to analyze an investment based on the provided data, user profile, and additional notes.

      **User Profile:**
      - Experience Level: ${userProfile.experience || 'Not provided'}
      - Investment Goals: ${userProfile.goals?.join(', ') || 'Not provided'}
      - Risk Tolerance: ${userProfile.riskTolerance || 'Not provided'}
      - Interests: ${userProfile.interests?.join(', ') || 'Not provided'}

      **User's Additional Notes:**
      ${additionalNotes || 'None'}

      **Your Analysis Must Include:**
      1.  **Basic Details:** 'name', 'type', 'amount', 'quantity', 'ticker'. If not provided, make reasonable assumptions or state as not available.
      2.  **Risk Analysis:** A 'riskScore' (1-10) and a concise 'riskExplanation' (1-2 sentences).
      3.  **Overall Grade:** An overall 'grade' ('A' to 'F').
      4.  **ROI Scenarios:** An 'roiScenarios' object containing three numerical estimates (without '%' signs): 'pessimistic', 'realistic', and 'optimistic'.
      5.  **Average ROI:** A single 'roiEstimate' which should be the same as the 'realistic' value from the 'roiScenarios' object.
      6.  **Full Explanation:** A comprehensive, multi-paragraph 'explanation' that justifies all metrics and connects the investment to the user's profile.

      **Output Format:**
      Return a single, clean JSON object with all the fields mentioned above. Do not include any text outside of the JSON object.
    `;

    if (req.file) {
      // Handle screenshot analysis
      const filePath = req.file.path;
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      userContent = [
        { type: "text", text: "Please analyze this investment based on my profile and the provided screenshot." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      ];
      
      // Clean up the uploaded file
      req.on('end', () => fs.unlinkSync(filePath));

    } else if (manualData) {
      // Handle manual data analysis
      userContent = [
        { 
          type: "text", 
          text: `Please analyze the following investment based on my profile and the data below.\n\n          **Investment Data:**\n          - Name: ${manualData.name}\n          - Type: ${manualData.type}\n          - Amount: ${manualData.amount}\n          - Purchase Date: ${manualData.date}\n          \n          Provide your full analysis in the required JSON format.`
        },
      ];
    } else {
      return res.status(400).json({ error: 'No screenshot file or manual data provided.' });
    }

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 2000,
    });

    // Step 1: Extract the raw text from the AI's response.
    let rawResponse = aiResponse.choices[0].message.content;
    console.log('AI Raw Response:', rawResponse);
    let jsonString = '';

    // Step 2: Find the JSON string, handling markdown code blocks.
    const markdownMatch = rawResponse.match(/```json\s*(\{.*\})\s*```/s);
    if (markdownMatch && markdownMatch[1]) {
      jsonString = markdownMatch[1];
    } else {
      // Fallback for raw JSON without markdown
      const rawJsonMatch = rawResponse.match(/\{.*\}/s);
      if (rawJsonMatch) {
        jsonString = rawJsonMatch[0];
      }
    }

    if (!jsonString) {
      console.error("AI response did not contain a valid JSON object.", rawResponse);
      return res.status(500).json({ error: 'AI failed to provide a valid analysis structure.' });
    }

    // Step 3: Parse the cleaned JSON string.
    let investmentData;
    try {
      investmentData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON from AI response", { jsonString, error: e.message });
      return res.status(500).json({ error: 'AI returned malformed analysis data.' });
    }

    // Step 4: Transform the data to match the frontend's expected flat structure.
    if (investmentData.riskAnalysis) {
      investmentData.riskScore = investmentData.riskAnalysis.riskScore;
      investmentData.riskExplanation = investmentData.riskAnalysis.riskExplanation;
      delete investmentData.riskAnalysis; // Clean up the old nested object
    }
    if (investmentData.overallGrade) {
      investmentData.grade = investmentData.overallGrade;
      delete investmentData.overallGrade; // Clean up the old key
    }

    // Step 5: Add fallbacks as a final safety net.
    investmentData.grade = investmentData.grade || 'N/A';
    investmentData.riskScore = investmentData.riskScore === undefined ? 0 : investmentData.riskScore;
    investmentData.roiScenarios = investmentData.roiScenarios || { pessimistic: 0, realistic: 0, optimistic: 0 };
    investmentData.roiEstimate = investmentData.roiEstimate === undefined ? (investmentData.roiScenarios.realistic || 0) : investmentData.roiEstimate;
    investmentData.explanation = investmentData.explanation || 'Analysis not available.';

    res.status(200).json(investmentData);

  } catch (error) {
    console.error('Error in analyze-screenshot:', error);
    // Ensure file is deleted even on error if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to analyze investment.', details: error.message });
  }
}
