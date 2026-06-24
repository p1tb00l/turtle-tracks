import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Search, ArrowLeft, Navigation, Map, AlertTriangle } from 'lucide-react';

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

// Extracts numerical crawl/nest count value from waypoint name for strict numeric sorting
const extractWaypointNumber = (name) => {
  const match = name.match(/(?:Nest|Crawl)\s+(\d+)/i);
  if (match) return parseInt(match[1], 10);
  const genericMatch = name.match(/\d+/);
  return genericMatch ? parseInt(genericMatch[0], 10) : 0;
};

export default function GPXDatabase({ userLocation }) {
  const [waypoints, setWaypoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(() => {
    const saved = localStorage.getItem('turtletracks_gps_filter');
    if (saved) {
      localStorage.removeItem('turtletracks_gps_filter');
      return saved;
    }
    return 'all';
  });
  const [sortBy, setSortBy] = useState('number-desc'); // 'number-desc', 'number-asc', 'distance'
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('turtletracks_map_style') || 'satellite';
  });
  const tileLayerRef = useRef(null);

  const handleStyleChange = (style) => {
    setMapStyle(style);
    localStorage.setItem('turtletracks_map_style', style);
  };

  // Reset sortBy back to default if GPS is lost
  useEffect(() => {
    if (!userLocation && sortBy === 'distance') {
      setSortBy('number-desc');
    }
  }, [userLocation, sortBy]);

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

  // Filter based on category and search query
  const filteredWaypoints = React.useMemo(() => {
    return waypoints.filter(wp => {
      // 1. Filter by category
      if (activeFilter === 'nests') {
        if (wp.subtype !== 'in_situ' && wp.subtype !== 'relocated_final' && wp.subtype !== 'relocated_original') {
          return false;
        }
      } else if (activeFilter === 'crawls') {
        if (wp.subtype !== 'false_crawl') return false;
      } else if (activeFilter === 'possible') {
        if (wp.subtype !== 'possible_nest') return false;
      }

      // 2. Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = wp.name.toLowerCase().includes(query);
        const matchesDesc = wp.desc.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [waypoints, activeFilter, searchQuery]);

  // Compute distances and sort waypoints based on selected criteria
  const processedWaypoints = React.useMemo(() => {
    const list = filteredWaypoints.map(wp => {
      let distanceMeters = null;
      let formattedDistance = '';
      if (userLocation) {
        distanceMeters = calculateDistance(userLocation, { lat: wp.lat, lng: wp.lng });
        formattedDistance = formatDistance(distanceMeters);
      }
      return {
        ...wp,
        distanceMeters,
        formattedDistance
      };
    });

    // Apply sorting
    if (sortBy === 'distance' && userLocation) {
      return [...list].sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else if (sortBy === 'number-asc') {
      return [...list].sort((a, b) => extractWaypointNumber(a.name) - extractWaypointNumber(b.name));
    } else {
      // Default: number-desc
      return [...list].sort((a, b) => extractWaypointNumber(b.name) - extractWaypointNumber(a.name));
    }
  }, [filteredWaypoints, userLocation, sortBy]);

  // Reset map bounds fitting state when selectedWaypoint changes
  useEffect(() => {
    setHasFitBounds(false);
  }, [selectedWaypoint]);

  // Setup Leaflet map when a waypoint is selected
  useEffect(() => {
    if (!mapContainerRef.current || !selectedWaypoint) return;

    // Destroy map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      maxZoom: 18
    }).setView([selectedWaypoint.lat, selectedWaypoint.lng], 16);

    mapRef.current = map;

    // Add selected waypoint marker
    const config = SUBTYPES_CONFIG[selectedWaypoint.subtype] || SUBTYPES_CONFIG.in_situ;
    const markerIcon = L.divIcon({
      className: `database-marker subtype-${selectedWaypoint.subtype}`,
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
        <h4 style="margin: 0 0 4px 0; color: #111; font-weight: bold; font-size: 13px;">${selectedWaypoint.name}</h4>
        <strong style="color: ${config.color}; display: block; margin-bottom: 4px; font-size: 11px;">${config.label}</strong>
        ${selectedWaypoint.desc ? `<div style="margin-top: 4px; color: #555;">${selectedWaypoint.desc}</div>` : ''}
      </div>
    `;

    const wpMarker = L.marker([selectedWaypoint.lat, selectedWaypoint.lng], { icon: markerIcon })
      .bindPopup(popupContent)
      .addTo(map);

    wpMarker.openPopup();

    // If no user location is available initially, center on waypoint
    if (!userLocation) {
      map.setView([selectedWaypoint.lat, selectedWaypoint.lng], 16);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      userMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, [selectedWaypoint]);

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
      maxZoom: 18,
      attribution: attribution
    }).addTo(map);
  }, [mapStyle, selectedWaypoint]);

  // Setup user location marker and polyline line updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedWaypoint) return;

    const config = SUBTYPES_CONFIG[selectedWaypoint.subtype] || SUBTYPES_CONFIG.in_situ;

    if (userLocation) {
      // 1. Update or create user marker
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

      // 2. Update or create connecting line
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([
          [userLocation.lat, userLocation.lng],
          [selectedWaypoint.lat, selectedWaypoint.lng]
        ]);
      } else {
        polylineRef.current = L.polyline(
          [[userLocation.lat, userLocation.lng], [selectedWaypoint.lat, selectedWaypoint.lng]],
          { color: config.color, weight: 3, dashArray: '5, 5', opacity: 0.8 }
        ).addTo(map);
      }

      // 3. Fit bounds to show both user location and waypoint exactly once per selection
      if (!hasFitBounds) {
        map.fitBounds([
          [userLocation.lat, userLocation.lng],
          [selectedWaypoint.lat, selectedWaypoint.lng]
        ], { padding: [50, 50] });
        setHasFitBounds(true);
      }
    } else {
      // Clean up layers if userLocation is null
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    }
  }, [userLocation, selectedWaypoint, hasFitBounds]);

  // Compute dynamic distance text for the selected waypoint card
  const selectedDistanceText = React.useMemo(() => {
    if (!selectedWaypoint || !userLocation) return '';
    const meters = calculateDistance(userLocation, { lat: selectedWaypoint.lat, lng: selectedWaypoint.lng });
    return formatDistance(meters);
  }, [selectedWaypoint, userLocation]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#8892b0', fontStyle: 'italic', fontSize: '0.85rem' }}>
        Loading database...
      </div>
    );
  }

  if (fetchError) {
    return (
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
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%' }}>
      {selectedWaypoint ? (
        // Map / Detail view for selected waypoint
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSelectedWaypoint(null)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} /> Back to List
            </button>
            <h3 style={{ fontSize: '0.95rem', color: '#e6f1ff', fontWeight: '600', margin: 0 }}>
              Mapping: {selectedWaypoint.name}
            </h3>
          </div>

          <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', position: 'relative', height: '300px', minHeight: '300px' }}>
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
              Relative Location View
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

          {/* Details card below the map */}
          {(() => {
            const config = SUBTYPES_CONFIG[selectedWaypoint.subtype] || SUBTYPES_CONFIG.in_situ;
            return (
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    border: `1.5px solid ${config.color}`,
                    flexShrink: 0
                  }}>
                    {config.symbol}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '1rem', color: '#e6f1ff', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {selectedWaypoint.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: config.color, fontWeight: '600', textTransform: 'uppercase' }}>
                      {config.label}
                    </span>
                  </div>
                  {selectedDistanceText && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <strong style={{ fontSize: '1.05rem', color: '#64ffda', fontFamily: 'monospace' }}>
                        {selectedDistanceText}
                      </strong>
                      <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>
                        Away
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(48, 60, 85, 0.3)', paddingTop: '10px', fontSize: '0.75rem', color: '#8892b0' }}>
                  <div>
                    <strong>Latitude:</strong> <span style={{ fontFamily: 'monospace', color: '#e6f1ff' }}>{selectedWaypoint.lat.toFixed(6)}°</span>
                  </div>
                  <div>
                    <strong>Longitude:</strong> <span style={{ fontFamily: 'monospace', color: '#e6f1ff' }}>{selectedWaypoint.lng.toFixed(6)}°</span>
                  </div>
                  <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                    <strong>Recorded At:</strong> <span style={{ color: '#e6f1ff' }}>{new Date(selectedWaypoint.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {selectedWaypoint.desc && (
                  <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.3)', paddingTop: '10px', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#8892b0', display: 'block', marginBottom: '2px' }}>Field Notes:</strong>
                    <p style={{ color: '#e6f1ff', margin: 0, fontStyle: 'italic', lineBreak: 'anywhere' }}>
                      {selectedWaypoint.desc}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        // List search & filters view
        <>
          {/* Search Input Bar */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#8892b0', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by name or field notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '36px',
                height: '42px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'nests', label: 'Confirmed Nests' },
              { id: 'crawls', label: 'False Crawls' },
              { id: 'possible', label: 'Possible Nests' }
            ].map(chip => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(chip.id)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: `1px solid ${isActive ? '#64ffda' : 'rgba(48, 60, 85, 0.6)'}`,
                    backgroundColor: isActive ? 'rgba(100, 255, 218, 0.1)' : 'rgba(2, 12, 27, 0.4)',
                    color: isActive ? '#64ffda' : '#8892b0',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Items count and sort controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#8892b0' }}>
            <span>Showing {processedWaypoints.length} entries</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(2, 12, 27, 0.7)',
                  color: '#e6f1ff',
                  border: '1px solid rgba(48, 60, 85, 0.6)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  height: '26px'
                }}
              >
                <option value="number-desc">Sort: # High-Low</option>
                <option value="number-asc">Sort: # Low-High</option>
                <option value="distance" disabled={!userLocation}>
                  Sort: Distance {!userLocation ? '(No GPS)' : ''}
                </option>
              </select>
            </div>
          </div>

          {/* Waypoints scroll list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {processedWaypoints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                No database entries match your search/filter.
              </div>
            ) : (
              processedWaypoints.map(wp => {
                const config = SUBTYPES_CONFIG[wp.subtype] || SUBTYPES_CONFIG.in_situ;
                return (
                  <div
                    key={wp.id}
                    className="glass-card"
                    onClick={() => setSelectedWaypoint(wp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: `4px solid ${config.color}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                      padding: '12px 14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
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
                        <span style={{ fontSize: '0.85rem', color: '#e6f1ff', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {wp.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#8892b0', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', marginTop: '1px' }}>
                          {config.label} {wp.desc ? `• ${wp.desc}` : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                      {wp.formattedDistance ? (
                        <>
                          <strong style={{ color: config.color, fontSize: '0.9rem', display: 'block', fontFamily: 'monospace' }}>
                            {wp.formattedDistance}
                          </strong>
                          <span style={{ fontSize: '0.6rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                            <Navigation size={8} style={{ transform: 'rotate(45deg)' }} /> Map
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#8892b0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Map size={12} /> View Map
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
