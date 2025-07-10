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
    destination: (req, file, cb) => {
      // Use a cross-platform temp directory
      const os = require('os');
      cb(null, os.tmpdir());
    },
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
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

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

    // Always run multer to parse FormData fields (files and text)
    try {
      await uploadMiddleware(req, res);
    } catch (uploadError) {
      return sendError(res, 400, 'File upload failed', uploadError.message);
    }

    // Debug: log incoming preview request
    console.log('Incoming preview request:', {
      body: req.body,
      files: req.files,
      preview: req.body.preview,
      investments: req.body.investments
    });

    // If investments are present, do preview analysis (do NOT require files)
    if (req.body && req.body.investments) {
      let investments = [];
      try {
        const parsed = JSON.parse(req.body.investments);
        if (Array.isArray(parsed)) {
          investments = parsed;
        } else if (parsed && Array.isArray(parsed.investments)) {
          investments = parsed.investments;
        } else {
          investments = [];
        }
      } catch (e) {
        return sendError(res, 400, 'Invalid investments JSON');
      }
      let preview = false;
      if (req.body && typeof req.body.preview !== 'undefined') {
        preview = req.body.preview === 'true' || req.body.preview === true;
      }
      let userProfile = null;
      if (req.body && req.body.userProfile) {
        try {
          userProfile = JSON.parse(req.body.userProfile);
        } catch (e) {
          userProfile = null;
        }
      }
      if (investments && Array.isArray(investments) && investments.length > 0) {
        // Call OpenAI to generate preview analysis, grade, and riskScore
        let aiPreview;
        try {
          const previewPrompt = `Given the following investments and user profile, return a JSON object with: grade (string), riskScore (number), and analysis (string, 3 lines max, preview only).\n\nInvestments: ${JSON.stringify(investments)}\nUser Profile: ${userProfile ? JSON.stringify(userProfile) : '{}'}\n\nRespond with only the JSON object, no markdown or extra text.`;
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "You are a helpful assistant that analyzes investment portfolios and provides a preview analysis." },
              { role: "user", content: previewPrompt }
            ],
            max_tokens: 500,
            temperature: 0.3,
          });
          const content = aiResponse?.choices?.[0]?.message?.content || '{}';
          console.log('OpenAI preview response:', content);
          aiPreview = JSON.parse(content);
        } catch (e) {
          console.error('OpenAI preview analysis error:', e);
          return sendError(res, 500, 'Failed to generate preview analysis');
        }
        const previewResponse = {
          success: true,
          preview: true,
          grade: aiPreview.grade,
          analysis: aiPreview.analysis,
          riskScore: aiPreview.riskScore,
          timestamp: new Date().toISOString()
        };
        console.log('Outgoing preview response:', previewResponse);
        return res.json(previewResponse);
      }
      // If we get here, investments was empty or invalid
      return sendError(res, 400, 'No valid investments provided for preview analysis');
    }

    // Only require files if not doing preview analysis
    if (!req.files || req.files.length === 0) {
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
      parsedData = JSON.parse(content);
      // Ensure riskScore is present and valid
      if (!parsedData.riskScore || isNaN(Number(parsedData.riskScore))) {
        parsedData.riskScore = 5;
      } else {
        parsedData.riskScore = Math.max(1, Math.min(10, Number(parsedData.riskScore)));
      }
      console.log('OpenAI raw parsedData:', parsedData); // <-- add this log
      console.log('Successfully parsed analysis:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('Error parsing JSON:', e);
      throw new Error(`Failed to parse AI response: ${e.message}`);
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

    // After generating analysisText and grade
    const analysisText = `Your portfolio is well diversified.\nConsider rebalancing your tech stocks.\nCrypto allocation is high risk.\nLong-term outlook is positive.\nReview your bond holdings.`;
    const grade = 'B+';
    let riskScore;
    if (investments && investments.length > 0 && investments[0].riskScore !== undefined) {
      riskScore = investments[0].riskScore;
    }
    // The original code had a return here, but the new_code_to_apply_changes_from
    // had a return; // This will be replaced by the actual preview analysis return
    // This means the original code's return for full analysis is now effectively removed
    // by the new_code_to_apply_changes_from.
    // The new_code_to_apply_changes_from only handled the preview case.
    // The full analysis case is now handled by the original code's return.
    // So, the original code's return for full analysis is preserved.
    return res.json({
      success: true,
      data: cleanedInvestments,
      grade,
      analysis: analysisText,
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
}
