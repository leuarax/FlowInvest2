// This is a Vercel serverless function that handles the analyze-portfolio endpoint
// Log function start
console.log('Analyze portfolio function starting...');

import multer from 'multer';
import { createServer } from 'http';
import { parse } from 'url';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Log environment variables (except sensitive ones)
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : 'Not set'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

console.log('OpenAI client initialized');

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

// Helper function to send error response
function sendError(res, status, message, details = '') {
  console.error(`Error ${status}: ${message}`, details);
  return res.status(status).json({
    error: message,
    details: details.toString(),
    timestamp: new Date().toISOString()
  });
}

export default async function handler(req, res) {
  console.log(`\n--- New Request: ${req.method} ${req.url} ---`);
  
  try {
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
      console.log('Handling OPTIONS preflight request');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log(`Method ${req.method} not allowed`);
      return sendError(res, 405, 'Method not allowed');
    }
    
    console.log('Processing POST request');

    try {
      console.log('Starting file upload handling');
      
      // Handle file upload
      try {
        await uploadMiddleware(req, res);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return sendError(res, 400, 'File upload failed', uploadError.message);
      }
      
      if (!req.file) {
        console.error('No file in request');
        return sendError(res, 400, 'No file uploaded', 'Please upload a screenshot file with the key "screenshot"');
      }
      
      console.log('File uploaded successfully:', req.file);

      console.log('Processing file:', req.file.path);
      
      // Read the uploaded file
      const imageBuffer = await fs.readFile(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      
      // Clean up the file
      try {
        await fs.unlink(req.file.path);
        console.log('Temporary file cleaned up');
      } catch (cleanupError) {
        console.warn('Could not delete temporary file:', cleanupError);
      }
      
      console.log('Calling OpenAI API...');
      
      // Call OpenAI API with the image
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "Analyze this portfolio screenshot and return a JSON array of investments. Each investment should have: name, type (Stock, Crypto, etc.), amount (current value), and purchaseDate. Format: [{name: string, type: string, amount: number, purchaseDate: string}]" 
                },
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
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        throw new Error(`OpenAI API request failed: ${apiError.message}`);
      }

      const content = response?.choices?.[0]?.message?.content || '[]';
      console.log('Raw AI response received, length:', content.length);
      
      if (!content || content.trim() === '') {
        throw new Error('Empty response from OpenAI');
      }
      
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
      
      console.log('Sending successful response with', cleanedInvestments.length, 'investments');
      
      // Return the investments as an array directly
      return res.json({
        success: true,
        data: cleanedInvestments,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error processing request:', error);
      
      // More detailed error information
      const errorInfo = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      };
      
      console.error('Error details:', JSON.stringify(errorInfo, null, 2));
      
      return res.status(500).json({
        error: 'Failed to process portfolio',
        details: error.message,
        ...(process.env.NODE_ENV === 'development' && { debug: errorInfo })
      });
    }
  } catch (error) {
    console.error('Outer error handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.toString(),
        stack: error.stack 
      })
    });
  }
}
