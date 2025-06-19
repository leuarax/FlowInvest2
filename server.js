require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const investmentHandler = require('./api/investment.js');
const portfolioHandler = require('./api/portfolio.js');
const { upload, analyzeScreenshot } = require('./api/screenshot.js');
const batchScreenshotHandler = require('./api/batch-screenshot.js');

const app = express();
const port = 3001;

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
  batchScreenshotHandler(req, res);
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

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
