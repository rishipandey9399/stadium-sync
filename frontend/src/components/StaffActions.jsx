import React, { useState, useCallback } from 'react';
import { triggerExportSessionLogs, triggerCapacityAlert } from '../services/cloudFunctionsService';
import { trackSOSAlert } from '../services/analyticsService';
import { CloudLightning, Download, Bell, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * @typedef {'idle' | 'loading' | 'success' | 'error'} ActionStatus
 */

/**
 * StaffActions Component
 *
 * Provides venue staff with one-tap access to critical administrative
 * Cloud Functions, including session log exports and capacity alerts.
 * Each action is backed by a Google Cloud Functions HTTPS trigger.
 *
 * @component
 * @returns {JSX.Element}
 */
const StaffActions = () => {
  const [exportStatus, setExportStatus] = useState('idle');
  const [alertStatus, setAlertStatus] = useState('idle');
  const [exportMsg, setExportMsg] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const handleExportLogs = useCallback(async () => {
    setExportStatus('loading');
    const result = await triggerExportSessionLogs();
    if (result.success) {
      setExportMsg(result.message);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 4000);
    } else {
      setExportMsg(result.error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  }, []);

  const handleCapacityAlert = useCallback(async () => {
    setAlertStatus('loading');
    const result = await triggerCapacityAlert('north-gate', 'high');
    if (result.success) {
      setAlertMsg(result.message);
      setAlertStatus('success');
      trackSOSAlert('Capacity Alert: North Gate');
      setTimeout(() => setAlertStatus('idle'), 4000);
    } else {
      setAlertMsg(result.error);
      setAlertStatus('error');
      setTimeout(() => setAlertStatus('idle'), 4000);
    }
  }, []);

  const getIcon = (status, defaultIcon) => {
    if (status === 'loading') return <span className="spinner-ring" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} />;
    if (status === 'success') return <CheckCircle size={18} aria-hidden="true" />;
    if (status === 'error') return <AlertTriangle size={18} aria-hidden="true" />;
    return defaultIcon;
  };

  return (
    <section
      className="glass-card animate-in staff-actions-card"
      style={{ animationDelay: '0.6s' }}
      aria-labelledby="staff-actions-title"
    >
      <h3 id="staff-actions-title" className="staff-actions-title">
        <CloudLightning size={20} aria-hidden="true" className="staff-actions-icon" />
        Staff Cloud Actions
      </h3>
      <p className="staff-actions-subtitle">
        Trigger Google Cloud Functions for administrative venue tasks.
      </p>

      <div className="staff-actions-grid">
        {/* Export Logs Action */}
        <div className="staff-action-card">
          <div className="staff-action-info">
            <div className="staff-action-label">Export Session Logs</div>
            <div className="staff-action-desc">Streams event telemetry to Cloud Storage (NDJSON).</div>
          </div>
          <button
            className={`auth-button staff-action-btn ${exportStatus === 'success' ? 'staff-success' : ''} ${exportStatus === 'error' ? 'staff-error' : ''}`}
            onClick={handleExportLogs}
            disabled={exportStatus === 'loading'}
            aria-busy={exportStatus === 'loading'}
            aria-label="Export session logs to Google Cloud Storage"
          >
            {getIcon(exportStatus, <Download size={16} aria-hidden="true" />)}
            {exportStatus === 'idle' && 'Export Logs'}
            {exportStatus === 'loading' && 'Exporting...'}
            {exportStatus === 'success' && 'Export Queued'}
            {exportStatus === 'error' && 'Export Failed'}
          </button>
          {(exportStatus === 'success' || exportStatus === 'error') && (
            <p
              className={`staff-action-msg ${exportStatus}`}
              role="status"
              aria-live="polite"
            >
              {exportMsg}
            </p>
          )}
        </div>

        {/* Capacity Alert Action */}
        <div className="staff-action-card">
          <div className="staff-action-info">
            <div className="staff-action-label">Capacity Alert (North Gate)</div>
            <div className="staff-action-desc">Notifies all staff via Firebase Cloud Messaging.</div>
          </div>
          <button
            className={`auth-button staff-action-btn staff-alert-btn ${alertStatus === 'success' ? 'staff-success' : ''} ${alertStatus === 'error' ? 'staff-error' : ''}`}
            onClick={handleCapacityAlert}
            disabled={alertStatus === 'loading'}
            aria-busy={alertStatus === 'loading'}
            aria-label="Send high-severity capacity alert to all staff for North Gate"
          >
            {getIcon(alertStatus, <Bell size={16} aria-hidden="true" />)}
            {alertStatus === 'idle' && 'Alert Staff'}
            {alertStatus === 'loading' && 'Dispatching...'}
            {alertStatus === 'success' && 'Staff Notified'}
            {alertStatus === 'error' && 'Alert Failed'}
          </button>
          {(alertStatus === 'success' || alertStatus === 'error') && (
            <p
              className={`staff-action-msg ${alertStatus}`}
              role="status"
              aria-live="polite"
            >
              {alertMsg}
            </p>
          )}
        </div>
      </div>

      <p className="staff-actions-footer">
        Powered by <strong>Google Cloud Functions</strong> &amp; <strong>Firebase Cloud Messaging</strong>.
      </p>
    </section>
  );
};

export default StaffActions;
