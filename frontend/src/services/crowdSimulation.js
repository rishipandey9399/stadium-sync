/**
 * StadiumSync API Service
 * Fetches real data from the backend.
 */

const API_BASE = '/api';

export const getLiveWaitTimes = async () => {
  try {
    const response = await fetch(`${API_BASE}/venue`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.areas;
  } catch (error) {
    console.error('Failed to fetch wait times:', error);
    // Fallback data for safety
    return [
      { id: 'error-gate', name: 'Unable to connect to server', type: 'gate', waitTime: 0, density: 0 }
    ];
  }
};

export const getCrowdHeatmap = async () => {
  // We can just use the density from getLiveWaitTimes under the hood, but keeping interface.
  return [];
};

export const estimateRouteTime = async (from, to) => {
  // Simulated async calculation on the server could go here.
  // For now, return static for the UI stub.
  return 5;
};

// Queue APIs
export const joinVirtualQueue = async () => {
  try {
    const response = await fetch(`${API_BASE}/queue/join`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to join queue');
    return await response.json();
  } catch (error) {
    console.error('Queue Join Error:', error);
    return { success: false, position: null };
  }
};

export const getQueueStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/queue/status`);
    if (!response.ok) throw new Error('Failed to fetch queue status');
    return await response.json();
  } catch (error) {
    console.error('Queue Status Error:', error);
    return { position: null };
  }
};

// SOS API
export const triggerSOSAlert = async () => {
  try {
    const response = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Section 204, Row G, Seat 12',
        timestamp: new Date().toISOString()
      })
    });
    if (!response.ok) throw new Error('Failed to send SOS');
    return await response.json();
  } catch (error) {
    console.error('SOS Error:', error);
    return { success: false };
  }
};
