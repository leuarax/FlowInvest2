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
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Run multer middleware to handle file upload
    await runMiddleware(req, res, upload.single('screenshot'));

    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file uploaded.' });
    }

    const filePath = req.file.path;

    // Read the file and convert to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert financial assistant. Analyze the provided screenshot of a single investment and extract its details. Return a single JSON object with the following fields: 'name', 'type', 'amount', 'purchaseDate', 'quantity', and 'ticker'. In addition, provide an analysis with 'riskScore' (1-10), 'grade' ('A' to 'F'), and 'roiEstimate' (a percentage). If a field is not present in the image, set its value to 'unknown' or a reasonable default.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this investment screenshot and return its details in JSON format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    const investmentData = JSON.parse(aiResponse.choices[0].message.content);

    // Send the successful response
    res.status(200).json(investmentData);

  } catch (error) {
    console.error('Error in analyze-screenshot:', error);
    // Clean up file on error if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to analyze screenshot.', details: error.message });
  }
}
