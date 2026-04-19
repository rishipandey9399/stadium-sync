const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config.cjs');
const apiRoutes = require('../services/apiRoutes.cjs');

const app = express();
const PORT = config.PORT || 8080; 

// Middleware
// Production Logging: JSON for Cloud Run / Morgan for dev
const logFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Security: Harden Helmet with restrictive CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://maps.googleapis.com", 
        "https://apis.google.com",
        "https://www.googletagmanager.com"
      ],
      connectSrc: [
        "'self'", 
        "https://maps.googleapis.com", 
        "https://*.firebaseio.com", 
        "https://*.googleapis.com",
        "https://www.google-analytics.com",
        "https://*.google-analytics.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://maps.gstatic.com", 
        "https://maps.googleapis.com", 
        "https://*.google.com", 
        "https://*.ggpht.com",
        "https://www.google-analytics.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com", "https://*.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Set up API routes
app.use('/api', apiRoutes);

// Static files
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// React Catch-all
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const isProd = config.NODE_ENV === 'production';
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  res.status(500).json({ 
    success: false, 
    error: isProd ? "Internal Server Error" : err.message,
    requestId: req.headers['x-cloud-trace-context'] || 'local'
  });
});

app.listen(PORT, () => console.log(`🚀 StadiumSync Production Monolith running on port ${PORT}`));
