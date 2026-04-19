import React, { useState, useEffect, useCallback } from 'react';
import { fetchHistoricalAnalytics } from '../services/bigQueryService';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';

/**
 * HistoricalTrends Component
 *
 * Displays a historical crowd wait-time chart for key venue areas,
 * powered by data fetched from the Google BigQuery analytics backend.
 * Visualizes per-hour average wait times as a custom CSS bar chart.
 *
 * @component
 * @returns {JSX.Element}
 */
const HistoricalTrends = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchHistoricalAnalytics();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxWait = data.length > 0 ? Math.max(...data.map((d) => d.avgWaitTime), 1) : 1;

  return (
    <section
      className="glass-card animate-in historical-card"
      style={{ animationDelay: '0.5s' }}
      aria-labelledby="historical-title"
    >
      <div className="historical-header">
        <h3 id="historical-title" className="historical-title">
          <BarChart3 size={20} aria-hidden="true" className="historical-icon" />
          Historical Crowd Analytics
        </h3>
        <button
          onClick={load}
          disabled={loading}
          aria-label={loading ? 'Refreshing historical data' : 'Refresh historical analytics'}
          className="gemini-refresh-btn"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} aria-hidden="true" />
        </button>
      </div>

      <p className="historical-subtitle">
        Powered by <strong>Google BigQuery</strong> — per-hour crowd telemetry for today's event.
      </p>

      <div aria-live="polite" aria-atomic="true">
        {loading && (
          <p className="historical-loading" role="status">
            Querying BigQuery analytics pipeline...
          </p>
        )}

        {error && !loading && (
          <p className="historical-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data.length > 0 && (
          <div
            className="historical-chart"
            role="list"
            aria-label="Hourly average wait times by area"
          >
            {data.map((point) => {
              const pct = Math.round((point.avgWaitTime / maxWait) * 100);
              return (
                <div
                  key={`${point.areaId}-${point.hour}`}
                  className="historical-bar-row"
                  role="listitem"
                  aria-label={`${point.areaName} at ${point.hour}: ${point.avgWaitTime} minute average wait`}
                >
                  <div className="historical-bar-label">
                    <span className="historical-hour">{point.hour}</span>
                    <span className="historical-area">{point.areaName}</span>
                  </div>
                  <div
                    className="historical-bar-track"
                    role="progressbar"
                    aria-valuenow={point.avgWaitTime}
                    aria-valuemin={0}
                    aria-valuemax={maxWait}
                    aria-label={`${point.avgWaitTime} min`}
                  >
                    <div
                      className="historical-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="historical-bar-value">{point.avgWaitTime}m</span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <p className="historical-empty">No historical data available for this event yet.</p>
        )}
      </div>

      <p className="historical-footer">
        <TrendingUp size={12} aria-hidden="true" />
        Data aggregated from BigQuery event analytics table in real-time.
      </p>
    </section>
  );
};

export default HistoricalTrends;
