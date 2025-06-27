const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

module.exports = async (req, res) => {
  console.log('Received request to analyze portfolio screenshots');
  
  // Files are already uploaded by multer in server.js
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No files uploaded',
      details: 'Please ensure you are sending files with the key "screenshots"'
    });
  }

  try {
    // Process all uploaded files
    const allInvestments = [];
    
    for (const file of req.files) {
      console.log('Processing file:', file.originalname);
      
      // Read the uploaded file
      console.log('Reading uploaded file from:', file.path);
      const imageBuffer = await fs.readFile(file.path);
      const base64Image = imageBuffer.toString('base64');
      
      if (!base64Image || base64Image.length < 100) {
        console.warn('Invalid image data for file:', file.originalname);
        continue;
      }
      
      console.log('Image read successfully, size:', base64Image.length, 'chars');

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
      
      try {
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

      console.log('Received batch analysis from OpenAI for file:', file.originalname);

        // Clean up the uploaded file
        await fs.unlink(file.path).catch(e => console.error('Error deleting temp file:', e));

        // Parse the AI response
        console.log('Received response from OpenAI');
        const content = response.choices[0]?.message?.content || '[]';
        console.log('Raw AI response:', content);
        
        // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      console.log('Extracted JSON string:', jsonString);
      
      // Clean and parse the JSON
      const cleanedJsonString = jsonString
        .replace(/```/g, '')
        .replace(/^\s*\[\s*\{/s, '[{')
        .replace(/\}\]\s*$/s, '}]')
        .trim();
        
      console.log('Cleaned JSON string:', cleanedJsonString);
      
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedJsonString);
        console.log('Successfully parsed JSON:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error('Error parsing JSON:', e);
        continue; // Skip this file if JSON parsing fails
      }
        
      // Ensure we have an array of investments
      const investments = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      console.log('Processed investments array:', investments);
      
      // Validate and clean up the investment data
      const cleanedInvestments = investments.map(inv => {
        const cleanInv = {
          name: inv.name || 'Unknown',
          type: inv.type || 'Stock',
          amount: parseFloat(inv.amount || inv.currentValue || 0),
          roiEstimate: 0, // Will be set by analysis
          riskScore: 5,   // Default risk score
          grade: 'B',     // Default grade
          date: inv.purchaseDate || new Date().toISOString().split('T')[0],
          duration: 'Long-term' // Default duration
        };
        
        console.log('Cleaned investment:', cleanInv);
        return cleanInv;
      }).filter(inv => {
        const isValid = inv.name !== 'Unknown' && inv.amount > 0;
        if (!isValid) {
          console.log('Filtering out invalid investment:', inv);
        }
        return isValid;
      });
      
      // Add to all investments
      allInvestments.push(...cleanedInvestments);
      
      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        // Continue with other files
      }
    }
    
    console.log('Final all investments:', allInvestments);
    
    if (allInvestments.length === 0) {
      throw new Error('No valid investments found in any of the uploaded images');
    }
    
    // Return the investments wrapped in a data property to match expected format
    return res.json({ data: allInvestments });
    
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
};
