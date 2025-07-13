// This file helps Vercel understand how to route API requests
const { createServer } = require('http');
const { parse } = require('url');
const { join } = require('path');
const { createServer: createVercelServer } = require('@vercel/node');
const path = require('path');

// __filename and __dirname are already available in CommonJS

// Import the Express app from server.js
const app = require('../server');

// Create Vercel serverless function
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Create a serverless request handler
  const serverless = createVercelServer(app);
  return serverless(req, res);
};
