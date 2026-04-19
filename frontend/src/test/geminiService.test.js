import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPredictiveInsights } from '../services/geminiService';

global.fetch = vi.fn();

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a successful prediction on 200 response', async () => {
    const mockPrediction = {
      insight: 'North Gate is approaching capacity.',
      recommendation: 'Redirect staff to North Gate immediately.',
      confidenceScore: 0.92,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, prediction: mockPrediction, cached: false }),
    });

    const result = await fetchPredictiveInsights();

    expect(result.success).toBe(true);
    expect(result.prediction.insight).toBe('North Gate is approaching capacity.');
    expect(result.cached).toBe(false);
    expect(result.error).toBeNull();
  });

  it('returns cached:true when the backend serves from cache', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        prediction: { insight: 'All clear.', recommendation: 'Maintain.', confidenceScore: 0.8 },
        cached: true,
      }),
    });

    const result = await fetchPredictiveInsights();
    expect(result.cached).toBe(true);
  });

  it('returns an error result for non-ok HTTP response', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const result = await fetchPredictiveInsights();

    expect(result.success).toBe(false);
    expect(result.prediction).toBeNull();
    expect(result.error).toContain('temporarily unavailable');
  });

  it('returns an error result when fetch throws a network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network failure'));

    const result = await fetchPredictiveInsights();

    expect(result.success).toBe(false);
    expect(result.prediction).toBeNull();
    expect(typeof result.error).toBe('string');
  });
});
