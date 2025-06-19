const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('screenshot');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

module.exports = async (req, res) => {
  // Handle file upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Read the uploaded file
      const imageBuffer = await fs.readFile(req.file.path);
      const base64Image = imageBuffer.toString('base64');

      // Prepare the prompt for batch analysis
      const prompt = `Analyze this investment portfolio screenshot and identify all individual investments. 
For each investment, extract:
- name (string)
- type (string: Stock, ETF, Crypto, etc.)
- amount (number)
- currentValue (number, if visible)
- quantity (number, if visible)
- purchaseDate (string in YYYY-MM-DD format, if visible)
- brokerage (string, if visible)

Return a JSON array of investment objects. Only include data that is clearly visible in the image.`;

      console.log('Calling OpenAI API for batch analysis...');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        ],
        max_tokens: 3000,
      });

      console.log('Received batch analysis from OpenAI');
      
      // Clean up the uploaded file
      await fs.unlink(req.file.path);

      // Parse the response
      try {
        const content = response.choices[0].message.content;
        console.log('Raw AI response:', content);
        
        // Try to extract JSON from markdown code block if present
        let jsonString = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
        
        // Clean up the JSON string
        jsonString = jsonString.trim()
          .replace(/^```json\n?/, '')  // Remove ```json marker
          .replace(/```$/, '')         // Remove trailing ```
          .replace(/^\n+|\n+$/g, '')  // Remove leading/trailing newlines
          .replace(/\n/g, ' ')         // Replace newlines with spaces
          .replace(/\s+/g, ' ')        // Collapse multiple spaces
          .replace(/'/g, '"');         // Replace single quotes with double quotes
        
        console.log('Cleaned JSON string:', jsonString);
        
        // Try to parse the JSON
        let parsedData;
        try {
          parsedData = JSON.parse(jsonString);
        } catch (e) {
          // If parsing fails, try to extract a JSON object from the string
          const jsonObjMatch = jsonString.match(/\{[\s\S]*\}/);
          if (jsonObjMatch) {
            parsedData = JSON.parse(jsonObjMatch[0]);
          } else {
            throw new Error('Could not extract valid JSON from response');
          }
        }
        
        console.log('Parsed data:', parsedData);
        
        // Ensure we have an array of investments
        let investments = [];
        if (Array.isArray(parsedData)) {
          investments = parsedData;
        } else if (parsedData && typeof parsedData === 'object') {
          // If we have a single investment object
          if (parsedData.name && parsedData.type) {
            investments = [parsedData];
          } else if (parsedData.investments) {
            // If we have an object with an investments array
            investments = Array.isArray(parsedData.investments) 
              ? parsedData.investments 
              : [parsedData.investments];
          }
        }
        
        console.log('Final investments:', investments);
        
        // Return the investments directly as an array
        return res.json(investments);
        
      } catch (parseError) {
        console.error('Error parsing investments:', parseError);
        console.error('Problematic content:', content);
        return res.status(500).json({ 
          error: 'Failed to parse investments',
          details: parseError.message,
          content: content
        });
      }
      
    } catch (error) {
      console.error('Error in batch analysis:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        type: error.type,
        response: error.response?.data
      });
      
      let errorMessage = 'Failed to analyze portfolio';
      let details = error.message;
      
      // Handle specific OpenAI API errors
      if (error.code === 'model_not_found') {
        errorMessage = 'Model not found';
        details = 'The requested AI model is not available. Please check your OpenAI API access.';
      } else if (error.code === 'invalid_api_key') {
        errorMessage = 'Invalid API Key';
        details = 'The provided OpenAI API key is invalid. Please check your configuration.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate Limit Exceeded';
        details = 'You have exceeded your API rate limit. Please try again later.';
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        details: details,
        code: error.code,
        type: error.type
      });
    }
  });
};
