// This is a Vercel serverless function that handles the analyze-portfolio endpoint
import multer from 'multer';
import { createServer } from 'http';
import { parse } from 'url';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware to handle multipart/form-data
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.single('screenshot')(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    await uploadMiddleware(req, res);
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please upload a screenshot file with the key "screenshot"' 
      });
    }

    console.log('Processing file:', req.file.path);
    
    // Read the uploaded file
    const imageBuffer = await fs.readFile(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    
    // Clean up the file
    await fs.unlink(req.file.path).catch(console.error);
    
    // Call OpenAI API with the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this portfolio screenshot and return a JSON array of investments. Each investment should have: name, type (Stock, Crypto, etc.), amount (current value), and purchaseDate. Format: [{name: string, type: string, amount: number, purchaseDate: string}]" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    console.log('Raw AI response:', content);
    
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    console.log('Extracted JSON string:', jsonString);
    
    // Clean and parse the JSON
    const cleanedJsonString = jsonString
      .replace(/```/g, '')
      .replace(/^\s*\[\s*\{/s, '[{')
      .replace(/\}\]\s*$/s, '}]')
      .trim();
      
    console.log('Cleaned JSON string:', cleanedJsonString);
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJsonString);
      console.log('Successfully parsed JSON:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return res.status(400).json({ 
        error: 'Failed to parse AI response',
        details: e.message,
        response: content
      });
    }
    
    // Ensure we have an array of investments
    const investments = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    console.log('Processed investments array:', investments);
    
    // Validate and clean up the investment data
    const cleanedInvestments = investments.map(inv => ({
      name: inv.name || 'Unknown',
      type: inv.type || 'Stock',
      amount: parseFloat(inv.amount || inv.currentValue || 0),
      roiEstimate: 0, // Will be set by analysis
      riskScore: 5,   // Default risk score
      grade: 'B',     // Default grade
      date: inv.purchaseDate || new Date().toISOString().split('T')[0],
      duration: 'Long-term' // Default duration
    })).filter(inv => inv.name !== 'Unknown' && inv.amount > 0);
    
    console.log('Final cleaned investments:', cleanedInvestments);
    
    if (cleanedInvestments.length === 0) {
      return res.status(400).json({ 
        error: 'No valid investments found',
        details: 'Could not extract any valid investments from the image'
      });
    }
    
    // Return the investments as an array directly
    return res.json(cleanedInvestments);
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Failed to process portfolio',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
