// This file helps Vercel understand how to route API requests
const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it with multer
  },
};

function middleware(req, res, next) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
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

  next();
}

// Export using CommonJS
module.exports = {
  config,
  middleware,
  default: middleware // For backward compatibility
};
