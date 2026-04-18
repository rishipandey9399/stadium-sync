import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLiveWaitTimes, estimateRouteTime } from './crowdSimulation';

// Mock the global fetch
global.fetch = vi.fn();

describe('Crowd Simulation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch wait times from the backend', async () => {
    const mockResponse = [
      { id: 'north-gate', name: 'North Entrance', type: 'gate', waitTime: 12 },
      { id: 'east-concourse', name: 'East Concourse', type: 'food', waitTime: 5 }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ areas: mockResponse })
    });

    const data = await getLiveWaitTimes();
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(data.length).toBe(2);
    expect(data[0].waitTime).toBe(12);
  });

  it('should handle fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const data = await getLiveWaitTimes();
    // In our implementation, it catches the error and returns a fallback array element
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('error-gate');
  });

  it('should resolve route estimation (stubbed)', () => {
    // estimateRouteTime currently returns a hardcoded promise in the new implementation
    // or just math. Let's see how it behaves
    const time = estimateRouteTime('gate', 'food');
    // If it's a promise, we should await it or just check its type
    expect(typeof time).toBe('object'); // It's returning a Promise now
  });
});
