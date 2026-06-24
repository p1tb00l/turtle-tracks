import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Map, List, Navigation, AlertTriangle } from 'lucide-react';

// Haversine distance in meters
const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2) return 0;
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const lat1 = coords1.lat * rad;
  const lat2 = coords2.lat * rad;
  const dLat = (coords2.lat - coords1.lat) * rad;
  const dLng = (coords2.lng - coords1.lng) * rad;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
};

const formatDistance = (meters) => {
  const feet = meters * 3.28084;
  if (feet < 1500) {
    return `${Math.round(feet)} ft`;
  }
  const miles = feet / 5280;
  return `${miles.toFixed(2)} mi`;
};

const SUBTYPES_CONFIG = {
  in_situ: {
    label: 'In Situ Nest',
    symbol: '🐢',
    color: '#64ffda', // Bioluminescent Seafoam
    bg: 'rgba(100, 255, 218, 0.15)'
  },
  relocated_final: {
    label: 'Relocated Nest',
    symbol: '🐢',
    color: '#a5b4fc', // Light Indigo
    bg: 'rgba(165, 180, 252, 0.15)'
  },
  relocated_original: {
    label: 'Original Nest Location',
    symbol: '➡️',
    color: '#ff7a59', // Coral
    bg: 'rgba(255, 122, 89, 0.15)'
  },
  false_crawl: {
    label: 'False Crawl',
    symbol: '👣',
    color: '#f4a261', // Sand/orange
    bg: 'rgba(244, 162, 97, 0.15)'
  },
  possible_nest: {
    label: 'Possible Nest',
    symbol: '❓',
    color: '#fde047', // Yellow
    bg: 'rgba(253, 224, 71, 0.15)'
  }
};

const parseGPX = (gpxText) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
  const wpts = xmlDoc.getElementsByTagName('wpt');
  const parsedWaypoints = [];

  for (let i = 0; i < wpts.length; i++) {
    const wpt = wpts[i];
    const lat = parseFloat(wpt.getAttribute('lat'));
    const lng = parseFloat(wpt.getAttribute('lon'));
    const nameEl = wpt.getElementsByTagName('name')[0];
    const descEl = wpt.getElementsByTagName('desc')[0] || wpt.getElementsByTagName('cmt')[0];
    const timeEl = wpt.getElementsByTagName('time')[0];

    const name = nameEl ? nameEl.textContent : `Waypoint ${i + 1}`;
    const desc = descEl ? descEl.textContent : '';
    const timestamp = timeEl ? timeEl.textContent : new Date().toISOString();

    let subtype = 'in_situ';
    const textToSearch = `${name} ${desc}`.toLowerCase();

    if (textToSearch.includes('false') || textToSearch.includes('u-turn')) {
      subtype = 'false_crawl';
    } else if (textToSearch.includes('possible') || textToSearch.includes('suspected')) {
      subtype = 'possible_nest';
    } else if (textToSearch.includes('original') || textToSearch.includes('orig')) {
      subtype = 'relocated_original';
    } else if (
      textToSearch.includes('final') || 
      textToSearch.includes('final site') || 
      textToSearch.includes('relocated') || 
      textToSearch.includes('reloc')
    ) {
      subtype = 'relocated_final';
    }

    parsedWaypoints.push({
      id: `gpx-${i}-${Date.now()}`,
      name,
      desc,
      lat,
      lng,
      timestamp,
      subtype
    });
  }

  return parsedWaypoints;
};

