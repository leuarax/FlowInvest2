const OpenAI = require('openai');

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

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

// Test API key by making a simple request
async function testApiKey() {
  try {
    console.log('Testing API key with OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test API key" }],
      temperature: 0.7,
      max_tokens: 10
    });
    console.log('API key test successful');
    console.log('Response:', response);
    return true;
  } catch (error) {
    console.error('API key test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Continue with the main export
module.exports = async (req, res) => {
  try {
    // Test API key before processing the request
    await testApiKey();
    
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
      Analyze the following investment based on the user's profile:
      
      User Profile:
      - Experience: ${userProfile.experience}
      - Risk Tolerance: ${userProfile.riskTolerance}
      - Interests: ${userProfile.interests.join(', ')}
      
      Investment Details:
      - Type: ${investmentData.type}
      - Name: ${investmentData.name}
      - Amount: $${investmentData.amount}
      - Duration: ${investmentData.duration} years
      - Start Date: ${investmentData.date}
      
      Please provide:
      1. A risk score (1-10) based on the investment characteristics and user's risk tolerance
      2. An estimated ROI percentage for the given duration
      3. A detailed explanation of the investment's risk profile and potential returns
      
      Format the response as JSON with the following structure:
      {
        "riskScore": number,
        "roiEstimate": number,
        "explanation": string
      }
    `;

    console.log('Sending request to OpenAI');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a financial analyst that provides investment analysis." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Received OpenAI response');
    const responseText = completion.choices[0].message.content;
    console.log('Raw response:', responseText);

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // If parsing fails, try to extract the JSON manually
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          return res.status(500).json({ 
            error: 'Failed to parse analysis response',
            rawResponse: responseText,
            extractedJson: jsonMatch[0]
          });
        }
      } else {
        return res.status(500).json({ 
          error: 'Failed to parse analysis response',
          rawResponse: responseText
        });
      }
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
