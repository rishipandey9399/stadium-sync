import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerExportSessionLogs, triggerCapacityAlert } from '../services/cloudFunctionsService';

global.fetch = vi.fn();

describe('CloudFunctionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── triggerExportSessionLogs ───────────────────────────────────────────────
  describe('triggerExportSessionLogs', () => {
    it('returns success with jobId and message on 200 response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          jobId: 'export-123456',
          message: 'Export job export-123456 queued.',
          triggeredAt: new Date().toISOString(),
        }),
      });

      const result = await triggerExportSessionLogs();

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('export-123456');
      expect(typeof result.message).toBe('string');
      expect(result.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        '/api/functions/export-logs',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns error result on non-ok HTTP response', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await triggerExportSessionLogs();
      expect(result.success).toBe(false);
      expect(result.jobId).toBeNull();
      expect(typeof result.error).toBe('string');
    });

    it('returns error result on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await triggerExportSessionLogs();
      expect(result.success).toBe(false);
      expect(result.jobId).toBeNull();
    });

    it('sends a POST request with triggeredAt timestamp in the body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: 'x', message: 'ok' }),
      });

      await triggerExportSessionLogs();

      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(typeof body.triggeredAt).toBe('string');
    });
  });

  // ─── triggerCapacityAlert ───────────────────────────────────────────────────
  describe('triggerCapacityAlert', () => {
    it('returns success with jobId on 200 response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          jobId: 'alert-789',
          message: 'FCM push sent to all staff.',
          triggeredAt: new Date().toISOString(),
        }),
      });

      const result = await triggerCapacityAlert('north-gate', 'high');

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('alert-789');
      expect(result.error).toBeNull();
    });

    it('sends the correct areaId and severity in the request body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: 'y', message: 'ok' }),
      });

      await triggerCapacityAlert('east-concourse', 'critical');

      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.areaId).toBe('east-concourse');
      expect(body.severity).toBe('critical');
    });

    it('defaults to "high" severity if not specified', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: 'z', message: 'ok' }),
      });

      await triggerCapacityAlert('fan-zone');

      const callArgs = fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.severity).toBe('high');
    });

    it('returns error result on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await triggerCapacityAlert('north-gate', 'medium');
      expect(result.success).toBe(false);
      expect(result.jobId).toBeNull();
    });
  });
});
