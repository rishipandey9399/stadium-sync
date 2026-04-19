import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackAuth,
  trackQueueJoin,
  trackSOSAlert,
  trackAiInsightView,
  trackMapInteraction,
  trackPageView,
} from '../services/analyticsService';

describe('AnalyticsService', () => {
  let gtagMock;

  beforeEach(() => {
    gtagMock = vi.fn();
    global.window = { gtag: gtagMock };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('trackAuth sends a login event with the correct provider', () => {
    trackAuth('login', 'google');
    expect(gtagMock).toHaveBeenCalledWith('event', 'login', { method: 'google' });
  });

  it('trackAuth sends a sign_up event', () => {
    trackAuth('sign_up', 'email');
    expect(gtagMock).toHaveBeenCalledWith('event', 'sign_up', { method: 'email' });
  });

  it('trackQueueJoin sends the correct queue position as value', () => {
    trackQueueJoin(12);
    expect(gtagMock).toHaveBeenCalledWith('event', 'queue_join', expect.objectContaining({ value: 12 }));
  });

  it('trackSOSAlert sends safety category event with location', () => {
    trackSOSAlert('North Gate');
    expect(gtagMock).toHaveBeenCalledWith('event', 'sos_dispatched', expect.objectContaining({
      event_category: 'safety',
      event_label: 'North Gate',
    }));
  });

  it('trackAiInsightView sends google_ai category event', () => {
    trackAiInsightView(true, 0.95);
    expect(gtagMock).toHaveBeenCalledWith('event', 'ai_insight_viewed', expect.objectContaining({
      event_category: 'google_ai',
      cached: true,
      confidence_score: 0.95,
    }));
  });

  it('trackMapInteraction sends heatmap toggle event', () => {
    trackMapInteraction(true);
    expect(gtagMock).toHaveBeenCalledWith('event', 'map_heatmap_toggle', expect.objectContaining({
      heatmap_state: 'shown',
    }));
  });

  it('trackPageView sends page_view event with path and title', () => {
    trackPageView('/dashboard', 'StadiumSync Dashboard');
    expect(gtagMock).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/dashboard',
      page_title: 'StadiumSync Dashboard',
    });
  });

  it('does not throw if gtag is not available (no-op)', () => {
    global.window = {}; // no gtag
    expect(() => trackAuth('login', 'email')).not.toThrow();
  });
});
