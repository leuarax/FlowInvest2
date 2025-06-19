require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const investmentHandler = require('./api/investment.js');
const portfolioHandler = require('./api/portfolio.js');
const { upload, analyzeScreenshot } = require('./api/screenshot.js');
const batchScreenshotHandler = require('./api/batch-screenshot.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/investment', (req, res, next) => {
  investmentHandler(req, res).catch(next);
});

app.post('/api/portfolio', (req, res, next) => {
  portfolioHandler(req, res).catch(next);
});

// Screenshot analysis endpoints
app.post('/api/analyze-screenshot', upload.single('screenshot'), (req, res, next) => {
  analyzeScreenshot(req, res).catch(next);
});

// Batch portfolio analysis endpoint
app.post('/api/analyze-portfolio', (req, res, next) => {
  console.log('Received request to /api/analyze-portfolio');
  
  // Log request headers for debugging
  console.log('Request headers:', req.headers);
  
  // Handle file upload with multer
  const multerUpload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  }).single('screenshot');
  
  multerUpload(req, res, (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ 
        error: 'File upload failed',
        details: err.message 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please upload a screenshot file with the key "screenshot"' 
      });
    }
    
    // Call the batch screenshot handler
    batchScreenshotHandler(req, res).catch(error => {
      console.error('Error in batchScreenshotHandler:', error);
      res.status(500).json({ 
        error: 'Failed to process portfolio',
        details: error.message 
      });
    });
  });
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Generic error handler middleware (must be the last app.use call)
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ 
    error: 'An unexpected server error occurred.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
