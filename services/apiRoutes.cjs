const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../backend/config.cjs');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Simple In-Memory Cache for AI Insights (5-minute TTL)
const aiCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 
};

// Rate Limiters
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, error: "Too many SOS requests. Please contact security directly." },
  standardHeaders: true,
  legacyHeaders: false,
});

const queueLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many queue join requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod Schemas
const sosSchema = z.object({
  location: z.string().min(1).max(200).transform(str => str.replace(/<[^>]*>?/gm, '')).default('Unknown'), // Basic HTML stripping
});

// data
let queuePosition = 42;
const AREAS = [
  { id: 'north-gate', name: 'North Entrance', type: 'gate' },
  { id: 'south-gate', name: 'South Entrance', type: 'gate' },
  { id: 'east-concourse', name: 'East Concourse', type: 'food' },
  { id: 'west-concourse', name: 'West Concourse', type: 'food' },
  { id: 'fan-zone', name: 'Fan Zone', type: 'attraction' },
];

const getDynamicWaitTimes = () => {
  return AREAS.map(area => ({
    ...area,
    waitTime: Math.floor(Math.random() * 25),
    density: Math.random()
  }));
};

// Queue Simulation
setInterval(() => {
  if (queuePosition > 0) queuePosition--;
}, 5000);

router.get('/health', (req, res) => res.json({ status: 'ok', environment: config.NODE_ENV }));

router.get('/venue', (req, res) => {
  res.json({ success: true, areas: getDynamicWaitTimes() });
});

router.post('/queue/join', queueLimiter, (req, res) => {
  if (queuePosition <= 0) queuePosition = 42;
  res.json({ success: true, position: queuePosition });
});

router.get('/queue/status', (req, res) => res.json({ position: queuePosition }));

router.post('/sos', sosLimiter, (req, res) => {
  try {
    const validatedData = sosSchema.parse(req.body);
    const alert = { id: Date.now(), location: validatedData.location, status: 'dispatched' };
    res.json({ success: true, alert });
  } catch (err) {
    res.status(400).json({ success: false, error: "Validation Failed" });
  }
});

/**
 * 🧠 Production Gemini Insight Engine with TTL Caching
 */
router.get('/predictive-trends', async (req, res) => {
  try {
    const now = Date.now();
    // Return cached insight if valid
    if (aiCache.data && (now - aiCache.timestamp < aiCache.TTL)) {
      return res.json({ success: true, prediction: aiCache.data, cached: true });
    }

    const venueData = getDynamicWaitTimes();
    const prompt = `Analyze this stadium venue data and provide a 1-sentence predictive insight and a 1-sentence recommendation for staff.
    Data: ${JSON.stringify(venueData)}
    Format response as JSON: { "insight": "...", "recommendation": "...", "confidenceScore": 0.95 }`;

    const response = await aiModel.generateContent(prompt);
    const text = response.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);

    // Update Cache
    aiCache.data = result;
    aiCache.timestamp = now;

    res.json({ success: true, prediction: result, cached: false });
  } catch (error) {
    console.error("Gemini Production Error:", error);
    res.status(503).json({ success: false, error: "AI Prediction Service Temporarily Unavailable" });
  }
});

module.exports = router;
