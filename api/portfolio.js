const OpenAI = require('openai');

const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('REACT_APP_OPENAI_API_KEY is not set in environment variables.');
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.openai.com/v1'
});

module.exports = async (req, res) => {
  try {
    const { investments, userProfile } = req.body;

    console.log('=== PORTFOLIO API DEBUG ===');
    console.log('Received investments:', investments);
    console.log('Received userProfile:', userProfile);
    console.log('investments length:', investments?.length);
    console.log('userProfile exists:', !!userProfile);
    console.log('userProfile keys:', userProfile ? Object.keys(userProfile) : 'null');
    console.log('userProfile experience:', userProfile?.experience);
    console.log('userProfile riskTolerance:', userProfile?.riskTolerance);
    console.log('userProfile interests:', userProfile?.interests);
    console.log('userProfile primaryGoal:', userProfile?.primaryGoal);

    if (!investments || !userProfile || investments.length === 0) {
      console.log('Validation failed:');
      console.log('- investments exists:', !!investments);
      console.log('- userProfile exists:', !!userProfile);
      console.log('- investments.length > 0:', investments?.length > 0);
      return res.status(400).json({ error: 'Missing or empty portfolio or missing profile data' });
    }

    const prompt = `
      As a hyper-personalized AI financial advisor, your primary role is to evaluate a client's investment portfolio strictly through the lens of their unique personal and financial profile. General market wisdom is secondary to the user's stated goals.

      **Crucial User Profile Data:**
      - **Experience Level**: ${userProfile.experience}
      - **Risk Appetite**: ${userProfile.riskTolerance}
      - **Stated Interests**: ${userProfile.interests.join(', ')}
      - **Primary Investment Goal (The most important factor)**: "${userProfile.primaryGoal}"

      **User's Current Portfolio (${investments.length} investments):**
      ${investments.map(inv => `- ${inv.name} ($${inv.amount}, Type: ${inv.type})`).join('\n')}

      **Your Task:**
      Provide a single, structured JSON object with the following keys. Your entire analysis MUST be tailored to the user's profile.

      1.  **"grade"**: A single letter grade using a granular scale (e.g., A+, A, A-, B+, B, B-, C+, etc.). **This grade must NOT be based on general market standards.** It must exclusively reflect how well the current portfolio aligns with the user's **Primary Investment Goal** and **Risk Appetite**. A high-risk portfolio might be an 'A+' for a user with a high-risk goal, even if it's not diversified.

      2.  **"riskScore"**: A number from 1 (very low risk) to 10 (very high risk) representing the overall risk of the portfolio, based on the user's profile and portfolio composition.

      3.  **"analysis"**: A comprehensive analysis written directly to the user. Explain *why* you gave the grade you did, referencing their goals and portfolio. Point out strengths and weaknesses *specifically* in the context of their objectives. For example, "Your portfolio is heavily weighted in tech, which aligns perfectly with your stated goal of aggressive growth in that sector."

      4.  **"recommendations"**: An array of exactly 3 new, specific investment recommendations. **These recommendations must be deeply personalized.** For each recommendation, you must:
          - Provide a "name" for the investment.
          - Provide a "reason" (3-5 words) that explicitly connects the recommendation to the user's **Primary Investment Goal** or **Stated Interests**. For example, if their goal is "long-term ethical growth," a recommendation reason could be "Adds sustainable energy exposure."

      5.  **"historicalValues"**: An array of 6 numbers representing the total value of the user's portfolio at each year, from 5 years ago to now (e.g., [value5YearsAgo, ..., valueNow]).

      6.  **"recommendedValues"**: An array of 6 numbers representing the projected value of the user's portfolio if your 3 recommendations had been added proportionally 5 years ago, calculated for each year from 5 years ago to now (e.g., [value5YearsAgo, ..., valueNow]).

      The entire response must be a single JSON object. Do not include any text outside of the JSON.
    `;

    let analysis;
    let responseText;
    let attempts = 0;
    const maxAttempts = 5;
    let aiResponse;
    while (attempts < maxAttempts) {
      const strictPrompt = `
${prompt}

IMPORTANT: The analysis field must be a list of bullet points.
- Each bullet point MUST start with '• [+] ', '• [-] ', or '• [~] '.
- For each bullet point:
  - If it describes a strength, benefit, or opportunity, use '[+]'.
  - If it describes a weakness, risk, or drawback, use '[-]'.
  - If it is mixed, neutral, or has both pros and cons, use '[~]'.
- Each bullet point MUST be a very short phrase (not a sentence), with a HARD CAP of 10 words (never 10 or more, count every word).
- Do NOT use sentences. Only use short, punchy bullet points.
- Each bullet point MUST be on its own line, separated by a newline.
- Do NOT combine multiple bullet points on one line.
- Do NOT use paragraphs, numbers, or dashes.
- Do NOT use any other format.
- If you do not use bullet points in this format, your answer will be rejected and you will be asked again.
- ONLY use bullet points in this format.

Examples:
• [+] MSCI World ETF provides diversification
• [-] No crypto exposure
• [~] Real estate is stable but low growth`;
      const systemMessage = "You are a financial analyst. The analysis field MUST be a list of bullet points, each starting with ‘• [+] ’, ‘• [-] ’, or ‘• [~] ’. For each bullet point: use '[+]' for strengths/benefits/opportunities, '[-]' for weaknesses/risks/drawbacks, '[~]' for mixed/neutral. Each must be a very short phrase (not a sentence), HARD CAP 10 words. Do NOT use sentences, paragraphs, numbers, or dashes. Only use this format. If you do not follow these rules, your answer will be rejected and you will be asked again. Example: • [+] MSCI World ETF provides diversification";
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: strictPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });
      responseText = completion.choices[0].message.content;
      try {
        aiResponse = JSON.parse(responseText);
        analysis = aiResponse.analysis;
      } catch (e) {
        analysis = null;
        aiResponse = null;
      }
      // Validation: must be array or string
      let lines = [];
      if (Array.isArray(analysis)) {
        lines = analysis;
      } else if (typeof analysis === 'string') {
        lines = analysis.split('\n').filter(l => l.trim());
      }
      // Validate each line: must start with • [+] , • [-] , or • [~]  and be <10 words
      const valid = lines.length > 0 && lines.every(line => {
        const match = line.match(/^• \[(\+|\-|~)\] /);
        if (!match) return false;
        const wordCount = line.replace(/^• \[(\+|\-|~)\] /, '').trim().split(/\s+/).length;
        return wordCount < 10;
      });
      console.log('AI analysis attempt', attempts + 1, 'raw:', analysis, 'valid:', valid);
      if (valid) {
        // Return as array for frontend
        analysis = lines;
        break;
      }
      attempts++;
    }
    if (typeof aiResponse === 'object' && aiResponse !== null) {
      // Sort analysis by sentiment: [+] first, then [~], then [-]
      const sortAnalysisBySentiment = (analysisArray) => {
        if (!Array.isArray(analysisArray)) return analysisArray;
        
        return analysisArray.sort((a, b) => {
          const aSentiment = a.startsWith('• [+] ') ? 0 : a.startsWith('• [~] ') ? 1 : 2;
          const bSentiment = b.startsWith('• [+] ') ? 0 : b.startsWith('• [~] ') ? 1 : 2;
          return aSentiment - bSentiment; // Sort: positive (0) -> mixed (1) -> negative (2)
        });
      };
      
      aiResponse.analysis = sortAnalysisBySentiment(analysis); // use the validated and sorted bullet points array
      // Ensure all required fields are present
      if (typeof aiResponse.grade !== 'string') aiResponse.grade = '-';
      if (!Array.isArray(aiResponse.analysis)) aiResponse.analysis = [];
      if (!Array.isArray(aiResponse.recommendations)) aiResponse.recommendations = [];
      if (!Array.isArray(aiResponse.historicalValues)) aiResponse.historicalValues = [];
      if (!Array.isArray(aiResponse.recommendedValues)) aiResponse.recommendedValues = [];
      // Ensure riskScore is present and valid
      let riskScore = Number(aiResponse.riskScore);
      if (isNaN(riskScore) || riskScore < 1 || riskScore > 10) riskScore = 5;
      aiResponse.riskScore = riskScore;
      return res.json(aiResponse);
    } else {
      return res.status(500).json({ error: 'AI response was not a valid object.' });
    }

  } catch (error) {
    console.error('Error in portfolio analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze portfolio',
      details: error.message,
    });
  }
};
