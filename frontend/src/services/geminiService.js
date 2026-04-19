/**
 * @fileoverview Gemini AI Insights Service
 * 
 * Provides a clean, typed interface to the StadiumSync Gemini-powered
 * predictive analytics backend endpoint. Separates all AI-related
 * network logic from UI components.
 *
 * @module geminiService
 */

const API_BASE = '/api';

/**
 * @typedef {Object} GeminiPrediction
 * @property {string} insight - A single-sentence predictive insight.
 * @property {string} recommendation - A single-sentence staff recommendation.
 * @property {number} confidenceScore - A 0-1 confidence score from the model.
 */

/**
 * @typedef {Object} GeminiInsightResult
 * @property {boolean} success - Whether the request was successful.
 * @property {GeminiPrediction | null} prediction - The AI prediction data.
 * @property {boolean} cached - Whether the result was served from cache.
 * @property {string | null} error - Error message if unsuccessful.
 */

/**
 * Fetches predictive crowd insights from the Gemini AI backend endpoint.
 * The backend implements a 5-minute TTL cache to prevent redundant API calls.
 *
 * @returns {Promise<GeminiInsightResult>} The structured AI insight result.
 */
export const fetchPredictiveInsights = async () => {
  try {
    const response = await fetch(`${API_BASE}/predictive-trends`);
    if (!response.ok) {
      throw new Error(`Insight service error: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      prediction: data.prediction,
      cached: data.cached ?? false,
      error: null,
    };
  } catch (error) {
    console.error('[GeminiService] Failed to fetch insights:', error);
    return {
      success: false,
      prediction: null,
      cached: false,
      error: 'AI Prediction Service is temporarily unavailable.',
    };
  }
};
