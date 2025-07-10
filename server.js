require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const investmentHandler = require('./api/investment.js');
const portfolioHandler = require('./api/portfolio.js');
const batchScreenshotHandler = require('./api/batch-screenshot.js');
const analyzeRealEstateHandler = require('./api/analyze-real-estate.js');
const stressTestHandler = require('./api/stress-test.js');
const analyzePortfolioHandler = require('./api/analyze-portfolio.js');
const analyzeScreenshot = require('./api/screenshot.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://flowinvest2.vercel.app' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/investment', (req, res, next) => {
  investmentHandler(req, res).catch(next);
});

app.post('/api/portfolio', (req, res, next) => {
  portfolioHandler(req, res).catch(next);
});

// Real estate analysis endpoint
app.post('/api/analyze-real-estate', (req, res, next) => {
  analyzeRealEstateHandler(req, res).catch(next);
});

// Stress test endpoint
app.post('/api/stress-test', (req, res, next) => {
  stressTestHandler(req, res).catch(next);
});

// Batch portfolio analysis endpoint
app.post('/api/analyze-portfolio', (req, res, next) => {
  analyzePortfolioHandler(req, res).catch(next);
});

const upload = multer({ dest: 'uploads/' });
// Batch screenshot recognition endpoint
app.post('/api/batch-screenshot', upload.any(), batchScreenshotHandler);
// Screenshot recognition endpoint
app.post('/api/screenshot', ...analyzeScreenshot);

// Test JSON parsing
app.post('/api/test-json', (req, res) => {
  console.log('Test JSON body:', req.body);
  res.json({ received: req.body });
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