export default function NearbyRadar({ userLocation }) {
  const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [waypoints, setWaypoints] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [hasFitBounds, setHasFitBounds] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const currentWaypointIdsRef = useRef('');
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('turtletracks_map_style') || 'satellite';
  });
  const tileLayerRef = useRef(null);

  const handleStyleChange = (style) => {
    setMapStyle(style);
    localStorage.setItem('turtletracks_map_style', style);
  };

  // Load waypoints from static gpx asset on mount
  useEffect(() => {
    fetch(`/nests.gpx?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load nests database asset (${res.status} ${res.statusText})`);
        }
        return res.text();
      })
      .then(gpxText => {
        const parsed = parseGPX(gpxText);
        setWaypoints(parsed);
        setFetchError(null);
      })
      .catch(err => {
        console.error(err);
        setFetchError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Compute distances, sort, and slice to closest 6
  const processedWaypoints = React.useMemo(() => {
    if (!userLocation || waypoints.length === 0) return [];
    return waypoints
      .map(wp => {
        const distanceMeters = calculateDistance(userLocation, { lat: wp.lat, lng: wp.lng });
        return {
          ...wp,
          distanceMeters,
          formattedDistance: formatDistance(distanceMeters)
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 6);
  }, [waypoints, userLocation]);

  // Leaflet map setup (only center when initial mount/switch occurs)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (viewMode !== 'map') return;

    const initialCenter = userLocation || { lat: 32.1220, lng: -80.8650 };
    
    // Destroy map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      maxZoom: 18
    }).setView([initialCenter.lat, initialCenter.lng], 16);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

  // Manage active map tile layer style dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || viewMode !== 'map') return;

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
      maxZoom: 18,
      attribution: attribution
    }).addTo(map);
  }, [mapStyle, viewMode]);

  // Reset map bounds fitting state when viewMode changes
  useEffect(() => {
    if (viewMode === 'map') {
      setHasFitBounds(false);
      currentWaypointIdsRef.current = '';
    }
  }, [viewMode]);

  // Render markers when waypoints/location updates on Map View
  useEffect(() => {
    const map = mapRef.current;
    if (!map || viewMode !== 'map') return;

    // Check if the 6 closest waypoints have changed
    const waypointIdsString = processedWaypoints.map(wp => wp.id).join(',');
    const waypointsChanged = currentWaypointIdsRef.current !== waypointIdsString;

    // Update or create user marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
            width: 14px; 
            height: 14px; 
            background-color: #3b82f6; 
            border: 2px solid #fff; 
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
            animation: pulse 1.5s infinite;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .bindPopup('Your Current GPS Position')
          .addTo(map);
      }
    }

    // Only recreate waypoint markers if the waypoint list itself has changed
    if (waypointsChanged) {
      // Clear old markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      // Add waypoint markers
      processedWaypoints.forEach((wp) => {
        const config = SUBTYPES_CONFIG[wp.subtype] || SUBTYPES_CONFIG.in_situ;
        const markerIcon = L.divIcon({
          className: `radar-marker subtype-${wp.subtype}`,
          html: `<div style="
            width: 32px; 
            height: 32px; 
            background-color: ${config.bg}; 
            border: 2px solid ${config.color}; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          ">${config.symbol}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const popupContent = `
          <div style="color: #0a192f; font-family: sans-serif; font-size: 12px; width: 180px; line-height: 1.4;">
            <h4 style="margin: 0 0 4px 0; color: #111; font-weight: bold; font-size: 13px;">${wp.name}</h4>
            <strong style="color: ${config.color}; display: block; margin-bottom: 4px; font-size: 11px;">${config.label}</strong>
            ${wp.desc ? `<div style="margin-top: 4px; color: #555;">${wp.desc}</div>` : ''}
            <div style="margin-top: 6px; border-top: 1px solid #ddd; padding-top: 4px; font-weight: bold;">
              Distance: ${wp.formattedDistance}
            </div>
          </div>
        `;

        const marker = L.marker([wp.lat, wp.lng], { icon: markerIcon })
          .bindPopup(popupContent)
          .addTo(map);

        markersRef.current.push(marker);
      });

      currentWaypointIdsRef.current = waypointIdsString;
    }

    // Fit bounds to fit user and waypoints exactly once
    if (processedWaypoints.length > 0 && userLocation && !hasFitBounds) {
      const boundsPoints = [
        [userLocation.lat, userLocation.lng],
        ...processedWaypoints.map(wp => [wp.lat, wp.lng])
      ];
      map.fitBounds(boundsPoints, { padding: [40, 40] });
      setHasFitBounds(true);
    }
  }, [processedWaypoints, userLocation, viewMode, hasFitBounds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%' }}>
      
      {/* Map/List Toggles */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => setViewMode('list')}
          className="btn"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '0.78rem',
            borderRadius: '8px',
            border: `1px solid ${viewMode === 'list' ? '#64ffda' : 'var(--panel-border)'}`,
            backgroundColor: viewMode === 'list' ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
            color: viewMode === 'list' ? '#64ffda' : '#8892b0',
            cursor: 'pointer'
          }}
        >
          <List size={14} /> Nearby List
        </button>
        <button 
          onClick={() => setViewMode('map')}
          className="btn"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '0.78rem',
            borderRadius: '8px',
            border: `1px solid ${viewMode === 'map' ? '#64ffda' : 'var(--panel-border)'}`,
            backgroundColor: viewMode === 'map' ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
            color: viewMode === 'map' ? '#64ffda' : '#8892b0',
            cursor: 'pointer'
          }}
        >
          <Map size={14} /> Nearby Map
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#8892b0', fontStyle: 'italic', fontSize: '0.85rem' }}>
          Loading nests database...
        </div>
      )}

      {fetchError && (
        <div style={{
          backgroundColor: 'rgba(255, 122, 89, 0.1)',
          border: '1px solid #ff7a59',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle className="text-[#ff7a59]" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem' }}>
            <strong style={{ color: '#e6f1ff', display: 'block', marginBottom: '4px' }}>GPX Database Asset Error</strong>
            {fetchError}. Verify that nests.gpx is loaded correctly in public directory.
          </div>
        </div>
      )}

      {!loading && !fetchError && !userLocation && (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#8892b0', fontStyle: 'italic', fontSize: '0.9rem' }}>
          Acquiring active GPS location to search for nearby nests.{isLocal ? ' Enable Simulator Mode if testing indoors.' : ''}
        </div>
      )}

      {!loading && !fetchError && userLocation && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          {viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', color: '#8892b0', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>6 Closest Nests & Crawls</span>
                <span>Active Location: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span>
              </div>
              
              {processedWaypoints.map((wp) => {
                const config = SUBTYPES_CONFIG[wp.subtype] || SUBTYPES_CONFIG.in_situ;
                return (
                  <div 
                    key={wp.id} 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      borderLeft: `4px solid ${config.color}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: config.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        border: `1.5px solid ${config.color}`,
                        flexShrink: 0
                      }}>
                        {config.symbol}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.9rem', color: '#e6f1ff', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {wp.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#8892b0', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {config.label}{wp.desc ? ` • ${wp.desc}` : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                      <strong style={{ color: config.color, fontSize: '0.95rem', display: 'block', fontFamily: 'monospace' }}>
                        {wp.formattedDistance}
                      </strong>
                      <span style={{ fontSize: '0.65rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                        <Navigation size={8} style={{ transform: 'rotate(45deg)' }} /> Radar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', position: 'relative', height: '100%', minHeight: '340px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute' }}></div>
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
                Sea Turtle Proximity Radar
              </div>

              {/* Map Style Controls overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  display: 'flex',
                  gap: '4px',
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
