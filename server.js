require('dotenv').config();
const express = require('express');
const cors = require('cors');
const investmentHandler = require('./api/investment.js');
const portfolioHandler = require('./api/portfolio.js');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API route
app.post('/api/investment', (req, res, next) => {
  investmentHandler(req, res).catch(next);
});

app.post('/api/portfolio', (req, res, next) => {
  portfolioHandler(req, res).catch(next);
});

// Generic error handler middleware (must be the last app.use call)
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
