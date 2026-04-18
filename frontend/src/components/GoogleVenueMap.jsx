import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, HeatmapLayer } from '@react-google-maps/api';
import { subscribeToVenueStatus } from '../services/firestoreSync';

// Coordinates for London Stadium (center)
const center = { lat: 51.5387, lng: -0.0166 };
const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '12px' };

const libraries = ['visualization'];

// Dummy geographical mapping for the sections
const GEO_MAPPING = {
  'north-gate': { lat: 51.5395, lng: -0.0166 },
  'south-gate': { lat: 51.5379, lng: -0.0166 },
  'east-concourse': { lat: 51.5387, lng: -0.0150 },
  'west-concourse': { lat: 51.5387, lng: -0.0182 },
  'fan-zone': { lat: 51.5400, lng: -0.0190 }
};

const GoogleVenueMap = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
    libraries
  });

  const [data, setData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToVenueStatus(setData);
    return () => unsubscribe();
  }, []);

  // Transform area data into heatmap points
  const heatmapData = useMemo(() => {
    if (!window.google || !isLoaded) return [];
    return data.map(area => {
      const pos = GEO_MAPPING[area.id] || center;
      return {
        location: new window.google.maps.LatLng(pos.lat, pos.lng),
        weight: Math.max(1, area.density * 10) // Scale density for visibility
      };
    });
  }, [data, isLoaded]);

  const getDensityColor = (density) => {
    if (density > 0.7) return 'rgba(239, 68, 68, 0.9)'; // Danger
    if (density > 0.4) return 'rgba(245, 158, 11, 0.9)'; // Warning
    return 'rgba(16, 185, 129, 0.9)'; // Success
  };

  if (!isLoaded) return <div className="glass-card animate-in">Loading Premium Maps...</div>;

  return (
    <section className="glass-card animate-in" style={{ padding: '16px' }} aria-labelledby="map-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 id="map-title">Interactive Control Room Map</h3>
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="auth-button"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', marginTop: 0 }}
          aria-pressed={showHeatmap}
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>
      
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={17}
          options={{
            disableDefaultUI: false,
            mapTypeId: 'satellite',
            tilt: 45,
            styles: [
              { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
          }}
        >
          {showHeatmap && <HeatmapLayer data={heatmapData} options={{ radius: 40, opacity: 0.6 }} />}

          {/* Real-time Status Markers */}
          {data.map(area => {
            const position = GEO_MAPPING[area.id] || center;
            return (
              <OverlayView
                key={area.id}
                position={position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div 
                  role="status"
                  aria-label={`${area.name}: ${area.waitTime} minutes wait, ${Math.round(area.density * 100)}% density`}
                  style={{
                    position: 'absolute',
                    transform: 'translate(-50%, -120%)',
                    background: getDensityColor(area.density),
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    zIndex: 10
                  }}
                >
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px', marginBottom: '2px' }}>{area.name}</div>
                  <div style={{ opacity: 0.9 }}>Wait: {area.waitTime}m</div>
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      </div>
      <p style={{ marginTop: '12px', fontSize: '0.75rem', opacity: 0.6 }}>
        * Real-time thermal crowd analysis powered by StadiumSync edge sensors.
      </p>
    </section>
  );
};

export default GoogleVenueMap;
