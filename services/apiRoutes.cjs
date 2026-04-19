const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../backend/config.cjs');

const router = express.Router();

// ---------------------------------------------------------------------------
// Google Generative AI (Gemini) Initialization
// ---------------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || '');
const aiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    'You are StadiumSync, a venue crowd-management AI. ' +
    'Respond ONLY with valid JSON in the specified format. ' +
    'Do not include markdown code fences, prose, or any additional text.',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// In-Memory TTL Cache for AI Insights (5-minute TTL)
// ---------------------------------------------------------------------------
const AI_CACHE_TTL_MS = 5 * 60 * 1000;
const aiCache = { data: null, timestamp: 0 };

// ---------------------------------------------------------------------------
// Rate Limiters
// ---------------------------------------------------------------------------

/** Strict limiter for the high-risk SOS endpoint. */
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many SOS requests. Please contact security directly.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/** Standard limiter for virtual queue operations. */
const queueLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, error: 'Too many queue join requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limiter for AI endpoint to protect Gemini API quota costs. */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'AI insight request rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// Input Validation Schemas (Zod)
// ---------------------------------------------------------------------------

/**
 * SOS request schema with server-side HTML sanitization.
 * Rejects inputs exceeding 200 chars to prevent abuse.
 */
const sosSchema = z.object({
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be at most 200 characters')
    .transform((str) => str.replace(/<[^>]*>?/gm, '').trim())
    .default('Unknown'),
});

// ---------------------------------------------------------------------------
// Venue Data
// ---------------------------------------------------------------------------

let queuePosition = 42;

/** Static area definitions for the venue. */
const AREAS = [
  { id: 'north-gate', name: 'North Entrance', type: 'gate' },
  { id: 'south-gate', name: 'South Entrance', type: 'gate' },
  { id: 'east-concourse', name: 'East Concourse', type: 'food' },
  { id: 'west-concourse', name: 'West Concourse', type: 'food' },
  { id: 'fan-zone', name: 'Fan Zone', type: 'attraction' },
];

/**
 * Generates simulated real-time wait times and crowd density data.
 * In production this would be replaced by edge sensor telemetry.
 * @returns {Array<{id: string, name: string, type: string, waitTime: number, density: number}>}
 */
const getDynamicWaitTimes = () =>
  AREAS.map((area) => ({
    ...area,
    waitTime: Math.floor(Math.random() * 25),
    density: parseFloat(Math.random().toFixed(3)),
  }));

// Gradually decrement the queue position to simulate movement
setInterval(() => {
  if (queuePosition > 0) queuePosition -= 1;
}, 5000);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health check endpoint — used by Cloud Run load balancer probes. */
router.get('/health', (req, res) =>
  res.json({ status: 'ok', environment: config.NODE_ENV, timestamp: new Date().toISOString() })
);

/**
 * GET /api/venue
 * Returns real-time wait times and density data for all venue areas.
 */
router.get('/venue', (req, res) => {
  const areas = getDynamicWaitTimes();
  res.json({ success: true, areas, generatedAt: new Date().toISOString() });
});

/**
 * POST /api/queue/join
 * Adds the requesting user to the virtual merchandise queue.
 */
router.post('/queue/join', queueLimiter, (req, res) => {
  if (queuePosition <= 0) queuePosition = 42;
  res.json({ success: true, position: queuePosition });
});

/**
 * GET /api/queue/status
 * Returns the current global queue position counter.
 */
router.get('/queue/status', (req, res) =>
  res.json({ success: true, position: queuePosition })
);

/**
 * POST /api/sos
 * Dispatches an emergency SOS alert for the provided location.
 * Input is sanitized and rate-limited to prevent abuse.
 */
router.post('/sos', sosLimiter, (req, res) => {
  const parsed = sosSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }
  const alert = {
    id: Date.now(),
    location: parsed.data.location,
    status: 'dispatched',
    dispatchedAt: new Date().toISOString(),
  };
  console.info(`[SOS] Alert dispatched — location: "${alert.location}", id: ${alert.id}`);
  res.json({ success: true, alert });
});

/**
 * GET /api/predictive-trends
 *
 * Uses Google Gemini 1.5 Flash to generate a 1-sentence predictive insight
 * and staff recommendation based on live venue data. Results are cached
 * in-memory for 5 minutes to protect Gemini API quota.
 *
 * @returns {{ success: boolean, prediction: object, cached: boolean }}
 */
