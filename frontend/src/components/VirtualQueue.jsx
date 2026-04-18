import React, { useState, useEffect, useCallback } from 'react';
import { joinVirtualQueue, getQueueStatus } from '../services/crowdSimulation';
import { ShoppingBag, Users } from 'lucide-react';

const VirtualQueue = React.memo(() => {
  const [inQueue, setInQueue] = useState(false);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    const pollStatus = async () => {
      // Efficiency: Only poll if the tab is visible
      if (document.visibilityState === 'visible' && inQueue) {
        const result = await getQueueStatus();
        setPosition(result.position);
        if (result.position <= 0) {
          clearInterval(interval);
        }
      }
    };

    if (inQueue) {
      interval = setInterval(pollStatus, 5000);
      
      // Add visibility listener for faster response when user returns
      document.addEventListener('visibilitychange', pollStatus);
    }
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', pollStatus);
    };
  }, [inQueue]);

  const handleJoinQueue = async () => {
    setLoading(true);
    const result = await joinVirtualQueue();
    if (result.success) {
      setPosition(result.position);
      setInQueue(true);
    } else {
      alert('Failed to join queue. Try again later.');
    }
    setLoading(false);
  };

  return (
    <section className="glass-card animate-in" style={{ animationDelay: '0.2s' }} aria-labelledby="virtual-queue-title">
      <h3 id="virtual-queue-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={20} color="var(--primary)" aria-hidden="true" /> Virtual Queue
      </h3>
      <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '8px' }}>
        Skip the line for Official Merchandise. Join the digital queue and we'll alert you when it's your turn.
      </p>
      
      {!inQueue ? (
        <button 
          className="auth-button"
          style={{ 
            marginTop: '16px', 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid var(--primary)',
          }}
          onClick={handleJoinQueue}
          disabled={loading}
          aria-live="polite"
          aria-label={loading ? "Joining the Merch Queue..." : "Join the Merch Queue"}
        >
          <Users size={18} aria-hidden="true" /> {loading ? 'Joining...' : 'Join Merch Queue'}
        </button>
      ) : (
        <div 
          aria-live="assertive" 
          role="status"
          style={{ marginTop: '16px', textAlign: 'center', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            #{position}
          </div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.9, fontWeight: 700 }}>
            Position in Line
          </div>
          {position <= 0 ? (
            <div style={{ color: 'var(--success)', fontWeight: 800, marginTop: '16px', fontSize: '1rem' }} role="alert">
              🎉 YOUR TURN! PROCEED TO STORE.
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>
              Estimated wait: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{Math.round(position * 0.5)} mins</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

export default VirtualQueue;
