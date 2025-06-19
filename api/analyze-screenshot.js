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
    await runMiddleware(req, res, upload.single('screenshot'));

    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file uploaded.' });
    }

    // Extract user data and notes from the form
    const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : {};
    const additionalNotes = req.body.additionalNotes || '';

    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Construct the advanced prompt
    const systemPrompt = `
      You are a world-class financial analyst and personalized advisor.
      Your task is to analyze an investment based on a screenshot, user profile, and additional notes.

      **User Profile:**
      - Experience Level: ${userProfile.experience || 'Not provided'}
      - Investment Goals: ${userProfile.goals?.join(', ') || 'Not provided'}
      - Risk Tolerance: ${userProfile.riskTolerance || 'Not provided'}
      - Interests: ${userProfile.interests?.join(', ') || 'Not provided'}

      **User's Additional Notes:**
      ${additionalNotes || 'None'}

      **Your Analysis Must Include:**
      1.  **Basic Details:** Extract 'name', 'type', 'amount', 'quantity', and 'ticker' from the image.
      2.  **Core Metrics:** Provide a 'riskScore' (1-10), an overall 'grade' ('A' to 'F'), and an 'roiEstimate' (a number representing the percentage, without the '%' sign).
      3.  **Detailed Explanation:** Provide a comprehensive, multi-paragraph 'analysisExplanation'. This is the most important part. It must:
          - Justify the risk score, grade, and ROI estimate.
          - Connect the investment directly to the user's profile (goals, risk, experience).
          - Explain how this investment fits (or doesn't fit) into their strategy.
          - Mention any potential red flags or opportunities.
          - Be written in a clear, encouraging, and professional tone.

      **Output Format:**
      Return a single, clean JSON object with all the fields mentioned above. Do not include any text outside of the JSON object.
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this investment based on my profile and the provided screenshot." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 2000,
    });

    fs.unlinkSync(filePath);

    const investmentData = JSON.parse(aiResponse.choices[0].message.content);
    res.status(200).json(investmentData);

  } catch (error) {
    console.error('Error in analyze-screenshot:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to analyze screenshot.', details: error.message });
  }
}
