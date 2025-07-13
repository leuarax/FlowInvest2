const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const multer = require('multer');

// Configure multer for file uploads - use memory storage for Vercel
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

module.exports = async (req, res) => {
  // Handle file upload with multer - support both 'screenshot' and 'screenshots' field names
  upload.fields([
    { name: 'screenshot', maxCount: 1 },
    { name: 'screenshots', maxCount: 10 }
  ])(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message
      });
    }

    console.log('Received request to analyze portfolio screenshots');
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('User profile in request:', req.body?.userProfile);
    
    // Extract files from multer fields structure
    let files = [];
    if (req.files) {
      if (req.files.screenshot && req.files.screenshot.length > 0) {
        files = files.concat(req.files.screenshot);
      }
      if (req.files.screenshots && req.files.screenshots.length > 0) {
        files = files.concat(req.files.screenshots);
      }
    }
    // Fallback for backward compatibility
    if (files.length === 0 && req.file) {
      files = [req.file];
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        details: 'Please ensure you are sending files with the key "screenshots" or "screenshot"'
      });
    }

  try {
    // Process all uploaded files
    const allInvestments = [];
    
    for (const file of files) {
      console.log('Processing file:', file.originalname);
      
      // Read the uploaded file from memory
      console.log('Reading uploaded file from memory');
      const imageBuffer = file.buffer;
      const base64Image = imageBuffer.toString('base64');
      
      if (!base64Image || base64Image.length < 100) {
        console.warn('Invalid image data for file:', file.originalname);
        continue;
      }
      
      console.log('Image read successfully, size:', base64Image.length, 'chars');

      // Prepare the prompt for batch analysis
      const prompt = `Analyze this investment portfolio screenshot and identify all individual investments. 
For each investment, extract:
- name (string)
- type (string: Stock, ETF, Crypto, etc.)
- amount (number)
- currentValue (number, if visible)
- quantity (number, if visible)
- purchaseDate (string in YYYY-MM-DD format, if visible)
- brokerage (string, if visible)

Return a JSON array of investment objects. Only include data that is clearly visible in the image.`;

      console.log('Calling OpenAI API for batch analysis...');
      
      try {
        const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
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
        ],
        max_tokens: 3000,
        });

      console.log('Received batch analysis from OpenAI for file:', file.originalname);

        // No cleanup needed for memory storage

        // Parse the AI response
        console.log('Received response from OpenAI');
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
        continue; // Skip this file if JSON parsing fails
      }
        
      // Ensure we have an array of investments
      const investments = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      console.log('Processed investments array:', investments);
      
      // Validate and clean up the investment data
      const cleanedInvestments = investments.map(inv => {
        const cleanInv = {
          name: inv.name || 'Unknown',
          type: inv.type || 'Stock',
          amount: parseFloat(inv.amount || inv.currentValue || 0),
          roiEstimate: 0, // Will be set by analysis
          riskScore: 5,   // Default risk score
          grade: 'B',     // Default grade
          date: inv.purchaseDate || new Date().toISOString().split('T')[0],
          duration: 'Long-term' // Default duration
        };
        
        console.log('Cleaned investment:', cleanInv);
        return cleanInv;
      }).filter(inv => {
        const isValid = inv.name !== 'Unknown' && inv.amount > 0;
        if (!isValid) {
          console.log('Filtering out invalid investment:', inv);
        }
        return isValid;
      });
      
      // Add to all investments
      allInvestments.push(...cleanedInvestments);
      
      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        // Continue with other files
      }
    }
    
    console.log('Final all investments:', allInvestments);
    
    if (allInvestments.length === 0) {
      throw new Error('No valid investments found in any of the uploaded images');
    }

    // Generate AI analysis for each investment to add missing fields
    console.log('Generating AI analysis for extracted investments...');
    console.log('Number of investments to analyze:', allInvestments.length);
    const enhancedInvestments = [];
    
    // Get user profile from request body if available (for personalized analysis)
    let userProfile = null;
    if (req.body && req.body.userProfile) {
      try {
        userProfile = JSON.parse(req.body.userProfile);
      } catch (e) {
        console.log('Could not parse user profile, using default analysis');
      }
    }
    
    // Default user profile if not provided (for consistent analysis)
    const defaultUserProfile = {
      experience: 'intermediate',
      riskTolerance: 'moderate',
      interests: ['Stocks', 'ETFs'],
      primaryGoal: 'Long-term growth'
    };
    
    const analysisUserProfile = userProfile || defaultUserProfile;
    
    for (const investment of allInvestments) {
      console.log('Starting analysis for investment:', investment.name);
      try {
        // Use the exact same analysis method as api/investment.js
        const prompt = `
          As an expert financial analyst, you are analyzing an investment for a client.

          You will be given the user's profile and the investment details. Use this information as follows:

          1.  **Grade**: Determine the investment 'grade' (e.g., A+, B-, C) by comparing the investment to the user's profile (their experience, risk tolerance, and interests). A grade of 'A' means it's a perfect match for them, while a grade of 'F' means it's a very poor fit.
          2.  **Risk, ROI, and Explanation**: The rest of your analysis (riskScore, roiEstimate, explanation) should be based *only* on the investment's own characteristics, disregarding the user's profile.
          3.  **Explanation Tone**: In your explanation, address the user directly.

          User Profile:
          - Experience: ${analysisUserProfile.experience}
          - Risk Tolerance: ${analysisUserProfile.riskTolerance}
          - Interests: ${Array.isArray(analysisUserProfile.interests) ? analysisUserProfile.interests.join(', ') : analysisUserProfile.interests}
          - Investment Goal: ${analysisUserProfile.primaryGoal}

          Investment Details:
          - Type: ${investment.type}
          - Name: ${investment.name}
          - Amount: $${investment.amount}
          - Start Date: ${investment.date}

          Please provide the following in a single JSON object:
          - "grade": The letter grade based on the match with the user's profile.
          - "riskScore": A numerical risk score from 1 (very low risk) to 10 (very high risk). Your calculation must follow these rules:
              - **Asset Class**: Bonds, Real Estate, and Commodities should generally receive lower risk scores than equities.
              - **Company Maturity**: Well-established, large-cap companies (e.g., 'blue-chip' stocks) should have lower risk scores than new startups or highly volatile assets.
          - "riskExplanation": A brief, one-sentence explanation for the assigned risk score, justifying the number based on the asset class or company maturity.
          - "roiScenarios": A JSON object containing three ROI estimates for different market conditions: "pessimistic", "realistic", and "optimistic".
          - "roiEstimate": A numerical value representing the average of the three ROI scenarios, calculated as (pessimistic + realistic + optimistic) / 3. Do not include a '%' sign.
          - "explanation": A detailed, multi-sentence explanation of your overall analysis. Address the user directly and explain your reasoning for the grade and ROI.
        `;

        const analysisResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a senior financial analyst that provides detailed investment analysis." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        });

        const analysisContent = analysisResponse?.choices?.[0]?.message?.content || '{}';
        let analysis;
        try {
          analysis = JSON.parse(analysisContent);
          
          // Ensure all required fields are present (same validation as api/investment.js)
          if (!analysis.grade || !analysis.riskScore || !analysis.roiEstimate || !analysis.explanation) {
            throw new Error('Incomplete analysis response from AI');
          }
          
          // Ensure riskScore is a number between 1-10
          analysis.riskScore = Math.max(1, Math.min(10, Number(analysis.riskScore) || 5));
          
          // Ensure roiEstimate is a number, parsing it robustly
          let roiEstimate = 0;
          if (typeof analysis.roiEstimate === 'string') {
            // Strip any non-numeric characters (like '%') and parse
            roiEstimate = parseFloat(analysis.roiEstimate.replace(/[^0-9.-]+/g, ""));
          } else if (typeof analysis.roiEstimate === 'number') {
            roiEstimate = analysis.roiEstimate;
          }
          analysis.roiEstimate = isNaN(roiEstimate) ? 0 : roiEstimate;
          
        } catch (parseError) {
          console.error('Error parsing analysis response:', parseError);
          throw new Error('Failed to parse analysis response');
        }

        // Merge the analysis with the investment data (same structure as onboarding)
        const enhancedInvestment = {
          ...investment,
          roiEstimate: analysis.roiEstimate,
          riskScore: analysis.riskScore,
          grade: analysis.grade,
          explanation: analysis.explanation,
          riskExplanation: analysis.riskExplanation,
          roiScenarios: analysis.roiScenarios || {
            pessimistic: (analysis.roiEstimate || 8.5) * 0.8,
            realistic: analysis.roiEstimate || 8.5,
            optimistic: (analysis.roiEstimate || 8.5) * 1.2
          }
        };

        enhancedInvestments.push(enhancedInvestment);
        console.log('Enhanced investment:', enhancedInvestment.name, 'with analysis');
        console.log('Analysis details:', {
          roiEstimate: enhancedInvestment.roiEstimate,
          riskScore: enhancedInvestment.riskScore,
          grade: enhancedInvestment.grade,
          hasExplanation: !!enhancedInvestment.explanation,
          hasRoiScenarios: !!enhancedInvestment.roiScenarios
        });

      } catch (analysisError) {
        console.error('Error analyzing investment:', investment.name, analysisError);
        console.error('Analysis error details:', analysisError.message);
        // Keep the investment with default values if analysis fails (same as onboarding)
        const investmentWithBasicAnalysis = {
          ...investment,
          grade: 'B',
          riskScore: 5,
          roiEstimate: 8.5,
          roiScenarios: {
            pessimistic: 6.8,
            realistic: 8.5,
            optimistic: 10.2
          },
          explanation: 'Investment from Fast Add Portfolio (basic analysis)'
        };
        enhancedInvestments.push(investmentWithBasicAnalysis);
      }
    }
    
    // Return the enhanced investments wrapped in a data property to match expected format
    console.log('Final enhanced investments count:', enhancedInvestments.length);
    console.log('Final enhanced investments:', enhancedInvestments.map(inv => ({
      name: inv.name,
      roiEstimate: inv.roiEstimate,
      riskScore: inv.riskScore,
      grade: inv.grade,
      hasExplanation: !!inv.explanation,
      hasRoiScenarios: !!inv.roiScenarios
    })));
    console.log('Sending response with data property');
    return res.json({ data: enhancedInvestments });
    
  } catch (error) {
    console.error('Error in batch analysis:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type,
      response: error.response?.data
    });
    
    let errorMessage = 'Failed to analyze portfolio';
    let details = error.message;
    
    // Handle specific OpenAI API errors
    if (error.code === 'model_not_found') {
      errorMessage = 'Model not found';
      details = 'The requested AI model is not available. Please check your OpenAI API access.';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid API Key';
      details = 'The provided OpenAI API key is invalid. Please check your configuration.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate Limit Exceeded';
      details = 'You have exceeded your API rate limit. Please try again later.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: details,
      code: error.code,
      type: error.type
    });
  }
  });
};
