import React, { useState } from 'react';
import { triggerSOSAlert } from '../services/crowdSimulation';
import { ShieldAlert } from 'lucide-react';

const EmergencySOS = React.memo(() => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerSOS = async () => {
    if (confirm('Are you sure you want to trigger an Emergency SOS? This will alert venue security and relay your precise location.')) {
      setLoading(true);
      const result = await triggerSOSAlert();
      
      if (result.success) {
        setActive(true);
        setTimeout(() => setActive(false), 5000); // Pulse effect duration
      } else {
        alert('SOS Failed to send. Please find the nearest staff member immediately.');
      }
      setLoading(false);
    }
  };

  return (
    <section className="glass-card animate-in" style={{ animationDelay: '0.3s', borderLeft: '4px solid var(--danger)' }} aria-labelledby="sos-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 id="sos-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} aria-hidden="true" /> Emergency SOS
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Immediate medical or security assistance.</p>
        </div>
        <button 
          className={active ? 'sos-active' : ''}
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            border: 'none', 
            background: loading ? 'gray' : 'var(--danger)', 
            boxShadow: loading ? 'none' : '0 0 15px rgba(239, 68, 68, 0.5)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}
          onClick={triggerSOS}
          disabled={loading}
          aria-label={loading ? 'Sending SOS' : 'Trigger SOS'}
        >
          <ShieldAlert size={32} color="white" aria-hidden="true" />
        </button>
      </div>
      
      {/* aria-live assertive ensures this is read immediately over everything else */}
      <div aria-live="assertive">
        {active && (
          <div role="alert" style={{ marginTop: '16px', color: 'var(--danger)', fontWeight: 700, textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
            ⚠️ ALERT SENT. SECURITY DISPATCHED.
          </div>
        )}
      </div>

      <style>{`
        .sos-active {
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          from { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
          to { transform: scale(1.1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
        }
      `}</style>
    </section>
  );
});

export default EmergencySOS;
