import React, { useState, useEffect } from 'react';
import { Square, Plus, Map, List, Clock, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getIslandLocation } from '../utils/geocoding';
import CrawlWizard from './CrawlWizard';
import MapView from './MapView';
import SeaTurtle from './SeaTurtle';

// Helper to convert meters to miles
const metersToMiles = (m) => (m * 0.000621371).toFixed(2);

// Timer formatter
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Date formatter for sequential log IDs (YYYYMMDD)
const getLocalDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

export default function ActiveSession({ activeSession, setActiveSession, onSessionComplete, sessions = [], onNavigate }) {
  const [seconds, setSeconds] = useState(0);

  const handleCounterClick = (filterType) => {
    localStorage.setItem('turtletracks_gps_subtab', 'database');
    localStorage.setItem('turtletracks_gps_filter', filterType);
    if (onNavigate) {
      onNavigate('gps');
    }
  };
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  
  // Geolocation tracking hook
  const isTracking = !!activeSession;
  const { 
    location, 
    path, 
    distance, 
    isSimulated, 
    startSimulator, 
    stopSimulator,
    setPath,
    setDistance,
    setLocation
  } = useGeolocation(isTracking);

  const [locName, setLocName] = useState('Acquiring Location...');
  const [databaseCounters, setDatabaseCounters] = useState({ maxNest: 0, maxFalseCrawl: 0, possibleCount: 0 });

  // Load waypoints from static GPX asset on mount to get database counters
  useEffect(() => {
    fetch(`/nests.gpx?t=${Date.now()}`)
      .then(res => res.ok ? res.text() : '')
      .then(gpxText => {
        if (!gpxText) return;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
        const wpts = xmlDoc.getElementsByTagName('wpt');
        
        let maxNest = 0;
        let maxFalseCrawl = 0;
        let possibleCount = 0;

        for (let i = 0; i < wpts.length; i++) {
          const wpt = wpts[i];
          const nameEl = wpt.getElementsByTagName('name')[0];
          const descEl = wpt.getElementsByTagName('desc')[0] || wpt.getElementsByTagName('cmt')[0];
          const name = nameEl ? nameEl.textContent : '';
          const desc = descEl ? descEl.textContent : '';
          const textToSearch = `${name} ${desc}`.toLowerCase();

          if (textToSearch.includes('false') || textToSearch.includes('u-turn')) {
            const match = name.match(/False\s+Crawl\s+(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxFalseCrawl) maxFalseCrawl = num;
            }
          } else if (textToSearch.includes('possible') || textToSearch.includes('suspected')) {
            possibleCount++;
          } else {
            const match = name.match(/Nest\s+(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNest) maxNest = num;
            }
          }
        }
        setDatabaseCounters({ maxNest, maxFalseCrawl, possibleCount });
      })
      .catch(err => console.error('Error loading GPX counters:', err));
  }, []);

  // Effect to resolve location name via geocoding when session starts or location is acquired
  useEffect(() => {
    if (activeSession && location) {
      getIslandLocation(location.lat, location.lng).then(setLocName);
    }
  }, [location, !!activeSession]);

  // Sync state values with activeSession details
  useEffect(() => {
    if (activeSession) {
      // Set path and distance in hook if restoring mid-session
      if (activeSession.path?.length > 0) {
        setPath(activeSession.path);
        setDistance(activeSession.distance || 0);
      }
      
      // Calculate elapsed timer seconds
      const elapsed = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
      setSeconds(elapsed > 0 ? elapsed : 0);
    } else {
      setSeconds(0);
      setLocName('Acquiring Location...');
    }
  }, [activeSession]);

  // Active Session Timer Loop
  useEffect(() => {
    let timer = null;
    if (activeSession) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession]);

  // Handle Starting a Session
  const handleStartSession = () => {
    const todayStr = getLocalDateString(new Date());
    const countForToday = sessions.filter(s => s.id && s.id.startsWith(todayStr)).length;
    const seq = String(countForToday + 1).padStart(2, '0');
    
    const newSession = {
      id: `${todayStr}-${seq}`,
      startTime: new Date().toISOString(),
      locationName: 'Daufuskie Island Beach',
      distance: 0,
      path: [],
      crawls: []
    };
    setActiveSession(newSession);
  };

  // Sync GPS updates to the activeSession parent state (so it persists reload)
  useEffect(() => {
    if (activeSession) {
      const updated = {
        ...activeSession,
        path,
        distance,
        locationName: locName !== 'Acquiring Location...' ? locName : activeSession.locationName
      };
      // Only set if changed to avoid renders
      if (JSON.stringify(updated.path) !== JSON.stringify(activeSession.path) || 
          updated.distance !== activeSession.distance ||
          updated.locationName !== activeSession.locationName) {
        setActiveSession(updated);
      }
    }
  }, [path, distance, locName]);

  // Handle Crawl Documentation
  const handleSaveCrawl = (crawlData) => {
    const updatedCrawls = [...(activeSession.crawls || []), crawlData];
    setActiveSession({
      ...activeSession,
      crawls: updatedCrawls
    });
    setShowWizard(false);
  };

  // Handle Ending a Session
  const handleEndSession = () => {
    stopSimulator();
    const finalSession = {
      ...activeSession,
      endTime: new Date().toISOString(),
      duration: seconds,
      distance: distance,
      path: path,
      locationName: locName === 'Acquiring Location...' ? 'Daufuskie Island Beach' : locName
    };
    onSessionComplete(finalSession);
    setActiveSession(null);
  };

  if (showWizard) {
    return (
      <CrawlWizard 
        activeCoords={location} 
        onSaveCrawl={handleSaveCrawl}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: '20px' }}>
      
      {/* 1. SESSION NOT STARTED STATE */}
      {!activeSession ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', justifyContent: 'center', padding: '40px 10px', minHeight: '100%' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'rgba(100, 255, 218, 0.05)',
            border: '2px dashed rgba(100, 255, 218, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <img 
              src="/turtle-only.png" 
              alt="TurtleTracks Turtle" 
              style={{ 
                width: '80px', 
                height: '80px', 
                objectFit: 'contain'
              }} 
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#e6f1ff', marginBottom: '8px' }}>Start Beach Session</h2>
            <p style={{ fontSize: '0.85rem', color: '#8892b0', maxWidth: '300px', margin: '0 auto' }}>
              Begin tracking your time, path, and logs along the shoreline. GPS coordinates will be captured offline.
            </p>
          </div>

          {/* Database counters based on nests.gpx */}
          {(databaseCounters.maxNest > 0 || databaseCounters.maxFalseCrawl > 0) && (
            <div className="glass-panel" style={{ padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#8892b0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                Daufuskie Island Beach Overview
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div 
                  className="overview-counter-card"
                  onClick={() => handleCounterClick('nests')}
                  style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(100, 255, 218, 0.2)', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '2px' }}>🐢</span>
                  <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Nests</span>
                  <strong style={{ fontSize: '1rem', color: '#64ffda' }}>{databaseCounters.maxNest}</strong>
                </div>
                <div 
                  className="overview-counter-card"
                  onClick={() => handleCounterClick('crawls')}
                  style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(244, 162, 97, 0.2)', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '2px' }}>👣</span>
                  <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>False Crawls</span>
                  <strong style={{ fontSize: '1rem', color: '#f4a261' }}>{databaseCounters.maxFalseCrawl}</strong>
                </div>
                <div 
                  className="overview-counter-card"
                  onClick={() => handleCounterClick('possible')}
                  style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(253, 224, 71, 0.2)', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '2px' }}>❓</span>
                  <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Possible</span>
                  <strong style={{ fontSize: '1rem', color: '#fde047' }}>{databaseCounters.possibleCount}</strong>
                </div>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            onClick={handleStartSession}
            style={{ width: '100%', maxWidth: '280px', padding: '16px', borderRadius: '12px', fontSize: '1.05rem' }}
          >
            <SeaTurtle size={20} fill="currentColor" />
            Start Logging
          </button>
        </div>
      ) : (
        
        // 2. ACTIVE SESSION RUNNING STATE
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%' }}>
          
          {/* Dash Header */}
          <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock className="text-[#64ffda]" size={20} />
              <div>
                <span style={{ fontSize: '0.65rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Active Time</span>
                <strong style={{ fontSize: '1.2rem', color: '#e6f1ff', fontFamily: 'monospace' }}>{formatTime(seconds)}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(48, 60, 85, 0.4)', paddingLeft: '15px' }}>
              <Navigation className="text-[#f4a261]" size={20} style={{ transform: 'rotate(45deg)' }} />
              <div>
                <span style={{ fontSize: '0.65rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Patrol Dist</span>
                <strong style={{ fontSize: '1.2rem', color: '#e6f1ff', fontFamily: 'monospace' }}>{metersToMiles(distance)} mi</strong>
              </div>
            </div>
          </div>

          {/* Map/List View toggles */}
          <div style={{ display: 'flex', gap: '8px' }}>
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
                color: viewMode === 'map' ? '#64ffda' : '#8892b0'
              }}
            >
              <Map size={14} /> Map View
            </button>
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
                color: viewMode === 'list' ? '#64ffda' : '#8892b0'
              }}
            >
              <List size={14} /> Logged ({activeSession.crawls?.length || 0})
            </button>
          </div>

          {/* Active View Display Panel */}
          <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
            {viewMode === 'map' ? (
              <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
                <MapView path={path} crawls={activeSession.crawls} center={location} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto' }}>
                {(!activeSession.crawls || activeSession.crawls.length === 0) ? (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#8892b0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    No crawls logged yet. Walk the beach and look for crawl tracks.
                  </p>
                ) : (
                  activeSession.crawls.map((crawl, idx) => (
                    <div key={idx} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${crawl.type === 'nest' ? '#64ffda' : '#f4a261'}` }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#e6f1ff' }}>Crawl #{idx + 1} - {crawl.type === 'nest' ? 'Confirmed Nest' : 'False Crawl'}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#8892b0', display: 'block', marginTop: '2px' }}>
                          Tideline: {crawl.tidelineRelation} &bull; {new Date(crawl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        backgroundColor: crawl.type === 'nest' ? 'rgba(100, 255, 218, 0.1)' : 'rgba(244, 162, 97, 0.1)',
                        color: crawl.type === 'nest' ? '#64ffda' : '#f4a261',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {crawl.type === 'nest' ? 'Nest' : 'False'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Log Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowWizard(true)}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1rem' }}
            >
              <Plus size={20} />
              Found a Crawl?
            </button>

            <button 
              className="btn btn-danger" 
              onClick={handleEndSession}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}
            >
              <Square size={16} fill="currentColor" />
              End Beach Session
            </button>
          </div>

          {/* Simulator indicators if active */}
          {isSimulated && (
            <div style={{
              backgroundColor: 'rgba(100, 255, 218, 0.08)',
              border: '1.5px dashed var(--color-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.7rem',
              color: 'var(--color-primary)',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              GPS WALK SIMULATOR ACTIVE: Moving southwest along Melrose Beach...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
