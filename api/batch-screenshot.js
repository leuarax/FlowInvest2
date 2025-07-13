const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

// Simple multipart parser
function parseMultipartFormData(buffer, boundary) {
  console.log('Parsing multipart data with boundary:', boundary);
  console.log('Buffer size:', buffer.length);
  
  const boundaryBuffer = Buffer.from('--' + boundary);
  const boundaryEndBuffer = Buffer.from('--' + boundary + '--');
  
  console.log('Looking for boundary:', boundaryBuffer.toString());
  console.log('Looking for end boundary:', boundaryEndBuffer.toString());
  
  let start = buffer.indexOf(boundaryBuffer);
  let end = buffer.indexOf(boundaryEndBuffer);
  
  console.log('Start position:', start);
  console.log('End position:', end);
  
  if (start === -1) {
    console.log('Start boundary not found');
    console.log('Buffer preview:', buffer.slice(0, 200).toString());
    throw new Error('Start boundary not found');
  }
  
  if (end === -1) {
    console.log('End boundary not found, using buffer end');
    end = buffer.length;
  }
  
  // Extract the content between boundaries
  const content = buffer.slice(start + boundaryBuffer.length, end);
  console.log('Content size:', content.length);
  
  // Find the next boundary (if any)
  const nextBoundary = content.indexOf(boundaryBuffer);
  console.log('Next boundary position:', nextBoundary);
  
  let fileData;
  if (nextBoundary === -1) {
    // No next boundary, use all content
    fileData = content;
  } else {
    // Use content up to next boundary
    fileData = content.slice(0, nextBoundary);
  }
  
  console.log('File data size:', fileData.length);
  
  // Find the headers and body
  const headerEnd = fileData.indexOf('\r\n\r\n');
  if (headerEnd === -1) {
    console.log('Header end not found, trying \n\n');
    const headerEndAlt = fileData.indexOf('\n\n');
    if (headerEndAlt === -1) {
      console.log('No header separator found');
      console.log('File data preview:', fileData.slice(0, 200).toString());
      throw new Error('Invalid file format - no header separator');
    }
    const headers = fileData.slice(0, headerEndAlt).toString();
    const body = fileData.slice(headerEndAlt + 2);
    
    console.log('Headers:', headers);
    console.log('Body size:', body.length);
    
    // Parse headers to get filename and content type
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
    
    return {
      name: nameMatch ? nameMatch[1] : 'file',
      filename: filenameMatch ? filenameMatch[1] : 'unknown',
      contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
      buffer: body
    };
  }
  
  const headers = fileData.slice(0, headerEnd).toString();
  const body = fileData.slice(headerEnd + 4);
  
  console.log('Headers:', headers);
  console.log('Body size:', body.length);
  
  // Parse headers to get filename and content type
  const nameMatch = headers.match(/name="([^"]+)"/);
  const filenameMatch = headers.match(/filename="([^"]+)"/);
  const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
  
  return {
    name: nameMatch ? nameMatch[1] : 'file',
    filename: filenameMatch ? filenameMatch[1] : 'unknown',
    contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
    buffer: body
  };
}

module.exports = async (req, res) => {
  console.log('=== BATCH SCREENSHOT REQUEST START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Content-Type:', req.headers['content-type']);
  
  try {
    // Check if this is a multipart form data request
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      console.log('Invalid content type:', req.headers['content-type']);
      return res.status(400).json({ 
        error: 'Invalid content type',
        details: 'Request must be multipart/form-data'
      });
    }

    // Extract boundary from content type
    const boundaryMatch = req.headers['content-type'].match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ 
        error: 'Invalid multipart form data',
        details: 'No boundary found in content type'
      });
    }
    
    const boundary = boundaryMatch[1];
    console.log('Boundary:', boundary);

    // Collect the request body
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      req.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          console.log('Received buffer size:', buffer.length);
          
          // Parse the multipart form data
          const fileData = parseMultipartFormData(buffer, boundary);
          console.log('Parsed file data:', {
            name: fileData.name,
            filename: fileData.filename,
            contentType: fileData.contentType,
            size: fileData.buffer.length
          });
          
          // Validate file type
          if (!fileData.contentType.startsWith('image/')) {
            return reject(new Error('Only image files are allowed'));
          }
          
          // Process the file
          processFile(fileData, res);
        } catch (error) {
          reject(error);
        }
      });
      
      req.on('error', reject);
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Set proper headers for error response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(400).json({ 
      error: 'File upload error',
      details: error.message
    });
  }
};

