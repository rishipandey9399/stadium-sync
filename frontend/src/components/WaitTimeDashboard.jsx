import React, { useState, useEffect } from 'react';
import { subscribeToVenueStatus } from '../services/firestoreSync';
import { Clock, MapPin, Navigation, Coffee } from 'lucide-react';

const WaitTimeDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The component subscribes once on mount and rerenders automatically
    // when Firestore pushes new data.
    const unsubscribe = subscribeToVenueStatus((newData) => {
      setData(newData);
      setLoading(false);
    });

    // Cleanup subscription on unmount
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
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--primary)" /> Wait Times
        </h3>
        <p style={{ marginTop: '16px', opacity: 0.7 }}>Loading live data from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="glass-card animate-in" style={{ animationDelay: '0.1s' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={20} color="var(--primary)" /> Live Wait Times
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
        {data.sort((a, b) => a.waitTime - b.waitTime).map(area => (
          <div key={area.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                {area.type === 'food' ? <Coffee size={16} /> : <MapPin size={16} />}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{area.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{area.type === 'food' ? 'Concessions' : 'Entrance'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={`status-badge ${getStatusClass(area.waitTime)}`}>
                {area.waitTime} MIN
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="auth-button"
        style={{ marginTop: '20px' }}
        onClick={() => alert('Finding fastest route...')}
      >
        <Navigation size={18} /> Route to Shortest
      </button>
    </div>
  );
};

export default WaitTimeDashboard;
