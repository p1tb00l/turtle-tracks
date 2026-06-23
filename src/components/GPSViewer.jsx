import { useState, useEffect, useRef } from 'react';
import { Compass, Download, ShieldAlert } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getIslandLocation } from '../utils/geocoding';
import NearbyRadar from './NearbyRadar';
import GPXDatabase from './GPXDatabase';

export default function GPSViewer() {
  const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isTracking = true;
  const { location, accuracy, error, isSimulated, startSimulator, stopSimulator } = useGeolocation(isTracking);
  const [islandName, setIslandName] = useState('Daufuskie Island, SC');
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const saved = localStorage.getItem('turtletracks_gps_subtab');
    if (saved) {
      localStorage.removeItem('turtletracks_gps_subtab');
      return saved;
    }
    return 'radar';
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (location) {
      getIslandLocation(location.lat, location.lng).then(setIslandName);
    }
  }, [location]);

  const handleCaptureCard = () => {
    if (!location) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Canvas size
    canvas.width = 600;
    canvas.height = 360;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 360);
    grad.addColorStop(0, '#0a192f');
    grad.addColorStop(1, '#020c1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 360);

    // Border
    ctx.strokeStyle = '#64ffda';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 340);

    // Accent line
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, 564, 324);

    // Draw Title
    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold 22px Montserrat, sans-serif';
    ctx.fillText('TURTLETRACKS GPS DOCUMENTATION', 40, 50);

    ctx.fillStyle = '#8892b0';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Official South Carolina DNR Monitoring Log', 40, 75);

    // Divider
    ctx.strokeStyle = '#303c55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 95);
    ctx.lineTo(560, 95);
    ctx.stroke();

    // Coordinates Labels & Values
    ctx.fillStyle = '#e6f1ff';
    ctx.font = '16px Montserrat, sans-serif';
    ctx.fillText('LATITUDE', 40, 135);
    ctx.fillText('LONGITUDE', 320, 135);

    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(location.lat.toFixed(6) + '° N', 40, 175);
    ctx.fillText(location.lng.toFixed(6) + '° W', 320, 175);

    // Secondary Meta
    ctx.fillStyle = '#e6f1ff';
    ctx.font = '15px Montserrat, sans-serif';
    ctx.fillText('LOCATION', 40, 235);
    ctx.fillText('ACCURACY', 320, 235);

    ctx.fillStyle = '#8892b0';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(islandName, 40, 265);
    
    const accText = isSimulated ? '± 5.0 meters (Simulated)' : `± ${accuracy ? accuracy.toFixed(1) : 'unknown'} meters`;
    ctx.fillText(accText, 320, 265);

    // Timestamp at the bottom
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    ctx.fillStyle = '#495670';
    ctx.font = '12px monospace';
    ctx.fillText(`TIMESTAMP: ${dateStr} ${timeStr}`, 40, 315);
    ctx.fillText('VERIFIED OFFLINE GPS RECORD', 420, 315);

    // Trigger PNG Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `TurtleTracks_GPS_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#e6f1ff', marginBottom: '6px' }}>GPS Location Utility</h2>
        <p style={{ fontSize: '0.85rem', color: '#8892b0' }}>Acquire, verify, and document active beach coordinates</p>
      </div>

      {/* Sub-tab Toggle */}
      <div style={{ display: 'flex', gap: '8px', padding: '2px', backgroundColor: 'rgba(2, 12, 27, 0.4)', borderRadius: '10px', border: '1px solid rgba(48, 60, 85, 0.4)' }}>
        <button
          onClick={() => setActiveSubTab('radar')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '0.8rem',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'radar' ? '#172a45' : 'transparent',
            color: activeSubTab === 'radar' ? '#64ffda' : '#8892b0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Proximity Radar
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '0.8rem',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'database' ? '#172a45' : 'transparent',
            color: activeSubTab === 'database' ? '#64ffda' : '#8892b0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Crawl List
        </button>
        <button
          onClick={() => setActiveSubTab('card')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '0.8rem',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'card' ? '#172a45' : 'transparent',
            color: activeSubTab === 'card' ? '#64ffda' : '#8892b0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          My GPS Location
        </button>
      </div>

      {/* Geolocation State Notification (always visible if error occurs) */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 122, 89, 0.1)',
          border: '1px solid #ff7a59',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert className="text-[#ff7a59]" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem' }}>
            <strong style={{ color: '#e6f1ff', display: 'block', marginBottom: '4px' }}>GPS Signal Failure</strong>
            {error}
            {isLocal && (
              <button
                onClick={startSimulator}
                style={{
                  marginTop: '10px',
                  display: 'block',
                  backgroundColor: '#f4a261',
                  color: '#020c1b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Activate Walk Simulator Mode
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'card' ? (
        <>
          {/* Radar Panel */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '1.5px solid rgba(48, 60, 85, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '20px',
              background: 'rgba(2, 12, 27, 0.4)'
            }}>
              {/* Pulsing circles */}
              <div className="radar-circle radar-circle-1" style={{ width: '180px', height: '180px' }}></div>
              <div className="radar-circle radar-circle-2" style={{ width: '180px', height: '180px' }}></div>
              <div className="radar-circle radar-circle-3" style={{ width: '180px', height: '180px' }}></div>

              <Compass size={48} className="text-[#64ffda]" style={{ transform: isSimulated ? 'rotate(45deg)' : 'none', transition: 'transform 0.5s ease', color: '#64ffda', zIndex: 10 }} />
            </div>

            {location ? (
              <div style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Latitude</span>
                    <strong style={{ fontSize: '1.25rem', color: '#e6f1ff', fontFamily: 'monospace' }}>{location.lat.toFixed(6)}° N</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Longitude</span>
                    <strong style={{ fontSize: '1.25rem', color: '#e6f1ff', fontFamily: 'monospace' }}>{location.lng.toFixed(6)}° W</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Accuracy</span>
                    <strong style={{ color: '#64ffda', fontSize: '0.95rem' }}>
                      {isSimulated ? '± 5.0m (Sim)' : `± ${accuracy ? accuracy.toFixed(1) : '??'} m`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Location</span>
                    <strong style={{ color: '#f4a261', fontSize: '0.95rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '140px' }}>
                      {islandName}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#8892b0', fontSize: '0.9rem', fontStyle: 'italic' }}>Acquiring GPS fix...</p>
            )}
          </div>

          {location && (
            <button className="btn btn-primary" onClick={handleCaptureCard} style={{ width: '100%' }}>
              <Download size={18} />
              Save Coordinate Card
            </button>
          )}
        </>
      ) : activeSubTab === 'database' ? (
        <GPXDatabase userLocation={location} />
      ) : (
        <NearbyRadar userLocation={location} />
      )}

      {/* Simulator control toggles */}
      {(isLocal || isSimulated) && (
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '0.85rem', color: '#e6f1ff' }}>Walk Simulator Mode</strong>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>Override GPS for indoor testing/demos</span>
          </div>
          <button
            onClick={isSimulated ? stopSimulator : startSimulator}
            className={`btn ${isSimulated ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem' }}
          >
            {isSimulated ? 'Disable Sim' : 'Enable Sim'}
          </button>
        </div>
      )}

      {/* Hidden canvas for card generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}
