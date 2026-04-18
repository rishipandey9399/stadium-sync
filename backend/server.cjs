const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../services/apiRoutes.cjs');
// Mocking the Vertex AI SDK for this scope
// const { VertexAI } = require('@google/generative-ai'); 

const app = express();
const PORT = process.env.PORT || 8080; 

// Middleware
app.use(cors());
app.use(express.json());

// Set up API routes
app.use('/api', apiRoutes);

// Serve static frontend files from 'frontend/dist' directory (when run from root or backend)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// React Catch-all route for CSR
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🏟️ StadiumSync Monolith running on port ${PORT}`));
