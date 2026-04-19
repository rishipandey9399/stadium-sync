/**
 * @fileoverview BigQuery Analytics Service
 *
 * Provides an interface to the StadiumSync historical crowd analytics
 * endpoint, which aggregates data from Google BigQuery. BigQuery stores
 * long-term time-series crowd data per area, enabling trend analysis
 * across events.
 *
 * In production: requests go to a Cloud Run function that streams from
 * a BigQuery public dataset or a private event analytics table.
 * In this environment: the backend simulates the BigQuery response shape.
 *
 * @module bigQueryService
 * @see {@link https://cloud.google.com/bigquery/docs Google BigQuery Docs}
 */

const API_BASE = '/api';

/**
 * @typedef {Object} HistoricalDataPoint
 * @property {string} hour - Hour label, e.g. "14:00".
 * @property {string} areaId - Venue area identifier.
 * @property {string} areaName - Human-readable area name.
 * @property {number} avgWaitTime - Average wait time in minutes for that hour.
 * @property {number} peakDensity - Peak crowd density (0–1) recorded in that hour.
 */

/**
 * @typedef {Object} BigQueryAnalyticsResult
 * @property {boolean} success - Whether the request succeeded.
 * @property {HistoricalDataPoint[]} data - Historical data points.
 * @property {string | null} error - Error message if unsuccessful.
 */

/**
 * Fetches historical crowd analytics for the current event from the
 * BigQuery-backed analytics endpoint.
 *
 * @param {string} [eventId='current'] - ID of the event to query.
 * @returns {Promise<BigQueryAnalyticsResult>}
 */
export const fetchHistoricalAnalytics = async (eventId = 'current') => {
  try {
    const response = await fetch(`${API_BASE}/analytics/history?event=${eventId}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`BigQuery analytics error: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data: data.history ?? [], error: null };
  } catch (error) {
    console.error('[BigQueryService] Failed to fetch historical analytics:', error);
    return { success: false, data: [], error: 'Historical analytics temporarily unavailable.' };
  }
};

/**
 * Fetches the aggregated peak-hour ranking for all venue areas.
 * Uses BigQuery's time-series aggregation pipeline on the backend.
 *
 * @returns {Promise<BigQueryAnalyticsResult>}
 */
export const fetchPeakHourRanking = async () => {
  try {
    const response = await fetch(`${API_BASE}/analytics/peak-hours`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Peak hour ranking error: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data: data.ranking ?? [], error: null };
  } catch (error) {
    console.error('[BigQueryService] Failed to fetch peak hour ranking:', error);
    return { success: false, data: [], error: 'Peak hour data temporarily unavailable.' };
  }
};
