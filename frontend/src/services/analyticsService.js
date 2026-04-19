/**
 * @fileoverview Google Analytics 4 (GA4) Event Tracking Service
 * 
 * Wraps the standard gtag() function with structured, type-safe event
 * helpers specific to the StadiumSync domain.
 * 
 * @module analyticsService
 */

/**
 * Type-safe wrapper for the global gtag function.
 * Checks for gtag availability to prevent errors in environments without GA.
 *
 * @param {string} command - The gtag command (e.g., 'event').
 * @param {string} action - The event name.
 * @param {Object} [params] - Optional event parameters.
 */
const sendEvent = (command, action, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(command, action, params);
  }
};

/**
 * Tracks when a user successfully authenticates.
 * @param {'login' | 'sign_up'} method - The authentication method used.
 * @param {'email' | 'google'} provider - The auth provider used.
 */
export const trackAuth = (method, provider = 'email') => {
  sendEvent('event', method, { method: provider });
};

/**
 * Tracks when a user joins the virtual merchandise queue.
 * @param {number} position - The position assigned in the queue.
 */
export const trackQueueJoin = (position) => {
  sendEvent('event', 'queue_join', {
    event_category: 'engagement',
    event_label: 'Virtual Merch Queue',
    value: position,
  });
};

/**
 * Tracks when an Emergency SOS alert is dispatched.
 * @param {string} location - The reported location of the emergency.
 */
export const trackSOSAlert = (location) => {
  sendEvent('event', 'sos_dispatched', {
    event_category: 'safety',
    event_label: location,
    non_interaction: false,
  });
};

/**
 * Tracks a user viewing the predictive AI insights panel.
 * @param {boolean} wasCached - Whether the result was served from cache.
 * @param {number} [confidenceScore] - The confidence score from the AI model.
 */
export const trackAiInsightView = (wasCached, confidenceScore) => {
  sendEvent('event', 'ai_insight_viewed', {
    event_category: 'google_ai',
    cached: wasCached,
    confidence_score: confidenceScore,
  });
};

/**
 * Tracks when a user navigates to the map heatmap view.
 * @param {boolean} heatmapVisible - Whether the heatmap was toggled on or off.
 */
export const trackMapInteraction = (heatmapVisible) => {
  sendEvent('event', 'map_heatmap_toggle', {
    event_category: 'engagement',
    heatmap_state: heatmapVisible ? 'shown' : 'hidden',
  });
};

/**
 * Tracks page views for SPA navigation.
 * @param {string} pagePath - The current page path (e.g., '/dashboard').
 * @param {string} pageTitle - The title of the current page.
 */
export const trackPageView = (pagePath, pageTitle) => {
  sendEvent('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};
