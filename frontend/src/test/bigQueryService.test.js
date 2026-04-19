import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHistoricalAnalytics, fetchPeakHourRanking } from '../services/bigQueryService';

global.fetch = vi.fn();

describe('BigQueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchHistoricalAnalytics ───────────────────────────────────────────────
  describe('fetchHistoricalAnalytics', () => {
    it('returns success with history array on 200 response', async () => {
      const mockHistory = [
        { hour: '14:00', areaId: 'north-gate', areaName: 'North Entrance', avgWaitTime: 12, peakDensity: 0.65 },
        { hour: '15:00', areaId: 'north-gate', areaName: 'North Entrance', avgWaitTime: 18, peakDensity: 0.82 },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, history: mockHistory, source: 'bigquery-simulated' }),
      });

      const result = await fetchHistoricalAnalytics('current');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].avgWaitTime).toBe(12);
      expect(result.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics/history?event=current',
        expect.objectContaining({ headers: { Accept: 'application/json' } })
      );
    });

    it('returns empty data array for empty history response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, history: [] }),
      });

      const result = await fetchHistoricalAnalytics();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('returns error result when response is not ok', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const result = await fetchHistoricalAnalytics();
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(typeof result.error).toBe('string');
    });

    it('returns error result on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network down'));

      const result = await fetchHistoricalAnalytics();
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('uses "current" as default eventId', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, history: [] }),
      });

      await fetchHistoricalAnalytics();
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics/history?event=current',
        expect.any(Object)
      );
    });
  });

  // ─── fetchPeakHourRanking ───────────────────────────────────────────────────
  describe('fetchPeakHourRanking', () => {
    it('returns ranking data on 200 response', async () => {
      const mockRanking = [
        { rank: 1, id: 'north-gate', name: 'North Entrance', density: 0.91 },
        { rank: 2, id: 'fan-zone',   name: 'Fan Zone',       density: 0.76 },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, ranking: mockRanking }),
      });

      const result = await fetchPeakHourRanking();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rank).toBe(1);
    });

    it('returns error result on failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await fetchPeakHourRanking();
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });
  });
});
