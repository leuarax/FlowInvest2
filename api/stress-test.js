let openai, isV4 = false;
try {
  // Try OpenAI v4+ style
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  isV4 = true;
} catch (e) {
  // Fallback to v3 style
  const { Configuration, OpenAIApi } = require('openai');
  openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
}

module.exports = async (req, res) => {
  console.log('POST /api/stress-test called');
  try {
    const { scenario, investments, userProfile } = req.body;
    if (!scenario || !investments) {
      return res.status(400).json({ error: 'Missing scenario or investments.' });
    }

    // Step 1: Quick validation check
    const validationPrompt = `Is this a valid market scenario for portfolio stress testing? Answer with ONLY "yes" or "no".

Input: "${scenario}"

Examples of valid scenarios: "interest rates rise", "stock market crash", "inflation increases", "tech sector correction"
Examples of invalid inputs: "i love bikes", "hello", "i just woke up", "how are you", "i like milfs"

Answer:`;

    console.log('Validating scenario:', scenario);
    let isValidScenario;
    try {
      if (isV4) {
        const validationResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a validation assistant. Answer with ONLY "yes" or "no".' },
            { role: 'user', content: validationPrompt }
          ],
          temperature: 0.1,
          max_tokens: 10
        });
        const validationAnswer = validationResponse.choices[0].message.content.trim().toLowerCase();
        console.log('Validation response:', validationAnswer);
        isValidScenario = validationAnswer === 'yes';
      } else {
        const validationResponse = await openai.createChatCompletion({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a validation assistant. Answer with ONLY "yes" or "no".' },
            { role: 'user', content: validationPrompt }
          ],
          temperature: 0.1,
          max_tokens: 10
        });
        const validationAnswer = validationResponse.data.choices[0].message.content.trim().toLowerCase();
        console.log('Validation response:', validationAnswer);
        isValidScenario = validationAnswer === 'yes';
      }
    } catch (err) {
      console.error('Validation check failed:', err);
      isValidScenario = false; // Default to invalid if validation fails
    }

    console.log('Is valid scenario?', isValidScenario);

    // If not a valid scenario, return hardcoded message immediately
    if (!isValidScenario) {
      console.log('Returning rejection message for invalid scenario');
      return res.status(200).json({ 
        analysis: 'Please enter a different scenario.' 
      });
    }

    console.log('Proceeding with full analysis for valid scenario');

    // Step 2: Full analysis (only if scenario is valid)
    const prompt = `
You are a world-class financial analyst specializing in stress testing portfolios under specific market scenarios.

**User Profile:**
${JSON.stringify(userProfile, null, 2)}

**Current Portfolio:**
${JSON.stringify(investments, null, 2)}

**Stress Test Scenario:**
${scenario}

**Your Task:**
Analyze how this portfolio would perform under the given scenario and provide specific, actionable buy/sell recommendations.

**Response Format:**
Provide a single JSON object with the following structure:

{
  "grade": "A/B/C/D/F",
  "riskScore": 7,
  "roiEstimate": 5.2,
  "roiScenarios": {
    "pessimistic": 2.1,
    "realistic": 5.2,
    "optimistic": 8.7
  },
  "analysis": "Detailed analysis of portfolio impact under this scenario",
  "recommendations": [
    {
      "name": "SELL 30% of Tesla (TSLA) - $1,500",
      "reason": "Reduce tech exposure during market stress"
    },
    {
      "name": "BUY Vanguard Total Bond Market ETF (BND) - $2,000", 
      "reason": "Add stability and income"
    },
    {
      "name": "BUY SPDR Gold Shares (GLD) - $800",
      "reason": "Hedge against inflation and volatility"
    }
  ]
}

**CRITICAL REQUIREMENTS FOR RECOMMENDATIONS:**
1. Every recommendation MUST start with "BUY" or "SELL"
2. Include exact ticker symbols in parentheses: (TSLA), (BND), (GLD), etc.
3. Specify exact dollar amounts: "$1,500", "$2,000", etc.
4. Focus on specific securities, not general asset classes
5. Make recommendations actionable and specific to this scenario
6. Do NOT use vague terms like "diversify", "increase allocation", or "consider"
7. Provide 3-5 specific buy/sell actions the user can execute immediately

**Examples of GOOD recommendations:**
- "SELL 25% of Apple (AAPL) - $1,200"
- "BUY iShares Core U.S. Aggregate Bond ETF (AGG) - $1,800"
- "BUY Procter & Gamble (PG) - $600"

**Examples of BAD recommendations:**
- "Diversify into bonds"
- "Increase cash position"
- "Consider defensive stocks"

The entire response must be a single JSON object. Do not include any text outside of the JSON.
`;

    let responseText;
    if (isV4) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a financial analyst that provides stress test analysis in a structured JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });
      responseText = completion.choices[0].message.content;
    } else {
      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a financial analyst that provides stress test analysis in a structured JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });
      responseText = completion.data.choices[0].message.content;
    }
    
    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // fallback: return as analysis text
      return res.status(200).json({ analysis: responseText });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in /api/stress-test:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Failed to analyze scenario.' });
  }
}; 