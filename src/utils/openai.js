export const analyzeInvestment = async (investmentData, userProfile) => {
  try {
    console.log('Sending investment analysis request:', { investmentData, userProfile });
    
    const response = await fetch('/api/investment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ investmentData, userProfile }),
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API error response:', errorData);
      throw new Error(`API error: ${errorData?.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('Error analyzing investment:', error);
    throw new Error(`Investment analysis failed: ${error.message}`);
  }
};

export const getInvestmentAnalysis = async (investmentData, userProfile) => {
  try {
    console.log('Starting investment analysis');
    const analysis = await analyzeInvestment(investmentData, userProfile);
    console.log('Raw analysis:', analysis);
    
    const formattedAnalysis = {
      ...analysis,
      riskScore: Math.round(analysis.riskScore),
      roiEstimate: parseFloat(analysis.roiEstimate.toFixed(2))
    };
    
    console.log('Formatted analysis:', formattedAnalysis);
    return formattedAnalysis;
  } catch (error) {
    console.error('Error getting investment analysis:', error);
    throw new Error(`Failed to get investment analysis: ${error.message}`);
  }
};
