'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './FountainMap.module.css';

const STATUS_COLORS = {
  working: '#4a9b5a',
  issue: '#c9a227',
  broken: '#c45454',
  unknown: '#4aa8cc',
};

const STATUS_LABELS = {
  working: 'Working',
  issue: 'Reported issue',
  broken: 'Broken',
  unknown: 'Not yet verified',
};

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default function FountainMap({ fountains = [], center = [39.8, -98.5], zoom = 4, onFountainClick, onMapClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (mapRef.current._leaflet_id) return;

      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Click on map to drop a pin (for reporting)
      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      mapInstanceRef.current = map;
      setLoaded(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when fountains change
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded) return;
    const L = require('leaflet');

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
    }

    const markers = L.layerGroup();

    fountains.forEach((f) => {
      const color = STATUS_COLORS[f.status] || STATUS_COLORS.unknown;

      const icon = L.divIcon({
        className: styles.markerIcon,
        html: `<div style="
          width: 14px; height: 14px;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([f.latitude, f.longitude], { icon });

      // Popup content
      const popup = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5; min-width: 180px;">
          <div style="font-weight: 600; margin-bottom: 4px;">Water fountain</div>
          <div style="color: #5e5d5a; margin-bottom: 6px;">
          ${escapeHtml(f.type === 'bottle_filler' ? 'Bottle filler' : f.type === 'tap' ? 'Water tap' : 'Drinking fountain')}
          </div>
          <div style="
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500;
            background: ${color}18; color: ${color};
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
            ${STATUS_LABELS[f.status] || 'Unknown'}
          </div>
          ${f.report_count > 0 ? `<div style="margin-top: 6px; color: #7c7b77; font-size: 12px;">${f.report_count} report${f.report_count > 1 ? 's' : ''}</div>` : ''}
          <div style="margin-top: 8px;">
            <a href="/fountain/${f.id}" style="color: #1d7198; font-size: 12px; font-weight: 500;">View details</a>
            <span style="margin: 0 6px; color: #d4d3cf;">|</span>
            <a href="/report?lat=${f.latitude}&lng=${f.longitude}&fountain_id=${f.id}" style="color: #1d7198; font-size: 12px; font-weight: 500;">Report problem</a>
          </div>
        </div>
      `;
      marker.bindPopup(popup);

      if (onFountainClick) {
        marker.on('click', () => onFountainClick(f));
      }

      markers.addLayer(marker);
    });

    markers.addTo(mapInstanceRef.current);
    markersRef.current = markers;
  }, [fountains, loaded]);

  // Expose map methods
  useEffect(() => {
    if (mapInstanceRef.current && loaded) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [loaded]);

  return (
    <div className={styles.mapWrap}>
      <div ref={mapRef} className={styles.map} />
      {!loaded && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading map...</span>
        </div>
      )}
      <div className={styles.legend}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLORS[key] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
