export const analyzeInvestment = async (investmentData, userProfile) => {
  try {
    const response = await fetch('/api/investment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ investmentData, userProfile }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze investment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing investment:', error);
    throw error;
  }
};

export const getInvestmentAnalysis = async (investmentData, userProfile) => {
  try {
    const analysis = await analyzeInvestment(investmentData, userProfile);
    return {
      ...analysis,
      riskScore: Math.round(analysis.riskScore),
      roiEstimate: parseFloat(analysis.roiEstimate.toFixed(2))
    };
  } catch (error) {
    console.error('Error getting investment analysis:', error);
    throw error;
  }
};
