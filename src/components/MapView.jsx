import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapView({ path = [], crawls = [], center = null }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pathLineRef = useRef(null);
  const markersRef = useRef([]);

  // Initial Map Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use default Daufuskie Island center if none provided
    const initialCenter = center || (path.length > 0 ? path[path.length - 1] : { lat: 32.1220, lng: -80.8650 });
    const initialZoom = 15;

    // Destroy existing map instance to prevent duplicate bindings
    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([initialCenter.lat, initialCenter.lng], initialZoom);

    // Add a dark modern map tile layer (e.g. CartoDB Dark Matter fits our theme perfectly!)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline when Path updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old path line
    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
    }

    if (path.length < 2) return;

    const latLngs = path.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(latLngs, {
      color: '#64ffda',
      weight: 3,
      opacity: 0.8,
      dashArray: '5, 5'
    }).addTo(map);

    pathLineRef.current = polyline;

    // Optionally fit bounds if path is updating
    if (path.length === 2) {
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }
  }, [path]);

  // Update Markers when Crawls update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (!crawls || crawls.length === 0) return;

    crawls.forEach((crawl, idx) => {
      if (!crawl.coordinates) return;

      const { lat, lng } = crawl.coordinates;
      const isNest = crawl.type === 'nest';
      const isPossibleNest = crawl.isPossibleNest;

      let markerClass = 'turtle-marker marker-false';
      let symbol = '✗'; // false crawl

      if (isNest) {
        markerClass = 'turtle-marker marker-nest';
        symbol = '🐢'; // Nest
      } else if (isPossibleNest) {
        markerClass = 'turtle-marker marker-possible';
        symbol = '?'; // Possible nest
      }

      // Create a custom styled DIV icon
      const customIcon = L.divIcon({
        className: markerClass,
        html: `<div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${symbol}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const popupContent = `
        <div style="color: #0a192f; font-family: sans-serif; font-size: 12px; width: 150px;">
          <h4 style="margin: 0 0 6px 0; color: #111;">Crawl #${idx + 1}</h4>
          <strong>Type:</strong> ${isNest ? 'Nest' : (isPossibleNest ? 'Possible Nest' : 'False Crawl')}<br/>
          <strong>Tideline:</strong> ${crawl.tidelineRelation || 'N/A'}<br/>
          ${isNest && crawl.dnaVialNumber ? `<strong>DNA Vial:</strong> #${crawl.dnaVialNumber}` : ''}
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Zoom out slightly to include all markers if multiple exist
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [crawls]);

  // Recenter map if external center updates
  useEffect(() => {
    const map = mapRef.current;
    if (map && center) {
      map.setView([center.lat, center.lng], 16);
    }
  }, [center]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '220px' }}></div>
      <div 
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(10, 25, 47, 0.85)',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '0.65rem',
          color: '#8892b0',
          border: '1px solid rgba(48, 60, 85, 0.6)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        Daufuskie Shoreline Map Overlay
      </div>
    </div>
  );
}
