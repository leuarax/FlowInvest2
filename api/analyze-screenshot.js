import { OpenAI } from 'openai';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
export default async function handler(req, res) {
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

      **MANDATORY Output Fields:**
      You MUST return a JSON object containing all of the following fields. Do not omit any of them.
      1.  **Basic Details:** 'name', 'type', 'amount', 'quantity', 'ticker'. If not provided, make reasonable assumptions or state as not available.
      2.  **Risk Analysis:**
          - 'riskScore': A mandatory integer from 1 (lowest risk) to 10 (highest risk).
          - 'riskExplanation': A mandatory, concise explanation (1-2 sentences).
      3.  **Overall Grade:**
          - 'grade': A mandatory letter grade from 'A' (excellent) to 'F' (fail).
      4.  **ROI Scenarios:**
          - 'roiScenarios': A mandatory object with three numerical estimates: 'pessimistic', 'realistic', 'optimistic'.
      5.  **Average ROI:**
          - 'roiEstimate': A mandatory single number, which MUST be the same as the 'realistic' value.
      6.  **Full Explanation:**
          - 'explanation': A mandatory, comprehensive, multi-paragraph justification for all metrics, connecting the investment to the user's profile.

      **CRITICAL: Ensure the final output is a single, valid JSON object and nothing else. All fields listed above are required.**
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

    let investmentData = JSON.parse(aiResponse.choices[0].message.content);

    // Layer 2: Intelligent extraction from explanation text
    if ((!investmentData.grade || investmentData.grade === 'N/A') && investmentData.explanation) {
      // More robust regex to find the grade, e.g., "the 'B' grade", "grade is 'A'", etc.
      const gradeMatch = investmentData.explanation.match(/(?:grade(?: is| of)?|the|a)\s*['"]([A-F])['"]/i);
      if (gradeMatch && gradeMatch[1]) {
        investmentData.grade = gradeMatch[1].toUpperCase();
      }
    }

    if ((investmentData.riskScore === undefined || investmentData.riskScore === null || investmentData.riskScore === 0) && investmentData.explanation) {
       // More robust regex to find the risk score, e.g., "risk score of 7", "risk is 5/10"
      const riskMatch = investmentData.explanation.match(/(?:risk score(?: of| is)?|risk is)\s*(\d{1,2})/i);
      if (riskMatch && riskMatch[1]) {
        investmentData.riskScore = parseInt(riskMatch[1], 10);
      }
    }

    // Layer 3: Final fallback to ensure critical fields are present
    if (!investmentData.grade) {
      investmentData.grade = 'N/A';
    }
    if (investmentData.riskScore === undefined || investmentData.riskScore === null) {
      investmentData.riskScore = 0;
    }
    if (!investmentData.roiScenarios) {
        investmentData.roiScenarios = { pessimistic: 0, realistic: 0, optimistic: 0 };
    }
    if (investmentData.roiEstimate === undefined || investmentData.roiEstimate === null) {
        investmentData.roiEstimate = investmentData.roiScenarios.realistic || 0;
    }

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
