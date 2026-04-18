import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { subscribeToVenueStatus } from '../services/firestoreSync';

// Coordinates for London Stadium (center)
const center = { lat: 51.5387, lng: -0.0166 };
const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '12px' };

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
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Will show Developer Mode without key
  });

  const [data, setData] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToVenueStatus(setData);
    return () => unsubscribe();
  }, []);

  const onLoad = useCallback(function callback(map) {
    // Restrict bounds loosely around the stadium
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    map.setZoom(17);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const getDensityColor = (density) => {
    if (density > 0.7) return 'rgba(239, 68, 68, 0.8)'; // Danger
    if (density > 0.4) return 'rgba(245, 158, 11, 0.8)'; // Warning
    return 'rgba(16, 185, 129, 0.8)'; // Success
  };

  if (!isLoaded) return <div className="glass-card animate-in">Loading Map...</div>;

  return (
    <div className="glass-card animate-in" style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>Interactive Venue Map</h3>
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            mapTypeId: 'satellite', // Premium look
            tilt: 45 // 3D effect
          }}
        >
          {/* Custom Heatmap/Density Overlay Markers */}
          {data.map(area => {
            const position = GEO_MAPPING[area.id] || center;
            return (
              <OverlayView
                key={area.id}
                position={position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  background: getDensityColor(area.density),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(4px)'
                }}>
                  {area.name} <br/> {area.waitTime}m Wait
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
};

export default GoogleVenueMap;