async function processFile(fileData, res) {
  try {
    console.log('Processing file:', fileData.filename);
    
    // Convert to base64
    const base64Image = fileData.buffer.toString('base64');
    
    if (!base64Image || base64Image.length < 100) {
      console.warn('Invalid image data for file:', fileData.filename);
      return res.status(400).json({ 
        error: 'Invalid image data',
        details: 'The uploaded file appears to be corrupted or too small'
      });
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

      console.log('Received batch analysis from OpenAI for file:', fileData.filename);

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
        return res.status(500).json({ 
          error: 'Failed to parse image data',
          details: e.message
        });
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
      
      if (cleanedInvestments.length === 0) {
        return res.status(400).json({ 
          error: 'No valid investments found',
          details: 'No investments could be recognized from your screenshot. Please try another image.'
        });
      }

      // Generate AI analysis for each investment
      console.log('Generating AI analysis for extracted investments...');
      const enhancedInvestments = [];
      
      for (const investment of cleanedInvestments) {
        console.log('Starting analysis for investment:', investment.name);
        try {
          const prompt = `
            As an expert financial analyst, you are analyzing an investment for a client.

            You will be given the investment details. Please provide the following in a single JSON object:
            - "grade": The letter grade (e.g., A+, B-, C) based on the investment characteristics.
            - "riskScore": A numerical risk score from 1 (very low risk) to 10 (very high risk).
            - "roiEstimate": A numerical ROI estimate (do not include '%' sign).
            - "explanation": A detailed explanation of your analysis.

            Investment Details:
            - Type: ${investment.type}
            - Name: ${investment.name}
            - Amount: $${investment.amount}
            - Start Date: ${investment.date}
          `;

          const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a senior financial analyst that provides detailed investment analysis." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          });

          const analysisContent = analysisResponse?.choices?.[0]?.message?.content || '{}';
          let analysis;
          try {
            analysis = JSON.parse(analysisContent);
            
            // Ensure all required fields are present
            if (!analysis.grade || !analysis.riskScore || !analysis.roiEstimate || !analysis.explanation) {
              throw new Error('Incomplete analysis response from AI');
            }
            
            // Ensure riskScore is a number between 1-10
            analysis.riskScore = Math.max(1, Math.min(10, Number(analysis.riskScore) || 5));
            
            // Ensure roiEstimate is a number
            let roiEstimate = 0;
            if (typeof analysis.roiEstimate === 'string') {
              roiEstimate = parseFloat(analysis.roiEstimate.replace(/[^0-9.-]+/g, ""));
            } else if (typeof analysis.roiEstimate === 'number') {
              roiEstimate = analysis.roiEstimate;
            }
            analysis.roiEstimate = isNaN(roiEstimate) ? 0 : roiEstimate;
            
          } catch (parseError) {
            console.error('Error parsing analysis response:', parseError);
            throw new Error('Failed to parse analysis response');
          }

          // Merge the analysis with the investment data
          const enhancedInvestment = {
            ...investment,
            roiEstimate: analysis.roiEstimate,
            riskScore: analysis.riskScore,
            grade: analysis.grade,
            explanation: analysis.explanation,
            roiScenarios: {
              pessimistic: (analysis.roiEstimate || 8.5) * 0.8,
              realistic: analysis.roiEstimate || 8.5,
              optimistic: (analysis.roiEstimate || 8.5) * 1.2
            }
          };

          enhancedInvestments.push(enhancedInvestment);
          console.log('Enhanced investment:', enhancedInvestment.name, 'with analysis');

        } catch (analysisError) {
          console.error('Error analyzing investment:', investment.name, analysisError);
          // Keep the investment with default values if analysis fails
          const investmentWithBasicAnalysis = {
            ...investment,
            grade: 'B',
            riskScore: 5,
            roiEstimate: 8.5,
            roiScenarios: {
              pessimistic: 6.8,
              realistic: 8.5,
              optimistic: 10.2
            },
            explanation: 'Investment from screenshot analysis (basic analysis)'
          };
          enhancedInvestments.push(investmentWithBasicAnalysis);
        }
      }
      
      // Return the enhanced investments
      console.log('Final enhanced investments count:', enhancedInvestments.length);
      console.log('Sending response to client...');
      
      // Set proper headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      const responseData = { data: enhancedInvestments };
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('Error in analysis:', error);
      return res.status(500).json({ 
        error: 'Failed to analyze portfolio',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Error processing file:', error);
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message
    });
  }
}
