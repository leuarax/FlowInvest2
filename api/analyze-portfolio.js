// This is a Vercel serverless function that handles the analyze-portfolio endpoint
// Log function start
console.log('Analyze portfolio function starting...');

// Use CommonJS require instead of ES modules
const multer = require('multer');
const { createServer } = require('http');
const { parse } = require('url');
const { join } = require('path');
const { fileURLToPath } = require('url');
const { dirname } = require('path');
const { promises: fs } = require('fs');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

// Log environment variables (except sensitive ones)
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY ? '***' : 'Not set'
});

// __filename and __dirname are already available in CommonJS

// Initialize OpenAI
if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.error('REACT_APP_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

// Middleware to handle multipart/form-data for multiple files
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    // Use 'array' to handle multiple files. 'screenshots' is the field name. 10 is the max count.
    upload.array('screenshots', 10)(req, res, (err) => {
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

// Export the handler function using module.exports for CommonJS
module.exports = async function handler(req, res) {
  console.log(`\n--- New Request: ${req.method} ${req.url} ---`);
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // In production, restrict this to your frontend's domain
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
      
      // Handle file uploads
      try {
        await uploadMiddleware(req, res);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return sendError(res, 400, 'File upload failed', uploadError.message);
      }
      
      if (!req.files || req.files.length === 0) {
        console.error('No files in request');
        return sendError(res, 400, 'No files uploaded', 'Please upload one or more screenshot files with the key "screenshots"');
      }
      
      console.log(`Files uploaded successfully: ${req.files.length} files`);

      const imageContents = [];
      for (const file of req.files) {
          console.log('Processing file:', file.path);
          const imageBuffer = await fs.readFile(file.path);
          const base64Image = imageBuffer.toString('base64');
          imageContents.push({
              type: "image_url",
              image_url: {
                  url: `data:image/png;base64,${base64Image}`,
              },
          });
      }

      // Clean up the files
      for (const file of req.files) {
          try {
              await fs.unlink(file.path);
              console.log(`Temporary file cleaned up: ${file.path}`);
          } catch (cleanupError) {
              console.warn(`Could not delete temporary file: ${file.path}`, cleanupError);
          }
      }
      
      console.log('Calling OpenAI API...');
      
      // Call OpenAI API with the images
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that analyzes portfolio screenshots and returns investment data in a specific JSON format. Consolidate all investments from all provided images into a single list."
            },
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `Analyze these portfolio screenshots and return a single JSON object with an 'investments' array. Each investment should have: name, type (Stock, Crypto, etc.), and amount (current value). Consolidate all investments from all images into this single array.\n                  \n                  Example format: \n                  {\n                    "investments": [\n                      {\n                        "name": "Apple Inc.",\n                        "type": "Stock",\n                        "amount": 1500.50\n                      },\n                      {\n                        "name": "Bitcoin",\n                        "type": "Crypto",\n                        "amount": 2300.75\n                      }\n                    ]\n                  }\n                  \n                  Only return the JSON object with no additional text or markdown formatting.`
                },
                ...imageContents, // Spread the array of image objects
              ],
            },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        });
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        throw new Error(`OpenAI API request failed: ${apiError.message}`);
      }

      const content = response?.choices?.[0]?.message?.content || '{}';
      console.log('Raw AI response received, length:', content.length);
      
      if (!content || content.trim() === '') {
        throw new Error('Empty response from OpenAI');
      }
      
      console.log('AI Response:', content);
      
      let parsedData;
      try {
        // Try to parse the content directly as JSON
        parsedData = JSON.parse(content);
        
        // If the response has an investments array, use it
        if (parsedData.investments && Array.isArray(parsedData.investments)) {
          parsedData = parsedData.investments;
        } else if (Array.isArray(parsedData)) {
          // If it's already an array, use it directly
          parsedData = parsedData;
        } else {
          // If it's an object but not in expected format, try to convert it
          parsedData = Object.entries(parsedData).map(([key, value]) => ({
            name: key,
            ...(typeof value === 'object' ? value : { amount: value })
          }));
        }
        
        console.log('Successfully parsed investments:', JSON.stringify(parsedData, null, 2));
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
          details: 'Could not extract any valid investments from the image(s)'
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
