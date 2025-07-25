const OpenAI = require('openai');

// Get API key from environment variables - use REACT_APP_ prefix for Vercel
const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

// Log environment variables (except sensitive ones)
console.log('Environment variables available:', Object.keys(process.env));
console.log('API key source:', apiKey ? 'Available' : 'Not found');

// Check if API key exists
if (!apiKey) {
  console.error('Error: No API key found in environment variables');
  console.log('Available environment variables:', process.env);
  throw new Error('No API key found in environment variables');
}

// Validate API key format
if (!apiKey.startsWith('sk-')) {
  console.error('Error: Invalid API key format');
  console.log('API key:', apiKey);
  throw new Error('Invalid API key format');
}

// Initialize OpenAI with logging
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.openai.com/v1'
});

// Continue with the main export
module.exports = async (req, res) => {
  try {
    console.log('Received investment analysis request');
    console.log('Request body:', req.body);
    
    if (!req.body) {
      console.error('Error: No request body received');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const { investmentData, userProfile } = req.body;

    if (!investmentData || !userProfile) {
      console.error('Error: Missing required data');
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    console.log('Generating prompt for investment analysis');
    const prompt = `
      As an expert financial analyst, you are analyzing an investment for a client.

      You will be given the user's profile and the investment details. Use this information as follows:

      1.  **Grade**: Determine the investment 'grade' (e.g., A+, B-, C) by comparing the investment to the user's profile (their experience, risk tolerance, and interests). A grade of 'A' means it's a perfect match for them, while a grade of 'F' means it's a very poor fit.
      2.  **Risk, ROI, and Explanation**: The rest of your analysis (riskScore, roiEstimate, explanation) should be based *only* on the investment's own characteristics, disregarding the user's profile.
      3.  **Explanation Tone**: In your explanation, address the user directly.

      User Profile:
      - Experience: ${userProfile.experience}
      - Risk Tolerance: ${userProfile.riskTolerance}
      - Interests: ${userProfile.interests.join(', ')}
      - Investment Goal: ${userProfile.primaryGoal}

      Investment Details:
      - Type: ${investmentData.type}
      - Name: ${investmentData.name}
      - Amount: $${investmentData.amount}

      - Start Date: ${investmentData.date}

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

    console.log('Sending request to OpenAI');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a senior financial analyst that provides detailed investment analysis." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    console.log('Received OpenAI response');
    const responseText = completion.choices[0].message.content;
    console.log('Raw response:', responseText);

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
      
      // Ensure all required fields are present
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
      console.error('Error parsing OpenAI JSON response:', parseError);
      console.error('Raw response that failed to parse:', responseText);
      return res.status(500).json({ 
        error: 'Failed to parse analysis response from OpenAI',
        details: parseError.message,
        rawResponse: responseText
      });
    }

    console.log('Successfully parsed analysis:', analysis);
    return res.json(analysis);

  } catch (error) {
    console.error('Error in investment analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze investment',
      details: error.message,
      stack: error.stack
    });
  }
};