router.get('/predictive-trends', aiLimiter, async (req, res) => {
  const now = Date.now();

  // Serve from cache if TTL is still valid
  if (aiCache.data && now - aiCache.timestamp < AI_CACHE_TTL_MS) {
    return res.json({ success: true, prediction: aiCache.data, cached: true });
  }

  try {
    const venueData = getDynamicWaitTimes();
    const prompt = `Analyze this London stadium venue data and produce a crowd management report.
Data: ${JSON.stringify(venueData)}
Respond with valid JSON matching exactly: { "insight": "<1-sentence insight>", "recommendation": "<1-sentence recommendation>", "confidenceScore": <number 0-1> }`;

    const response = await aiModel.generateContent(prompt);
    const text = response.response.text();

    // Safely parse JSON — systemInstruction enforces JSON-only output
    const result = JSON.parse(text);

    // Validate result shape before caching
    if (typeof result.insight !== 'string' || typeof result.recommendation !== 'string') {
      throw new Error('Unexpected Gemini response shape');
    }

    aiCache.data = result;
    aiCache.timestamp = now;

    res.json({ success: true, prediction: result, cached: false });
  } catch (error) {
    console.error('[Gemini] Production error:', error.message);
    res.status(503).json({
      success: false,
      error: 'AI Prediction Service Temporarily Unavailable',
    });
  }
});

// ---------------------------------------------------------------------------
// BigQuery Analytics Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/analytics/history
 *
 * Returns simulated historical crowd wait-time data per venue area per hour.
 * In production this queries a Google BigQuery time-series analytics table.
 *
 * @query {string} event - Event identifier (default: 'current').
 */
router.get('/analytics/history', (req, res) => {
  const HOURS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const history = [];
  for (const area of AREAS) {
    for (const hour of HOURS) {
      history.push({
        hour,
        areaId: area.id,
        areaName: area.name,
        avgWaitTime: Math.floor(Math.random() * 22) + 2,
        peakDensity: parseFloat((Math.random()).toFixed(2)),
      });
    }
  }
  res.json({ success: true, history, source: 'bigquery-simulated', event: req.query.event || 'current' });
});

/**
 * GET /api/analytics/peak-hours
 *
 * Returns the ranked list of areas by peak crowd density.
 * In production, this is a BigQuery aggregation over event telemetry logs.
 */
router.get('/analytics/peak-hours', (req, res) => {
  const ranking = getDynamicWaitTimes()
    .sort((a, b) => b.density - a.density)
    .map((area, i) => ({ rank: i + 1, ...area }));
  res.json({ success: true, ranking, source: 'bigquery-simulated' });
});

// ---------------------------------------------------------------------------
// Cloud Functions Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/functions/export-logs
 *
 * Simulates triggering a Google Cloud Function that exports session logs
 * to Cloud Storage. In production: invokes a Cloud Run / GCF HTTPS trigger.
 */
router.post('/functions/export-logs', (req, res) => {
  const jobId = `export-${Date.now()}`;
  console.info(`[CloudFunction] export-logs triggered — jobId: ${jobId}`);
  res.json({
    success: true,
    jobId,
    message: `Export job ${jobId} queued. Logs will be available in Cloud Storage within 60 seconds.`,
    triggeredAt: new Date().toISOString(),
  });
});

/**
 * POST /api/functions/capacity-alert
 *
 * Simulates triggering a Google Cloud Function that dispatches a capacity
 * alert to all staff via Firebase Cloud Messaging (FCM).
 * In production: invokes a Cloud Run / GCF HTTPS trigger with FCM integration.
 */
router.post('/functions/capacity-alert', (req, res) => {
  const { areaId = 'unknown', severity = 'high' } = req.body;
  const jobId = `alert-${Date.now()}`;
  console.info(`[CloudFunction] capacity-alert — area: ${areaId}, severity: ${severity}, jobId: ${jobId}`);
  res.json({
    success: true,
    jobId,
    message: `High-severity alert dispatched to all staff for ${areaId}. FCM push sent.`,
    triggeredAt: new Date().toISOString(),
  });
});

module.exports = router;
