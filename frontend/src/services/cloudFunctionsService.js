/**
 * @fileoverview Google Cloud Functions Service
 *
 * Provides an interface to trigger serverless staff actions hosted on
 * Google Cloud Functions. Each function is a one-shot HTTPS-triggered
 * Cloud Function that executes administrative venue tasks asynchronously.
 *
 * In production: these are real Cloud Run / Cloud Functions HTTP endpoints.
 * In this environment: the backend simulates Cloud Function invocations.
 *
 * @module cloudFunctionsService
 * @see {@link https://cloud.google.com/functions/docs Google Cloud Functions Docs}
 */

const API_BASE = '/api';

/**
 * @typedef {Object} CloudFunctionResult
 * @property {boolean} success - Whether the function invocation succeeded.
 * @property {string} jobId - A unique identifier for the background job.
 * @property {string} message - A human-readable status message.
 * @property {string | null} error - Error message if unsuccessful.
 */

/**
 * Triggers the "Export Session Logs" Cloud Function.
 * In production, this invokes a Cloud Function that streams event logs
 * to a Cloud Storage bucket in NDJSON format.
 *
 * @returns {Promise<CloudFunctionResult>}
 */
export const triggerExportSessionLogs = async () => {
  try {
    const response = await fetch(`${API_BASE}/functions/export-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggeredAt: new Date().toISOString() }),
    });
    if (!response.ok) {
      throw new Error(`Export logs function error: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      jobId: data.jobId,
      message: data.message ?? 'Export initiated.',
      error: null,
    };
  } catch (error) {
    console.error('[CloudFunctionsService] Export logs failed:', error);
    return {
      success: false,
      jobId: null,
      message: '',
      error: 'Log export service temporarily unavailable.',
    };
  }
};

/**
 * Triggers the "Override Capacity Alert" Cloud Function.
 * In production, this invokes a Cloud Function that sends push notifications
 * to all registered staff devices via Firebase Cloud Messaging.
 *
 * @param {string} areaId - The ID of the area to issue an alert for.
 * @param {'low' | 'medium' | 'high' | 'critical'} severity - Alert severity level.
 * @returns {Promise<CloudFunctionResult>}
 */
export const triggerCapacityAlert = async (areaId, severity = 'high') => {
  try {
    const response = await fetch(`${API_BASE}/functions/capacity-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId, severity, triggeredAt: new Date().toISOString() }),
    });
    if (!response.ok) {
      throw new Error(`Capacity alert function error: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      jobId: data.jobId,
      message: data.message ?? 'Alert sent to all staff.',
      error: null,
    };
  } catch (error) {
    console.error('[CloudFunctionsService] Capacity alert failed:', error);
    return {
      success: false,
      jobId: null,
      message: '',
      error: 'Alert service temporarily unavailable.',
    };
  }
};
