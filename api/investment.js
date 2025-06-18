const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }
    const { investmentData, userProfile } = req.body;

    if (!investmentData || !userProfile) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    try {
      const response = JSON.parse(completion.choices[0].message.content);
      res.status(200).json({
        ...response,
        riskScore: Math.round(response.riskScore),
        roiEstimate: parseFloat(response.roiEstimate.toFixed(2))
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({
        error: 'Failed to parse AI response. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error analyzing investment:', error);
    res.status(500).json({ error: 'Failed to analyze investment' });
  }
};
