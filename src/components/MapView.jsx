import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapView({ path = [], crawls = [], center = null }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pathLineRef = useRef(null);
  const markersRef = useRef([]);
  const tileLayerRef = useRef(null);
  const communityLayersRef = useRef([]);

  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('turtletracks_map_style') || 'satellite';
  });

  const [mapReady, setMapReady] = useState(false);
  const [showCommunities, setShowCommunities] = useState(() => {
    return localStorage.getItem('turtletracks_show_communities') === 'true';
  });

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

    // Initial tile layer setup based on current mapStyle state
    const currentStyle = localStorage.getItem('turtletracks_map_style') || 'satellite';
    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    if (currentStyle === 'voyager') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } else if (currentStyle === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      attribution: attribution
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Manage active map tile layer style dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    if (mapStyle === 'voyager') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } else if (mapStyle === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      attribution: attribution
    }).addTo(map);
  }, [mapStyle, mapReady]);

  // Update Route Polyline when Path updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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
  }, [path, mapReady]);

  // Update Markers when Crawls update
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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
  }, [crawls, mapReady]);

  // Recenter map if external center updates
  useEffect(() => {
    const map = mapRef.current;
    if (map && center && mapReady) {
      map.setView([center.lat, center.lng], 16);
    }
  }, [center, mapReady]);

  // Manage Daufuskie Island communities overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear existing community layers
    communityLayersRef.current.forEach(layer => map.removeLayer(layer));
    communityLayersRef.current = [];

    if (!showCommunities) return;

    const COMMUNITIES = [
      {
        name: 'Haig Point',
        color: '#64ffda',
        coordinates: [
          [32.121547, -80.8567697],
          [32.1240999, -80.8606868],
          [32.1297295, -80.85346],
          [32.1368864, -80.8483746],
          [32.1440135, -80.856527],
          [32.1481908, -80.8482041],
          [32.1498064, -80.8369452],
          [32.1448126, -80.8329344],
          [32.1378207, -80.8305752],
          [32.1248802, -80.8386763],
          [32.1200416, -80.8423898],
          [32.1173198, -80.8476031],
          [32.1215537, -80.8567443]
        ]
      },
      {
        name: 'Melrose',
        color: '#00b4d8',
        coordinates: [
          [32.121547, -80.8567697],
          [32.1143493, -80.8684104],
          [32.1121112, -80.867482],
          [32.1007899, -80.8563098],
          [32.1067946, -80.8468176],
          [32.11611, -80.8394618],
          [32.1248802, -80.8386763],
          [32.1200416, -80.8423898],
          [32.1173198, -80.8476031],
          [32.1215537, -80.8567443]
        ]
      },
      {
        name: 'Oak Ridge',
        color: '#ff7a59',
        coordinates: [
          [32.0982819, -80.8737836],
          [32.1015763, -80.8803766],
          [32.1121112, -80.867482],
          [32.1007899, -80.8563098],
          [32.0927859, -80.8619271],
          [32.0982819, -80.8737836]
        ]
      },
      {
        name: 'Bloody Point',
        color: '#ff477e',
        coordinates: [
          [32.0982819, -80.8737836],
          [32.0987241, -80.8828811],
          [32.0876686, -80.8889212],
          [32.0896903, -80.8839997],
          [32.0900694, -80.8804949],
          [32.0869737, -80.8787798],
          [32.0824879, -80.8779595],
          [32.0805292, -80.8772138],
          [32.0804029, -80.8716957],
          [32.082172, -80.8681164],
          [32.0927859, -80.8619271],
          [32.0982819, -80.8737836]
        ]
      }
    ];

    COMMUNITIES.forEach(comm => {
      const polygon = L.polygon(comm.coordinates, {
        color: comm.color,
        fillColor: comm.color,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);

      polygon.bindTooltip(comm.name, {
        permanent: true,
        direction: 'center',
        className: 'community-label'
      }).openTooltip();

      polygon.on('mouseover', () => {
        polygon.setStyle({
          fillOpacity: 0.35,
          weight: 2.5
        });
      });
      polygon.on('mouseout', () => {
        polygon.setStyle({
          fillOpacity: 0.15,
          weight: 1.5
        });
      });

      communityLayersRef.current.push(polygon);
    });

    return () => {
      communityLayersRef.current.forEach(layer => map.removeLayer(layer));
      communityLayersRef.current = [];
    };
  }, [showCommunities, mapStyle, mapReady]);

  const handleStyleChange = (style) => {
    setMapStyle(style);
    localStorage.setItem('turtletracks_map_style', style);
  };

  const handleToggleCommunities = () => {
    const nextVal = !showCommunities;
    setShowCommunities(nextVal);
    localStorage.setItem('turtletracks_show_communities', String(nextVal));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '220px' }}></div>
      
      {/* Map style switcher */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          backgroundColor: 'rgba(10, 25, 47, 0.85)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(48, 60, 85, 0.6)',
          zIndex: 1000
        }}
      >
        {[
          { id: 'satellite', label: 'Sat' },
          { id: 'voyager', label: 'Map' },
          { id: 'dark', label: 'Dark' }
        ].map(style => (
          <button
            key={style.id}
            onClick={() => handleStyleChange(style.id)}
            style={{
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: mapStyle === style.id ? '#64ffda' : 'transparent',
              color: mapStyle === style.id ? '#020c1b' : '#8892b0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Communities Overlay Toggle */}
      <div 
        style={{
          position: 'absolute',
          top: '48px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(10, 25, 47, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1.5px solid rgba(100, 255, 218, 0.2)',
          zIndex: 1000,
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.2s ease'
        }}
        onClick={handleToggleCommunities}
      >
        <input 
          type="checkbox"
          checked={showCommunities}
          onChange={() => {}}
          style={{ 
            cursor: 'pointer',
            accentColor: '#64ffda',
            margin: 0,
            width: '13px',
            height: '13px'
          }}
        />
        <span 
          style={{ 
            fontSize: '0.65rem', 
            fontWeight: '700', 
            fontFamily: 'Montserrat, sans-serif',
            color: showCommunities ? '#64ffda' : '#8892b0',
            letterSpacing: '0.03em',
            textTransform: 'uppercase'
          }}
        >
          Communities
        </span>
      </div>

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
