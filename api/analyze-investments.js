// This endpoint analyzes extracted investments with user profile data
// Similar to the onboarding process but for pre-extracted investments

const investmentAnalysis = require('./investment');

module.exports = async (req, res) => {
  console.log('Received request to analyze investments with user profile (using onboarding logic)');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { investments, userProfile } = req.body;
    if (!investments || !Array.isArray(investments) || investments.length === 0) {
      return res.status(400).json({ error: 'No investments provided' });
    }
    const results = [];
    for (const investment of investments) {
      // Simulate a request/response for the investment.js handler
      const fakeReq = { body: { investmentData: investment, userProfile } };
      let analysisResult;
      // Use a fake res object to capture the result
      const fakeRes = {
        status: (code) => {
          fakeRes.statusCode = code;
          return fakeRes;
        },
        json: (data) => {
          analysisResult = data;
          return data;
        }
      };
      await investmentAnalysis(fakeReq, fakeRes);
      if (analysisResult && !analysisResult.error) {
        results.push({ ...investment, ...analysisResult });
      } else {
        // Fallback if analysis failed
        results.push({
          ...investment,
          roiEstimate: 0,
          riskScore: 5,
          grade: 'B',
          explanation: 'Analysis could not be completed for this investment.',
          riskExplanation: 'Default risk assessment applied.',
          roiScenarios: {
            pessimistic: 0,
            realistic: 0,
            optimistic: 0
          }
        });
      }
    }
    return res.json({ data: results });
  } catch (error) {
    console.error('Error in analyze-investments endpoint:', error);
    return res.status(500).json({ error: 'Failed to analyze investments', details: error.message });
  }
}; 