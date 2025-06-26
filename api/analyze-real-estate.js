let openai, isV4 = false;

try {
  // Try v4+ style
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  isV4 = true;
} catch (e) {
  // Fallback to v3 style
  const { Configuration, OpenAIApi } = require('openai');
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  // Compose a prompt for OpenAI
  const prompt = `You are a real estate investment analyst. Analyze the following property and provide:
- A grade (A-F)
- A risk score (1-10)
- Estimated ROI scenarios (pessimistic, realistic, optimistic, in %)
- Estimated monthly cashflow (in EUR)
- Estimated monthly cashflow after mortgage is paid off (in EUR)
- Take into account inflation, all costs, and financing
- A detailed analysis text

Property data:
Country: ${data.country}
City: ${data.city}
Street: ${data.street}
Object Type: ${data.objectType}
Size (m²): ${data.sqm}
Year of Construction: ${data.yearOfConstruction}
Last Renovation: ${data.lastRenovation}
Net Rent: ${data.netRent}
Apportionable Additional Costs: ${data.apportionableCosts}
Non-Apportionable Additional Costs: ${data.nonApportionableCosts}
Vacancy (Months per Year): ${data.vacancy}
Purchase Price: ${data.purchasePrice}
Market Price: ${data.marketPrice}
Residual Debt: ${data.residualDebt}
Interest: ${data.interest}
Repayment Rate (monthly): ${data.repaymentRate}
Interest Rate Fixation (months): ${data.interestFixation}

Respond in JSON with keys: grade, riskScore, roiScenarios (with pessimistic, realistic, optimistic), cashflow, cashflowAfterMortgage, explanation, riskExplanation.`;

  try {
    let text;
    if (isV4) {
      // v4+ syntax
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });
      text = completion.choices[0].message.content;
    } else {
      // v3 syntax
      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });
      text = completion.data.choices[0].message.content;
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      // fallback: try to extract JSON from text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse analysis result');
      }
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to analyze real estate investment.' });
  }
} 