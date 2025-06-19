const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY,
});

async function analyzeScreenshot(req, res) {
  let imagePath;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const additionalNotes = req.body.additionalNotes || '';
    const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : null;

    // Read the image file
    imagePath = path.join(__dirname, '../uploads', req.file.filename);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare the prompt
    const prompt = `You are a senior financial analyst. Analyze the investment screenshot and the user's notes to identify the single most prominent investment. Return a single, valid JSON object. Do NOT wrap it in markdown. The JSON object MUST have these exact fields and data types: "name" (string), "type" (string), "amount" (number, e.g., 126.50), "duration" (string, one of: "Short-term (0-1 year)", "Mid-term (1-5 years)", "Long-term (5+ years)"), "grade" (string, one of: "A", "B", "C", "D", "F"), "riskScore" (number, an integer from 1 to 10), "roiEstimate" (number, e.g., 15.5), and "explanation" (string). 

For the explanation, provide a detailed analysis with the following structure:
1. Overview of the investment
2. Key financial metrics and performance indicators
3. Risk assessment and factors affecting risk
4. Market context and competitive position
5. Future outlook and potential
6. How this investment aligns with the user's profile and notes

Make the explanation comprehensive, professional, and insightful, similar to what a professional financial advisor would provide. The user's notes are: "${additionalNotes}".`;

    console.log('Calling OpenAI API with image...');
    
    // Call OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ]
    });

    console.log('Received response from OpenAI API');
    
    // Parse the response
    let analysis;
    
    try {
      let responseContent = response.choices[0].message.content;
      console.log('Raw AI response:', responseContent);

      // Universal JSON extractor from markdown or plain text
      let jsonString = responseContent;
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

      if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1].trim();
      }

      // If no markdown found, or if the result is still not clean JSON, try to find the JSON object/array directly
      const firstBracket = jsonString.indexOf('[');
      const lastBracket = jsonString.lastIndexOf(']');
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBracket !== -1 && lastBracket > firstBracket) {
          // It's likely an array
          jsonString = jsonString.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace > firstBrace) {
          // It's likely an object
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }

      console.log('Processing response content:', jsonString);
      analysis = JSON.parse(jsonString);

      // If the AI returns an array, take the first element as requested.
      if (Array.isArray(analysis)) {
        console.log('AI returned an array, taking the first element as requested.');
        analysis = analysis[0];
      }
      
      // Sanitize and format the data from the AI
      const rawAnalysis = analysis;
      const sanitizedAnalysis = {};

      sanitizedAnalysis.name = rawAnalysis.name || 'Investment from Screenshot';
      sanitizedAnalysis.type = rawAnalysis.type || 'Unknown';

      // Amount
      let amount = 0;
      if (typeof rawAnalysis.amount === 'string') {
        amount = parseFloat(rawAnalysis.amount.replace(/[^0-9.-]+/g, ""));
      } else if (typeof rawAnalysis.amount === 'number') {
        amount = rawAnalysis.amount;
      }
      sanitizedAnalysis.amount = isNaN(amount) ? 0 : amount;

      // Duration
      const validDurations = ["Short-term (0-1 year)", "Mid-term (1-5 years)", "Long-term (5+ years)"];
      sanitizedAnalysis.duration = validDurations.includes(rawAnalysis.duration) ? rawAnalysis.duration : 'Unknown';

      // Grade
      const validGrades = ["A", "B", "C", "D", "F"];
      sanitizedAnalysis.grade = validGrades.includes(rawAnalysis.grade) ? rawAnalysis.grade : 'N/A';

      // Risk Score
      let riskScore = 5; // Default
      if (typeof rawAnalysis.riskScore === 'number') {
        riskScore = Math.max(1, Math.min(10, rawAnalysis.riskScore));
      } else if (typeof rawAnalysis.riskScore === 'string') {
        const riskString = rawAnalysis.riskScore.toLowerCase();
        if (riskString.includes('low')) riskScore = 3;
        else if (riskString.includes('moderate')) riskScore = 6;
        else if (riskString.includes('high')) riskScore = 8;
        else {
          const parsedInt = parseInt(riskString, 10);
          if (!isNaN(parsedInt)) {
            riskScore = Math.max(1, Math.min(10, parsedInt));
          }
        }
      }
      sanitizedAnalysis.riskScore = riskScore;

      // ROI Estimate
      let roiEstimate = 0;
      if (typeof rawAnalysis.roiEstimate === 'string') {
        roiEstimate = parseFloat(rawAnalysis.roiEstimate.replace(/[^0-9.-]+/g, ""));
      } else if (typeof rawAnalysis.roiEstimate === 'number') {
        roiEstimate = rawAnalysis.roiEstimate;
      }
      sanitizedAnalysis.roiEstimate = isNaN(roiEstimate) ? 0 : roiEstimate;

      sanitizedAnalysis.explanation = rawAnalysis.explanation || 'No explanation provided.';

      analysis = sanitizedAnalysis;
    } catch (e) {
      console.error('Error parsing analysis response:', e);
      console.error('Raw response content:', response.choices[0].message.content);
      
      // Try to extract any useful information from the response
      let explanation = 'Analysis completed but could not parse the response.';
      const content = response.choices[0].message.content;
      
      // If the response is in markdown, use it as is
      if (content.includes('```')) {
        explanation = content;
      }
      
      // Create a basic analysis object with the best available data
      analysis = {
        name: 'Investment from Screenshot',
        type: 'Unknown',
        amount: 0,
        duration: 'Unknown',
        grade: 'N/A',
        riskScore: 5,
        roiEstimate: 0,
        explanation: explanation
      };
    }
    
    // Add additional metadata
    analysis.analysisDate = new Date().toISOString();
    analysis.source = 'screenshot';
    
    // Return the analysis
    return res.json(analysis);
    
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze screenshot',
      details: error.message 
    });
  } finally {
    // Clean up the uploaded file
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }
  }
}

module.exports = {
  upload,
  analyzeScreenshot
};
