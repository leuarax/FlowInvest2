const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Configure multer for file uploads - use memory storage for Vercel
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY,
});

async function analyzeScreenshot(req, res) {
  let imagePath;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const additionalNotes = req.body.additionalNotes || '';
    const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : null;

    // Read the image file from memory
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    // Prepare the prompt with user profile context
    let userContext = '';
    if (userProfile) {
      userContext = `
User Profile Information:
- Experience Level: ${userProfile.experience || 'Not specified'}
- Risk Tolerance: ${userProfile.riskTolerance || 'Not specified'}
- Investment Interests: ${userProfile.interests ? userProfile.interests.join(', ') : 'Not specified'}
- Primary Goal: ${userProfile.primaryGoal || 'Not specified'}
- Investment Timeline: ${userProfile.timeline || 'Not specified'}

Please consider the user's profile when analyzing this investment. Adjust your recommendations based on their experience level, risk tolerance, and investment goals.`;
    }

    const prompt = `You are a senior financial analyst. Analyze the investment screenshot and the user's notes to identify ALL individual investments shown. 

Return a single, valid JSON array. Each element in the array MUST be a JSON object with these exact fields and data types:
- "name" (string): The name of the investment
- "type" (string): The type of investment (e.g., Stock, ETF, Bond, etc.)
- "amount" (number): The investment amount (e.g., 126.50)
- "duration" (string): One of "Short-term (0-1 year)", "Mid-term (1-5 years)", "Long-term (5+ years)"
- "grade" (string): One of "A", "B", "C", "D", "F" - based on the investment's quality and potential
- "riskScore" (number): An integer from 1 to 10 (1 = very low risk, 10 = very high risk)
- "roiEstimate" (number): Expected yearly return percentage (e.g., 15.5)
- "roiScenarios" (object): A JSON object with three fields for YEARLY returns:
  - "pessimistic" (number): Worst-case scenario yearly ROI
  - "realistic" (number): Most likely scenario yearly ROI  
  - "optimistic" (number): Best-case scenario yearly ROI
- "explanation" (string): A detailed, multi-sentence explanation of your analysis. Address the user directly and explain your reasoning for the grade, risk score, and ROI estimates. Consider their experience level, risk tolerance, and investment goals. Keep it concise but informative.

If there are multiple investments, each must be a separate object in the array. If there is only one, return an array with one object. Do not summarize or merge investments. Do NOT wrap it in markdown.

The user's notes are: "${additionalNotes}".${userContext}`;

    console.log('Calling OpenAI API with image...');
    
    // Call OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: "You are a financial data extraction assistant. Always return a JSON array of investments, one object per investment, never summarize or merge, and never wrap in markdown."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ]
    });

    console.log('Received response from OpenAI API');
    
    // Parse the response
    let analysis;
    
    try {
      let responseContent = response.choices[0].message.content;
      console.log('Raw AI response:', responseContent);

      // Universal JSON extractor from markdown or plain text
      let jsonString = responseContent;
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

      if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1].trim();
      }

      // If no markdown found, or if the result is still not clean JSON, try to find the JSON object/array directly
      const firstBracket = jsonString.indexOf('[');
      const lastBracket = jsonString.lastIndexOf(']');
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBracket !== -1 && lastBracket > firstBracket) {
          // It's likely an array
          jsonString = jsonString.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace > firstBrace) {
          // It's likely an object
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }

      console.log('Processing response content:', jsonString);
      analysis = JSON.parse(jsonString);

      // If the AI returns an array, sanitize each investment
      if (Array.isArray(analysis)) {
        analysis = analysis.map(rawAnalysis => {
          const sanitizedAnalysis = {};
          sanitizedAnalysis.name = rawAnalysis.name || 'Investment from Screenshot';
          sanitizedAnalysis.type = rawAnalysis.type || 'Unknown';
          // Amount
          let amount = 0;
          if (typeof rawAnalysis.amount === 'string') {
            amount = parseFloat(rawAnalysis.amount.replace(/[^0-9.-]+/g, ""));
          } else if (typeof rawAnalysis.amount === 'number') {
            amount = rawAnalysis.amount;
          }
          sanitizedAnalysis.amount = isNaN(amount) ? 0 : amount;
          // Duration
          const validDurations = ["Short-term (0-1 year)", "Mid-term (1-5 years)", "Long-term (5+ years)"];
          sanitizedAnalysis.duration = validDurations.includes(rawAnalysis.duration) ? rawAnalysis.duration : 'Unknown';
          // Grade
          const validGrades = ["A", "B", "C", "D", "F"];
          sanitizedAnalysis.grade = validGrades.includes(rawAnalysis.grade) ? rawAnalysis.grade : 'N/A';
          // Risk Score
          let riskScore = 5; // Default
          if (typeof rawAnalysis.riskScore === 'number') {
            riskScore = Math.max(1, Math.min(10, rawAnalysis.riskScore));
          } else if (typeof rawAnalysis.riskScore === 'string') {
            const riskString = rawAnalysis.riskScore.toLowerCase();
            if (riskString.includes('low')) riskScore = 3;
            else if (riskString.includes('moderate')) riskScore = 6;
            else if (riskString.includes('high')) riskScore = 8;
            else {
              const parsedInt = parseInt(riskString, 10);
              if (!isNaN(parsedInt)) {
                riskScore = Math.max(1, Math.min(10, parsedInt));
              }
            }
          }
          sanitizedAnalysis.riskScore = riskScore;
          // ROI Estimate
          let roiEstimate = 0;
          if (typeof rawAnalysis.roiEstimate === 'string') {
            roiEstimate = parseFloat(rawAnalysis.roiEstimate.replace(/[^0-9.-]+/g, ""));
          } else if (typeof rawAnalysis.roiEstimate === 'number') {
            roiEstimate = rawAnalysis.roiEstimate;
          }
          sanitizedAnalysis.roiEstimate = isNaN(roiEstimate) ? 0 : roiEstimate;
          
          // ROI Scenarios
          if (rawAnalysis.roiScenarios && typeof rawAnalysis.roiScenarios === 'object') {
            sanitizedAnalysis.roiScenarios = {
              pessimistic: typeof rawAnalysis.roiScenarios.pessimistic === 'number' ? rawAnalysis.roiScenarios.pessimistic : roiEstimate * 0.8,
              realistic: typeof rawAnalysis.roiScenarios.realistic === 'number' ? rawAnalysis.roiScenarios.realistic : roiEstimate,
              optimistic: typeof rawAnalysis.roiScenarios.optimistic === 'number' ? rawAnalysis.roiScenarios.optimistic : roiEstimate * 1.2
            };
          } else {
            // Default ROI scenarios if not provided
            sanitizedAnalysis.roiScenarios = {
              pessimistic: roiEstimate * 0.8,
              realistic: roiEstimate,
              optimistic: roiEstimate * 1.2
            };
          }
          
          sanitizedAnalysis.explanation = rawAnalysis.explanation || 'No explanation provided.';
          return sanitizedAnalysis;
        });
      } else {
        // Fallback: single object
        const rawAnalysis = analysis;
        const sanitizedAnalysis = {};
        sanitizedAnalysis.name = rawAnalysis.name || 'Investment from Screenshot';
        sanitizedAnalysis.type = rawAnalysis.type || 'Unknown';
        let amount = 0;
        if (typeof rawAnalysis.amount === 'string') {
          amount = parseFloat(rawAnalysis.amount.replace(/[^0-9.-]+/g, ""));
        } else if (typeof rawAnalysis.amount === 'number') {
          amount = rawAnalysis.amount;
        }
        sanitizedAnalysis.amount = isNaN(amount) ? 0 : amount;
        const validDurations = ["Short-term (0-1 year)", "Mid-term (1-5 years)", "Long-term (5+ years)"];
        sanitizedAnalysis.duration = validDurations.includes(rawAnalysis.duration) ? rawAnalysis.duration : 'Unknown';
        const validGrades = ["A", "B", "C", "D", "F"];
        sanitizedAnalysis.grade = validGrades.includes(rawAnalysis.grade) ? rawAnalysis.grade : 'N/A';
        let riskScore = 5;
        if (typeof rawAnalysis.riskScore === 'number') {
          riskScore = Math.max(1, Math.min(10, rawAnalysis.riskScore));
        } else if (typeof rawAnalysis.riskScore === 'string') {
          const riskString = rawAnalysis.riskScore.toLowerCase();
          if (riskString.includes('low')) riskScore = 3;
          else if (riskString.includes('moderate')) riskScore = 6;
          else if (riskString.includes('high')) riskScore = 8;
          else {
            const parsedInt = parseInt(riskString, 10);
            if (!isNaN(parsedInt)) {
              riskScore = Math.max(1, Math.min(10, parsedInt));
            }
          }
        }
        sanitizedAnalysis.riskScore = riskScore;
        let roiEstimate = 0;
        if (typeof rawAnalysis.roiEstimate === 'string') {
          roiEstimate = parseFloat(rawAnalysis.roiEstimate.replace(/[^0-9.-]+/g, ""));
        } else if (typeof rawAnalysis.roiEstimate === 'number') {
          roiEstimate = rawAnalysis.roiEstimate;
        }
        sanitizedAnalysis.roiEstimate = isNaN(roiEstimate) ? 0 : roiEstimate;
        
        // ROI Scenarios
        if (rawAnalysis.roiScenarios && typeof rawAnalysis.roiScenarios === 'object') {
          sanitizedAnalysis.roiScenarios = {
            pessimistic: typeof rawAnalysis.roiScenarios.pessimistic === 'number' ? rawAnalysis.roiScenarios.pessimistic : roiEstimate * 0.8,
            realistic: typeof rawAnalysis.roiScenarios.realistic === 'number' ? rawAnalysis.roiScenarios.realistic : roiEstimate,
            optimistic: typeof rawAnalysis.roiScenarios.optimistic === 'number' ? rawAnalysis.roiScenarios.optimistic : roiEstimate * 1.2
          };
        } else {
          // Default ROI scenarios if not provided
          sanitizedAnalysis.roiScenarios = {
            pessimistic: roiEstimate * 0.8,
            realistic: roiEstimate,
            optimistic: roiEstimate * 1.2
          };
        }
        
        sanitizedAnalysis.explanation = rawAnalysis.explanation || 'No explanation provided.';
        analysis = [sanitizedAnalysis];
      }
    } catch (e) {
      console.error('Error parsing analysis response:', e);
      console.error('Raw response content:', response.choices[0].message.content);
      
      const content = response.choices[0].message.content;
      
      // Check if the AI is saying it can't process the image
      if (content.toLowerCase().includes('unable to process') || 
          content.toLowerCase().includes('unable to extract') || 
          content.toLowerCase().includes('cannot see') ||
          content.toLowerCase().includes('cannot identify')) {
        
        return res.status(400).json({
          error: 'Screenshot Analysis Failed',
          message: 'The image does not contain clear investment information. Please upload a screenshot that shows: stock names, investment amounts, portfolio values, or other financial data.',
          details: 'Try uploading a screenshot from your broker that clearly displays investment holdings, stock symbols, or portfolio information.'
        });
      }
      
      // For other parsing errors, return a generic error
      return res.status(500).json({
        error: 'Analysis Error',
        message: 'Failed to analyze the screenshot. Please try again with a different image.',
        details: 'The analysis could not be completed. Please ensure the image is clear and contains investment-related information.'
      });
    }
    
    // Add additional metadata to each investment
    if (Array.isArray(analysis)) {
      analysis.forEach(inv => {
        inv.analysisDate = new Date().toISOString();
        inv.source = 'screenshot';
      });
    }
    
    // Return the analysis
    return res.json(analysis);
    
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze screenshot',
      details: error.message 
    });
  } finally {
    // No cleanup needed for memory storage
  }
}

module.exports = async (req, res) => {
  // Handle file upload with multer
  upload.single('screenshot')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message
      });
    }
    
    await analyzeScreenshot(req, res);
  });
};
