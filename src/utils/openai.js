// Get the base URL based on the environment
const getApiBaseUrl = () => {
  // In production, use relative URL (will be served from the same domain)
  if (process.env.NODE_ENV === 'production') {
    return ''; // Empty string will make the request relative to the current domain
  }
  // In development, use the local server
  return 'http://localhost:3001';
};

// Helper to ensure consistent API path formatting
const getApiPath = (endpoint) => {
  const base = getApiBaseUrl();
  return base ? `${base}/api${endpoint}` : `/api${endpoint}`;
};

export const analyzeInvestment = async (investmentData, userProfile) => {
  try {
    console.log('Sending investment analysis request:', { investmentData, userProfile });
    
    const response = await fetch(getApiPath('/investment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        investmentData: {
          ...investmentData,
          // Ensure amount is a number
          amount: Number(investmentData.amount) || 0
        }, 
        userProfile 
      }),
    });

    console.log('API response status:', response.status);
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('API error response:', responseData);
      throw new Error(`API error: ${responseData?.error || 'Unknown error'}`);
    }

    console.log('API response data:', responseData);
    return responseData;
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

export const getPortfolioAnalysis = async (investments, userProfile) => {
  try {
    console.log('=== PORTFOLIO ANALYSIS DEBUG ===');
    console.log('Input investments:', investments);
    console.log('Input userProfile:', userProfile);
    console.log('Investments length:', investments?.length);
    console.log('UserProfile exists:', !!userProfile);
    console.log('UserProfile keys:', userProfile ? Object.keys(userProfile) : 'null');
    
    const requestBody = { investments, userProfile };
    console.log('Request body being sent:', requestBody);
    
    console.log('Sending portfolio analysis request:', { investments, userProfile });
    
    const response = await fetch(getApiPath('/portfolio'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Portfolio analysis response status:', response.status);
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('Portfolio API error response:', responseData);
      throw new Error(responseData?.error || 'Portfolio analysis failed');
    }

    console.log('Portfolio analysis response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in getPortfolioAnalysis:', error);
    throw new Error(`Portfolio analysis failed: ${error.message}`);
  }
};
