const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY is not set in environment variables.');
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.openai.com/v1'
});

module.exports = async (req, res) => {
  try {
    const { investments, userProfile } = req.body;

    if (!investments || !userProfile || investments.length === 0) {
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
      Provide a single, structured JSON object with the following three keys. Your entire analysis MUST be tailored to the user's profile.

      1.  **"grade"**: A single letter grade using a granular scale (e.g., A+, A, A-, B+, B, B-, C+, etc.). **This grade must NOT be based on general market standards.** It must exclusively reflect how well the current portfolio aligns with the user's **Primary Investment Goal** and **Risk Appetite**. A high-risk portfolio might be an 'A+' for a user with a high-risk goal, even if it's not diversified.

      2.  **"analysis"**: A comprehensive analysis written directly to the user. Explain *why* you gave the grade you did, referencing their goals and portfolio. Point out strengths and weaknesses *specifically* in the context of their objectives. For example, "Your portfolio is heavily weighted in tech, which aligns perfectly with your stated goal of aggressive growth in that sector."

      3.  **"recommendations"**: An array of exactly 3 new, specific investment recommendations. **These recommendations must be deeply personalized.** For each recommendation, you must:
          - Provide a "name" for the investment.
          - Provide a "reason" (3-5 words) that explicitly connects the recommendation to the user's **Primary Investment Goal** or **Stated Interests**. For example, if their goal is "long-term ethical growth," a recommendation reason could be "Adds sustainable energy exposure."

      The entire response must be a single JSON object. Do not include any text outside of the JSON.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a financial analyst that provides portfolio analysis and recommendations in a structured JSON format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response for portfolio:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse portfolio analysis response from OpenAI',
        rawResponse: responseText
      });
    }

    return res.json(analysis);

  } catch (error) {
    console.error('Error in portfolio analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze portfolio',
      details: error.message,
    });
  }
};
