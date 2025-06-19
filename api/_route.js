// This file helps Vercel understand how to route API requests
import { createServer } from 'http';
import { parse } from 'url';
import { join } from 'path';
import { createServer as createVercelServer } from '@vercel/node';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the Express app from server.js
const app = (await import(join(__dirname, '..', 'server.js'))).default;

// Create Vercel serverless function
export default async function handler(req, res) {
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
}
