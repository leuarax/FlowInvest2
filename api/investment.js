const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set');
  return process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
      details: error.message
    });
  }
};
