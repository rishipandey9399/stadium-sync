import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import GoogleVenueMap from '../components/GoogleVenueMap';
import WaitTimeDashboard from '../components/WaitTimeDashboard';
import VirtualQueue from '../components/VirtualQueue';
import EmergencySOS from '../components/EmergencySOS';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>StadiumSync</h1>
          <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>London Stadium • {currentUser?.email}</p>
        </div>
        <button 
          onClick={logout}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <GoogleVenueMap />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <WaitTimeDashboard />
          <VirtualQueue />    
        </div>
        <EmergencySOS />
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 0', fontSize: '0.8rem', opacity: 0.4 }}>
        <p>&copy; 2026 StadiumSync. Precise Location Enabled.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
