import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../services/apiRoutes.cjs';

// Create a sterile express app for testing the routes in isolation
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Production StadiumSync API', () => {

  // ─── Health ────────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('returns 200 with ok status and environment field', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.environment).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ─── Venue ─────────────────────────────────────────────────────────────────
  describe('GET /api/venue', () => {
    it('returns an array of area objects with required fields', async () => {
      const res = await request(app).get('/api/venue');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.areas).toBeInstanceOf(Array);
      expect(res.body.areas.length).toBeGreaterThan(0);
      expect(res.body.areas[0]).toHaveProperty('id');
      expect(res.body.areas[0]).toHaveProperty('waitTime');
      expect(res.body.areas[0]).toHaveProperty('density');
    });
  });

  // ─── Queue ─────────────────────────────────────────────────────────────────
  describe('Virtual Queue', () => {
    it('POST /api/queue/join returns a queue position', async () => {
      const res = await request(app).post('/api/queue/join');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.position).toBe('number');
    });

    it('GET /api/queue/status returns the current position', async () => {
      const res = await request(app).get('/api/queue/status');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.position).toBe('number');
    });
  });

  // ─── SOS ───────────────────────────────────────────────────────────────────
  describe('POST /api/sos', () => {
    it('sanitizes and accepts a valid location string', async () => {
      const payload = { location: '<b>Section A</b> <script>alert(1)</script>' };
      const res = await request(app).post('/api/sos').send(payload);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // HTML tags must be stripped
      expect(res.body.alert.location).not.toContain('<b>');
      expect(res.body.alert.location).not.toContain('<script>');
      expect(res.body.alert.location).toContain('Section A');
      // dispatchedAt timestamp must be present
      expect(res.body.alert.dispatchedAt).toBeDefined();
    });

    it('returns 400 and structured field errors for an oversized location', async () => {
      const res = await request(app).post('/api/sos').send({ location: 'a'.repeat(500) });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
    });

    it('accepts a request with no body and uses the default location', async () => {
      const res = await request(app).post('/api/sos').send({});
      expect(res.statusCode).toBe(200);
      expect(res.body.alert.location).toBe('Unknown');
    });
  });

  // ─── Gemini / AI ───────────────────────────────────────────────────────────
  describe('GET /api/predictive-trends', () => {
    it('returns 200 or 503 depending on API key availability', async () => {
      const res = await request(app).get('/api/predictive-trends');
      expect([200, 503]).toContain(res.statusCode);
    });

    it('returns cached:true on subsequent requests within TTL', async () => {
      const first = await request(app).get('/api/predictive-trends');
      if (first.statusCode === 200) {
        const second = await request(app).get('/api/predictive-trends');
        expect(second.statusCode).toBe(200);
        expect(second.body.cached).toBe(true);
        expect(second.body.prediction).toEqual(first.body.prediction);
      }
    });

    it('returns 503 with a user-friendly error message on AI failure', async () => {
      // The test environment has no GEMINI_API_KEY — verify the fallback shape
      const res = await request(app).get('/api/predictive-trends');
      if (res.statusCode === 503) {
        expect(res.body.success).toBe(false);
        expect(typeof res.body.error).toBe('string');
      }
    });
  });

  // ─── BigQuery Analytics ─────────────────────────────────────────────────────
  describe('BigQuery Analytics Routes', () => {
    it('GET /api/analytics/history returns per-area history data', async () => {
      const res = await request(app).get('/api/analytics/history?event=current');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.history).toBeInstanceOf(Array);
      expect(res.body.history.length).toBeGreaterThan(0);
      expect(res.body.source).toBe('bigquery-simulated');
      // Validate shape of a data point
      const point = res.body.history[0];
      expect(point).toHaveProperty('hour');
      expect(point).toHaveProperty('areaId');
      expect(point).toHaveProperty('avgWaitTime');
      expect(point).toHaveProperty('peakDensity');
    });

    it('GET /api/analytics/peak-hours returns a ranked density list', async () => {
      const res = await request(app).get('/api/analytics/peak-hours');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ranking).toBeInstanceOf(Array);
      expect(res.body.ranking[0]).toHaveProperty('rank');
      expect(res.body.ranking[0].rank).toBe(1);
    });
  });

  // ─── Cloud Functions ────────────────────────────────────────────────────────
  describe('Cloud Functions Routes', () => {
    it('POST /api/functions/export-logs returns a jobId and message', async () => {
      const res = await request(app).post('/api/functions/export-logs').send({});
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.jobId).toBe('string');
      expect(res.body.jobId).toMatch(/^export-/);
      expect(typeof res.body.message).toBe('string');
      expect(res.body.triggeredAt).toBeDefined();
    });

    it('POST /api/functions/capacity-alert returns a jobId for the given area', async () => {
      const res = await request(app)
        .post('/api/functions/capacity-alert')
        .send({ areaId: 'north-gate', severity: 'high' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.jobId).toBe('string');
      expect(res.body.jobId).toMatch(/^alert-/);
      expect(res.body.message).toContain('north-gate');
    });
  });
});
