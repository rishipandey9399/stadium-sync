import React, { useState, useEffect, useCallback } from 'react';
import { joinVirtualQueue, getQueueStatus } from '../services/crowdSimulation';
import { trackQueueJoin } from '../services/analyticsService';
import { ShoppingBag, Users } from 'lucide-react';

/**
 * VirtualQueue Component
 *
 * Allows attendees to join a digital merchandise queue, eliminating the need
 * to physically wait in line. Polls for queue position updates every 5 seconds
 * while the browser tab is active.
 *
 * @component
 * @returns {JSX.Element}
 */
const VirtualQueue = React.memo(() => {
  const [inQueue, setInQueue] = useState(false);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    if (!inQueue) return;

    let interval;

    const pollStatus = async () => {
      // Efficiency: Only poll when the tab is visible
      if (document.visibilityState !== 'visible') return;
      const result = await getQueueStatus();
      if (result.position !== null) {
        setPosition(result.position);
        if (result.position <= 0) clearInterval(interval);
      }
    };

    interval = setInterval(pollStatus, 5000);
    document.addEventListener('visibilitychange', pollStatus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', pollStatus);
    };
  }, [inQueue]);

  const handleJoinQueue = useCallback(async () => {
    setLoading(true);
    setJoinError(null);
    const result = await joinVirtualQueue();
    if (result.success) {
      setPosition(result.position);
      setInQueue(true);
      trackQueueJoin(result.position);
    } else {
      setJoinError('Failed to join queue. Please try again.');
    }
    setLoading(false);
  }, []);

  const estimatedWait = position > 0 ? Math.round(position * 0.5) : 0;

  return (
    <section
      className="glass-card animate-in"
      style={{ animationDelay: '0.2s' }}
      aria-labelledby="virtual-queue-title"
    >
      <h3 id="virtual-queue-title" className="queue-title">
        <ShoppingBag size={20} color="var(--primary)" aria-hidden="true" />
        Virtual Queue
      </h3>
      <p className="queue-description">
        Skip the line for Official Merchandise. Join the digital queue and we'll alert you when it's your turn.
      </p>

      {joinError && (
        <p role="alert" className="queue-error" aria-live="polite">
          {joinError}
        </p>
      )}

      {!inQueue ? (
        <button
          className="auth-button queue-join-btn"
          onClick={handleJoinQueue}
          disabled={loading}
          aria-busy={loading}
          aria-label={loading ? 'Joining the Merch Queue' : 'Join the Virtual Merch Queue'}
        >
          <Users size={18} aria-hidden="true" />
          {loading ? 'Joining...' : 'Join Merch Queue'}
        </button>
      ) : (
        <div
          aria-live="polite"
          role="status"
          className="queue-status"
        >
          <div className="queue-position" aria-label={`Queue position: ${position}`}>
            #{position}
          </div>
          <div className="queue-position-label">Position in Line</div>

          {position <= 0 ? (
            <div
              className="queue-ready"
              role="alert"
              aria-live="assertive"
            >
              🎉 YOUR TURN! PROCEED TO STORE.
            </div>
          ) : (
            <div className="queue-wait-estimate">
              Estimated wait:{' '}
              <span className="queue-wait-value" aria-label={`${estimatedWait} minutes`}>
                {estimatedWait} mins
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

VirtualQueue.displayName = 'VirtualQueue';

export default VirtualQueue;
