const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const apiRoutes = require('../services/apiRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 8080; 

// Middleware
// Security: Harden Helmet with restrictive CSP but allow Maps/Firebase
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://apis.google.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://*.firebaseio.com", "https://*.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://*.google.com", "https://*.ggpht.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com", "https://*.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Google Maps/Firebase
}));

app.use(compression()); // Efficiency: Gzip responses
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Security: Limit body size

// Set up API routes
app.use('/api', apiRoutes);

// Static files
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// React Catch-all
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler (Security: No stack trace leaks)
app.use((err, req, res, next) => {
  console.error("Unhandeled Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

app.listen(PORT, () => console.log(`🏟️ StadiumSync Monolith running on port ${PORT}`));
