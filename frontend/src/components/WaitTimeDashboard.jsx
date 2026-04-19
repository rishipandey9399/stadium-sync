import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToVenueStatus } from '../services/firestoreSync';
import { getLiveWaitTimes } from '../services/crowdSimulation';
import { Clock, MapPin, Navigation, Coffee } from 'lucide-react';

/**
 * Maps area type to icon component.
 * @param {string} type - Area type ('food' | 'gate' | 'attraction').
 * @returns {JSX.Element}
 */
const AreaIcon = ({ type }) => {
  switch (type) {
    case 'food': return <Coffee size={16} aria-hidden="true" />;
    default: return <MapPin size={16} aria-hidden="true" />;
  }
};

/**
 * WaitTimeDashboard Component
 *
 * Displays real-time crowd wait times for key stadium areas.
 * Subscribes to Firestore for live updates; falls back to the REST API
 * if Firestore returns no data (e.g. empty collection on first load).
 *
 * @component
 * @returns {JSX.Element}
 */
const WaitTimeDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleRouteToShortest = useCallback(() => {
    if (data.length === 0) return;
    const shortest = [...data].sort((a, b) => a.waitTime - b.waitTime)[0];
    // Would integrate with Google Maps Directions API in production
    console.info(`[WaitTimeDashboard] Navigate to: ${shortest.name} (${shortest.waitTime}m wait)`);
  }, [data]);

  useEffect(() => {
    const unsubscribe = subscribeToVenueStatus(async (newData) => {
      if (newData && newData.length > 0) {
        setData(newData);
        setLoading(false);
      } else {
        // Firestore returned empty – fall back to REST API data
        const apiData = await getLiveWaitTimes();
        setData(apiData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusClass = (time) => {
    if (time > 15) return 'status-high';
    if (time > 7) return 'status-med';
    return 'status-low';
  };

  if (loading) {
    return (
      <div className="glass-card animate-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="wait-time-title">
          <Clock size={20} color="var(--primary)" aria-hidden="true" />
          Wait Times
        </h3>
        <p className="wait-time-loading" role="status" aria-live="polite">
          Loading live data from Firestore...
        </p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => a.waitTime - b.waitTime);

  return (
    <div
      className="glass-card animate-in"
      style={{ animationDelay: '0.1s' }}
      role="region"
      aria-labelledby="wait-time-heading"
    >
      <h3 id="wait-time-heading" className="wait-time-title">
        <Clock size={20} color="var(--primary)" aria-hidden="true" />
        Live Wait Times
      </h3>

      <ul className="wait-time-list" aria-label="Stadium area wait times">
        {sortedData.map((area) => (
          <li
            key={area.id}
            className="wait-time-item"
            aria-label={`${area.name}: ${area.waitTime} minute wait`}
          >
            <div className="wait-time-area">
              <div className="wait-time-icon-wrap">
                <AreaIcon type={area.type} />
              </div>
              <div>
                <div className="wait-time-name">{area.name}</div>
                <div className="wait-time-type">
                  {area.type === 'food' ? 'Concessions' : 'Entrance'}
                </div>
              </div>
            </div>
            <div>
              <span className={`status-badge ${getStatusClass(area.waitTime)}`}>
                {area.waitTime} MIN
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button
        className="auth-button"
        style={{ marginTop: '20px' }}
        onClick={handleRouteToShortest}
        aria-label="Find and navigate to the area with the shortest wait time"
      >
        <Navigation size={18} aria-hidden="true" />
        Route to Shortest
      </button>
    </div>
  );
};

export default WaitTimeDashboard;
