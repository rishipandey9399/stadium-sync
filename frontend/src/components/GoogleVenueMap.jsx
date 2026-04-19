import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, HeatmapLayer } from '@react-google-maps/api';
import { subscribeToVenueStatus } from '../services/firestoreSync';
import { trackMapInteraction } from '../services/analyticsService';

/** Fixed coordinates for London Stadium (center). */
const MAP_CENTER = { lat: 51.5387, lng: -0.0166 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '400px', borderRadius: '12px' };

/**
 * Google Maps libraries to load.
 * Declared outside the component to prevent re-instantiation on every render.
 * @type {string[]}
 */
const LIBRARIES = ['visualization'];

/**
 * Static geographical mapping of known venue areas to GPS coordinates.
 * @type {Record<string, {lat: number, lng: number}>}
 */
const GEO_MAPPING = {
  'north-gate': { lat: 51.5395, lng: -0.0166 },
  'south-gate': { lat: 51.5379, lng: -0.0166 },
  'east-concourse': { lat: 51.5387, lng: -0.0150 },
  'west-concourse': { lat: 51.5387, lng: -0.0182 },
  'fan-zone': { lat: 51.5400, lng: -0.0190 },
};

/**
 * Determines the CSS color for a density marker based on crowd level.
 * @param {number} density - A value from 0 (empty) to 1 (at capacity).
 * @returns {string} An RGBA color string.
 */
const getDensityColor = (density) => {
  if (density > 0.7) return 'rgba(239, 68, 68, 0.9)';
  if (density > 0.4) return 'rgba(245, 158, 11, 0.9)';
  return 'rgba(16, 185, 129, 0.9)';
};

/**
 * GoogleVenueMap Component
 *
 * Interactive satellite map of London Stadium showing real-time crowd density
 * heatmap and per-area wait time markers, powered by Google Maps JavaScript API
 * and Firestore real-time data.
 *
 * @component
 * @returns {JSX.Element}
 */
const GoogleVenueMap = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [data, setData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToVenueStatus(setData);
    return () => unsubscribe();
  }, []);

  const handleHeatmapToggle = useCallback(() => {
    setShowHeatmap((prev) => {
      trackMapInteraction(!prev);
      return !prev;
    });
  }, []);

  /**
   * Transform Firestore area data into Google Maps LatLng heatmap points.
   * Only recalculates when data or the maps SDK load state changes.
   */
  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return data.map((area) => {
      const pos = GEO_MAPPING[area.id] ?? MAP_CENTER;
      return {
        location: new window.google.maps.LatLng(pos.lat, pos.lng),
        weight: Math.max(1, area.density * 10),
      };
    });
  }, [data, isLoaded]);

  if (loadError) {
    return (
      <section className="glass-card animate-in" aria-labelledby="map-title">
        <h3 id="map-title">Interactive Control Room Map</h3>
        <p role="alert" className="map-error">
          Unable to load Google Maps. Please check your network connection.
        </p>
      </section>
    );
  }

  if (!isLoaded) {
    return (
      <section className="glass-card animate-in" aria-labelledby="map-title">
        <h3 id="map-title">Interactive Control Room Map</h3>
        <p role="status" aria-live="polite" className="map-loading">
          Loading Google Maps...
        </p>
      </section>
    );
  }

  return (
    <section
      className="glass-card animate-in"
      style={{ padding: '16px' }}
      aria-labelledby="map-section-title"
    >
      <div className="map-header">
        <h3 id="map-section-title">Interactive Control Room Map</h3>
        <button
          onClick={handleHeatmapToggle}
          className="auth-button map-toggle-btn"
          aria-pressed={showHeatmap}
          aria-label={showHeatmap ? 'Hide crowd density heatmap' : 'Show crowd density heatmap'}
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      <div className="map-container">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={MAP_CENTER}
          zoom={17}
          options={{
            disableDefaultUI: false,
            mapTypeId: 'satellite',
            tilt: 45,
            styles: [{ featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
          }}
        >
          {showHeatmap && (
            <HeatmapLayer data={heatmapData} options={{ radius: 40, opacity: 0.6 }} />
          )}

          {data.map((area) => {
            const position = GEO_MAPPING[area.id] ?? MAP_CENTER;
            return (
              <OverlayView
                key={area.id}
                position={position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  role="status"
                  aria-label={`${area.name}: ${area.waitTime} minute wait, ${Math.round(area.density * 100)}% density`}
                  className="map-marker"
                  style={{ background: getDensityColor(area.density) }}
                >
                  <div className="map-marker-name">{area.name}</div>
                  <div className="map-marker-wait">Wait: {area.waitTime}m</div>
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      </div>

      <p className="map-caption">
        * Real-time thermal crowd analysis powered by StadiumSync edge sensors & Google Maps API.
      </p>
    </section>
  );
};

export default GoogleVenueMap;
