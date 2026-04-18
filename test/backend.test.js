import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../services/apiRoutes.cjs';

// Create a sterile express app for testing the routes
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Hardened Backend API Security & Integration', () => {
  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/venue should return success and simulated areas', async () => {
    const res = await request(app).get('/api/venue');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.areas).toBeInstanceOf(Array);
    expect(res.body.areas.length).toBeGreaterThan(0);
  });

  it('POST /api/sos should correctly validate strings via Zod', async () => {
    const payload = { location: 'Premium Suite 402' };
    const res = await request(app).post('/api/sos').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alert.location).toBe('Premium Suite 402');
  });

  it('POST /api/sos should reject invalid types (numbers) via Zod', async () => {
    const payload = { location: 12345 };
    const res = await request(app).post('/api/sos').send(payload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Failed');
  });

  it('POST /api/sos should reject oversized payloads (>200 chars) via Zod', async () => {
    const payload = { location: 'a'.repeat(201) };
    const res = await request(app).post('/api/sos').send(payload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/predictive-trends should return high-confidence AI result', async () => {
    const res = await request(app).get('/api/predictive-trends');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.prediction).toHaveProperty('insight');
    expect(res.body.prediction).toHaveProperty('recommendation');
    expect(res.body.prediction.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
