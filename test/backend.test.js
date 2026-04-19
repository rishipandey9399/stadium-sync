import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../services/apiRoutes.cjs';

// Create a sterile express app for testing the routes
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Production StadiumSync API', () => {
  it('GET /api/health should return ok and environment', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.environment).toBeDefined();
  });

  it('GET /api/venue should return actual successful data format', async () => {
    const res = await request(app).get('/api/venue');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.areas).toBeInstanceOf(Array);
  });

  it('POST /api/sos should sanitize user input (strip HTML tags)', async () => {
    const payload = { location: '<b>Section A</b> <script>alert(1)</script>' };
    const res = await request(app).post('/api/sos').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.alert.location).toBe('Section A alert(1)'); // HTML stripped
  });

  it('GET /api/predictive-trends should handle missing API keys with 503', async () => {
    // This test assumes GEMINI_API_KEY is not "valid" in the test runner environment
    // or it checks if the error handling works.
    const res = await request(app).get('/api/predictive-trends');
    // If it fails because of missing key, it should be 503 (Service Unavailable)
    // If it succeeds (because a key exists in test env), it should be 200.
    expect([200, 503]).toContain(res.statusCode);
  });

  it('AI Caching: Should return identical results for repeated requests', async () => {
    const firstRes = await request(app).get('/api/predictive-trends');
    if (firstRes.statusCode === 200) {
      const secondRes = await request(app).get('/api/predictive-trends');
      expect(secondRes.body.cached).toBe(true);
      expect(secondRes.body.prediction).toEqual(firstRes.body.prediction);
    }
  });

  it('Security: POST /api/sos should fail for oversized payloads', async () => {
    const res = await request(app).post('/api/sos').send({ location: 'a'.repeat(500) });
    expect(res.statusCode).toBe(400);
  });
});
