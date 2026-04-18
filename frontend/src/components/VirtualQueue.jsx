import React, { useState, useEffect } from 'react';
import { joinVirtualQueue, getQueueStatus } from '../services/crowdSimulation';
import { ShoppingBag, Users } from 'lucide-react';

const VirtualQueue = () => {
  const [inQueue, setInQueue] = useState(false);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (inQueue) {
      interval = setInterval(async () => {
        const { position } = await getQueueStatus();
        setPosition(position);
        if (position <= 0) {
          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
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
    <div className="glass-card animate-in" style={{ animationDelay: '0.2s' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={20} color="var(--primary)" /> Virtual Queue
      </h3>
      <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '8px' }}>
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
        >
          <Users size={18} /> {loading ? 'Joining...' : 'Join Merch Queue'}
        </button>
      ) : (
        <div style={{ marginTop: '16px', textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            #{position}
          </div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
            Position in Line
          </div>
          {position <= 0 ? (
            <div style={{ color: 'var(--success)', fontWeight: 700, marginTop: '12px' }}>
              Your Turn! Proceed to Store.
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '4px' }}>
              Estimated wait: {Math.round(position * 0.5)} mins
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualQueue;
