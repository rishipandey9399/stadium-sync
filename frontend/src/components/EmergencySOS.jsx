import React, { useState, useCallback } from 'react';
import { triggerSOSAlert } from '../services/crowdSimulation';
import { trackSOSAlert } from '../services/analyticsService';
import { ShieldAlert } from 'lucide-react';

/**
 * EmergencySOS Component
 *
 * Renders a one-tap Emergency SOS button for stadium attendees.
 * Dispatches a real alert to the backend and notifies security staff.
 * Fully accessible with ARIA live regions and keyboard support.
 *
 * @component
 * @returns {JSX.Element}
 */
const EmergencySOS = React.memo(() => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSOSRequest = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);
    setLoading(true);
    const result = await triggerSOSAlert();
    if (result.success) {
      setActive(true);
      trackSOSAlert(result.alert?.location ?? 'Unknown');
      setTimeout(() => setActive(false), 5000);
    }
    setLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <section
      className="glass-card animate-in sos-section"
      style={{ animationDelay: '0.3s' }}
      aria-labelledby="sos-title"
    >
      <div className="sos-header">
        <div>
          <h3 id="sos-title" className="sos-title">
            <ShieldAlert size={20} aria-hidden="true" />
            Emergency SOS
          </h3>
          <p className="sos-subtitle">Immediate medical or security assistance.</p>
        </div>
        <button
          className={`sos-button ${active ? 'sos-active' : ''}`}
          onClick={handleSOSRequest}
          disabled={loading || showConfirm}
          aria-label={loading ? 'Sending SOS alert' : 'Trigger emergency SOS alert'}
          aria-pressed={active}
        >
          <ShieldAlert size={32} color="white" aria-hidden="true" />
        </button>
      </div>

      {/* Inline confirmation — replaces native browser confirm() for accessibility */}
      {showConfirm && (
        <div
          className="sos-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-confirm-title"
          aria-describedby="sos-confirm-desc"
        >
          <p id="sos-confirm-title" className="sos-confirm-title">
            ⚠️ Confirm Emergency Alert
          </p>
          <p id="sos-confirm-desc" className="sos-confirm-desc">
            This will immediately alert venue security and relay your location.
          </p>
          <div className="sos-confirm-actions">
            <button
              onClick={handleCancel}
              className="auth-button sos-cancel-btn"
              autoFocus
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="auth-button sos-confirm-btn"
            >
              Yes, Send SOS
            </button>
          </div>
        </div>
      )}

      {/* aria-live assertive ensures this is read immediately */}
      <div aria-live="assertive">
        {active && (
          <div
            role="alert"
            className="sos-alert-msg"
          >
            ⚠️ ALERT SENT. SECURITY DISPATCHED.
          </div>
        )}
      </div>
    </section>
  );
});

EmergencySOS.displayName = 'EmergencySOS';

export default EmergencySOS;
