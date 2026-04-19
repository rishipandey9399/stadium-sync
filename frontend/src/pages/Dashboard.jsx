import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import GoogleVenueMap from '../components/GoogleVenueMap';
import WaitTimeDashboard from '../components/WaitTimeDashboard';
import VirtualQueue from '../components/VirtualQueue';
import EmergencySOS from '../components/EmergencySOS';
import GeminiInsights from '../components/GeminiInsights';
import HistoricalTrends from '../components/HistoricalTrends';
import StaffActions from '../components/StaffActions';
import { trackPageView } from '../services/analyticsService';

/**
 * Dashboard Page
 *
 * The main authenticated view of StadiumSync. Composes all venue management
 * widgets: real-time map, wait times, virtual queue, Gemini AI insights,
 * BigQuery historical trends, Cloud Functions staff actions, and SOS.
 *
 * @component
 * @returns {JSX.Element}
 */
const Dashboard = () => {
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    trackPageView('/dashboard', 'StadiumSync Dashboard');
  }, []);

  return (
    <div className="app-container">
      {/* Accessibility: Skip Navigation Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="dashboard-header">
        <div>
          <h1 className="gradient-text dashboard-title">StadiumSync</h1>
          <p className="dashboard-subtitle">
            London Stadium &bull;{' '}
            <span aria-label={`Logged in as ${currentUser?.email}`}>
              {currentUser?.email}
            </span>
          </p>
        </div>
        <button
          onClick={logout}
          className="logout-button"
          aria-label="Log out of StadiumSync"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </header>

      <main id="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <GoogleVenueMap />

        <div className="dashboard-grid">
          <WaitTimeDashboard />
          <VirtualQueue />
        </div>

        <GeminiInsights />

        <div className="dashboard-grid">
          <HistoricalTrends />
          <StaffActions />
        </div>

        <EmergencySOS />
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2026 StadiumSync. Precise Location Enabled.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
