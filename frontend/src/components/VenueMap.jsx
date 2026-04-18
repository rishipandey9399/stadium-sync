import React, { useState, useEffect } from 'react';
import { getLiveWaitTimes } from '../services/crowdSimulation';

const VenueMap = () => {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    const times = await getLiveWaitTimes();
    setData(times);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDensityColor = (density) => {
    if (density > 0.7) return 'var(--danger)';
    if (density > 0.4) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="glass-card animate-in">
      <h3>Live Venue Map</h3>
      <div style={{ position: 'relative', marginTop: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Stadium Bowl */}
          <path 
            d="M 200,50 A 150,100 0 1,0 200,250 A 150,100 0 1,0 200,50 Z" 
            fill="none" 
            stroke="var(--glass-border)" 
            strokeWidth="20"
          />
          {/* Pitch */}
          <rect x="125" y="110" width="150" height="80" rx="4" fill="var(--success)" opacity="0.1" />
          
          {/* Interactive Zones */}
          {data.map((area, index) => {
            const angle = (index / data.length) * Math.PI * 2;
            const x = 200 + Math.cos(angle) * 120;
            const y = 150 + Math.sin(angle) * 80;
            
            return (
              <g key={area.id} style={{ cursor: 'pointer' }}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="8" 
                  fill={getDensityColor(area.density)} 
                  style={{ filter: 'blur(4px)', transition: 'fill 0.5s ease' }} 
                />
                <circle 
                  cx={x} 
                  cy={y} 
                  r="4" 
                  fill={getDensityColor(area.density)} 
                />
                <text 
                  x={x} 
                  y={y + 20} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="10" 
                  fontWeight="600"
                >
                  {area.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
            <span>Smooth</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></div>
            <span>Steady</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }}></div>
            <span>Heavy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
