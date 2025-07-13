require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const investmentHandler = require('./api/investment.js');
const portfolioHandler = require('./api/portfolio.js');
const batchScreenshotHandler = require('./api/batch-screenshot.js');
const analyzeRealEstateHandler = require('./api/analyze-real-estate.js');
const stressTestHandler = require('./api/stress-test.js');
const analyzePortfolioHandler = require('./api/analyze-portfolio.js');
const analyzeScreenshot = require('./api/screenshot.js');

const app = express();
const port = process.env.PORT || 3001;

// CORS middleware must come FIRST
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://flow-invest2-hpr3.vercel.app' 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// File upload routes must come BEFORE any middleware that might interfere with the request body
app.post('/api/batch-screenshot', batchScreenshotHandler);
app.options('/api/batch-screenshot', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});
app.post('/api/screenshot', analyzeScreenshot);
app.post('/api/analyze-screenshot', analyzeScreenshot);
// Middleware for parsing JSON and URL-encoded data, but exclude file upload routes
app.use((req, res, next) => {
  // Skip body parsing for file upload routes
  if (req.path.includes('/batch-screenshot') || req.path.includes('/screenshot') || req.path.includes('/analyze-screenshot')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  // Skip URL-encoded parsing for file upload routes
  if (req.path.includes('/batch-screenshot') || req.path.includes('/screenshot') || req.path.includes('/analyze-screenshot')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

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
  console.log('Received analyze-portfolio request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    files: req.files
  });
  analyzePortfolioHandler(req, res).catch(next);
});

// Test JSON parsing
app.post('/api/test-json', (req, res) => {
  console.log('Test JSON body:', req.body);
  res.json({ received: req.body });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
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
