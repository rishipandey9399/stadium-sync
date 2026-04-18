const express = require('express');
const router = express.Router();

// In-memory data store
let queuePosition = 42;
const sosLogs = [];

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

// Basic Endpoints
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
router.get('/venue', (req, res) => res.json({ areas: getDynamicWaitTimes() }));
router.post('/queue/join', (req, res) => {
  if (queuePosition <= 0) queuePosition = 42;
  res.json({ success: true, position: queuePosition });
});
router.get('/queue/status', (req, res) => res.json({ position: queuePosition }));
router.post('/sos', (req, res) => {
  const alert = { id: Date.now(), location: req.body.location || 'Unknown', status: 'dispatched' };
  sosLogs.push(alert);
  res.json({ success: true, alert });
});

// 🧠 Vertex AI Predictive Endpoint (Mocked)
router.get('/predictive-trends', async (req, res) => {
  const aiAnalysis = {
    insight: "Vertex AI prediction: North Concourse will experience a 400% surge in 5 minutes (Halftime).",
    recommendation: "Redirect automated announcements to steer fans towards the West Concourse.",
    confidenceScore: 0.94
  };

  res.json({ success: true, prediction: aiAnalysis });
});

module.exports = router;
