import React, { useState } from 'react';
import { ChevronRight, Calendar, Clock, Trash2, ArrowLeft, Download, Mail, Share2, Clipboard, Printer, Plus, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateTextSummary, exportToCSV, exportToHTML, generateMailtoLink, downloadFile } from '../utils/exportHelpers';
import MapView from './MapView';

// Helper to convert meters to miles
const metersToMiles = (m) => (m * 0.000621371).toFixed(2);

// Time formatter
const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export default function SessionLibrary({ sessions, setSessions }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [quickCamPhotos] = useLocalStorage('turtletracks_quickcam', []);
  const [activePickerCrawlIndex, setActivePickerCrawlIndex] = useState(null);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const handleBackToList = () => {
    setSelectedSessionId(null);
    setActivePickerCrawlIndex(null);
  };

  const handleAttachPhoto = (crawlIndex, photo) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id !== selectedSessionId) return s;
      const updatedCrawls = s.crawls.map((c, cIdx) => {
        if (cIdx !== crawlIndex) return c;
        const currentPhotos = c.photos || [];
        if (currentPhotos.some((p) => p.id === photo.id)) return c;
        return {
          ...c,
          photos: [...currentPhotos, photo]
        };
      });
      return {
        ...s,
        crawls: updatedCrawls
      };
    });
    setSessions(updatedSessions);
  };

  const handleDetachPhoto = (crawlIndex, photoId) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id !== selectedSessionId) return s;
      const updatedCrawls = s.crawls.map((c, cIdx) => {
        if (cIdx !== crawlIndex) return c;
        const currentPhotos = c.photos || [];
        return {
          ...c,
          photos: currentPhotos.filter((p) => p.id !== photoId)
        };
      });
      return {
        ...s,
        crawls: updatedCrawls
      };
    });
    setSessions(updatedSessions);
  };

  const handleUpdatePhotoNotes = (crawlIndex, photoId, notes) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id !== selectedSessionId) return s;
      if (crawlIndex === -1) {
        const currentPhotos = s.photos || [];
        const updatedPhotos = currentPhotos.map((p) => {
          if (p.id !== photoId) return p;
          return { ...p, notes };
        });
        return { ...s, photos: updatedPhotos };
      }
      const updatedCrawls = s.crawls.map((c, cIdx) => {
        if (cIdx !== crawlIndex) return c;
        const currentPhotos = c.photos || [];
        const updatedPhotos = currentPhotos.map((p) => {
          if (p.id !== photoId) return p;
          return {
            ...p,
            notes
          };
        });
        return {
          ...c,
          photos: updatedPhotos
        };
      });
      return {
        ...s,
        crawls: updatedCrawls
      };
    });
    setSessions(updatedSessions);
  };

  const handleUpdateSessionNotes = (notes) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id !== selectedSessionId) return s;
      return {
        ...s,
        notes
      };
    });
    setSessions(updatedSessions);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation(); // Avoid selecting row when clicking delete
    if (window.confirm('Are you sure you want to delete this session log? This cannot be undone.')) {
      setSessions(sessions.filter((s) => s.id !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
    }
  };

  const handleCopyClipboard = (session) => {
    const text = generateTextSummary(session);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(session.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleNativeShare = (session) => {
    if (navigator.share) {
      navigator.share({
        title: `TurtleTracks Beach Log - ${new Date(session.startTime).toLocaleDateString()}`,
        text: generateTextSummary(session)
      }).catch(err => console.warn('Native share failed:', err));
    } else {
      // Fallback
      alert('Native sharing is not supported on this browser. Try copying to clipboard.');
    }
  };

  const handleDownloadCSV = (session) => {
    const csv = exportToCSV(session);
    downloadFile(csv, `TurtleTracks_${session.id}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadHTML = (session) => {
    const html = exportToHTML(session);
    downloadFile(html, `TurtleTracks_Report_${session.id}.html`, 'text/html;charset=utf-8;');
  };

  const handleDownloadAllImages = (session) => {
    // Collect all photos from crawls and overall session photos
    const allPhotos = [];
    (session.photos || []).forEach((photo, pIdx) => {
      allPhotos.push({
        dataUrl: photo.dataUrl,
        fileName: `Session_${session.id}_General_${pIdx + 1}_${photo.id}.png`
      });
    });
    (session.crawls || []).forEach((crawl, cIdx) => {
      (crawl.photos || []).forEach((photo, pIdx) => {
        allPhotos.push({
          dataUrl: photo.dataUrl,
          fileName: `Session_${session.id}_Crawl_${cIdx + 1}_${photo.tag.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id}.png`
        });
      });
    });

    if (allPhotos.length === 0) {
      alert("No photos logged in this session to download.");
      return;
    }

    // Download each file sequentially
    allPhotos.forEach((photo, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = photo.dataUrl;
        link.download = photo.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300); // 300ms delay to prevent browser download blocking
    });
  };

  const handleDownloadSingleImage = (photo, tag) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `${tag.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      
      {/* 1. LIST VIEW OF SESSIONS */}
      {!selectedSession ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#e6f1ff', marginBottom: '6px' }}>Session Library</h2>
            <p style={{ fontSize: '0.85rem', color: '#8892b0' }}>Browse and export completed shoreline patrols</p>
          </div>

          {sessions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: '#8892b0', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No completed sessions found. Go to Beach Session and start logging!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map((session) => {
                const date = new Date(session.startTime).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                });
                
                const nestsCount = session.crawls?.filter(c => c.type === 'nest').length || 0;
                const falseCount = session.crawls?.filter(c => c.type === 'false_crawl').length || 0;

                return (
                  <div 
                    key={session.id}
                    className="glass-card"
                    onClick={() => setSelectedSessionId(session.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ color: '#e6f1ff', fontSize: '0.95rem' }}>{session.locationName || 'Daufuskie Shoreline'}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#8892b0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} /> {date}
                        &bull;
                        <Clock size={12} /> {formatDuration(session.duration || 0)}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(100, 255, 218, 0.1)', color: '#64ffda', fontWeight: '600' }}>
                          {nestsCount} Nests
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(244, 162, 97, 0.1)', color: '#f4a261', fontWeight: '600' }}>
                          {falseCount} False
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        style={{ background: 'none', border: 'none', color: '#ff7a59', cursor: 'pointer', padding: '8px' }}
                        aria-label="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight className="text-[#8892b0]" size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        
        // 2. DETAIL VIEW OF SINGLE SESSION
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(48, 60, 85, 0.4)', paddingBottom: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleBackToList}
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '16px' }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h3 style={{ fontSize: '0.95rem', color: '#e6f1ff', margin: 0, fontFamily: 'monospace' }}>
              LOG ID: #{selectedSession.id}
            </h3>
          </div>

          {/* Stats overview */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#e6f1ff', marginBottom: '8px' }}>{selectedSession.locationName}</h2>
            <p style={{ fontSize: '0.75rem', color: '#8892b0', marginBottom: '16px' }}>
              Date: {new Date(selectedSession.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Time</span>
                <strong style={{ fontSize: '0.95rem', color: '#e6f1ff' }}>{formatDuration(selectedSession.duration || 0)}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Distance</span>
                <strong style={{ fontSize: '0.95rem', color: '#e6f1ff' }}>{metersToMiles(selectedSession.distance || 0)} mi</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Crawls</span>
                <strong style={{ fontSize: '0.95rem', color: '#64ffda' }}>{selectedSession.crawls?.length || 0}</strong>
              </div>
            </div>

            {/* Weather & Tide metadata */}
            {(selectedSession.weather || selectedSession.tides) && (
              <div 
                style={{ 
                  marginTop: '14px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(48, 60, 85, 0.4)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: '#8892b0',
                  textAlign: 'left'
                }}
              >
                {selectedSession.weather && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Weather:</span>
                    <strong style={{ color: '#e6f1ff' }}>{selectedSession.weather}</strong>
                  </div>
                )}
                {selectedSession.tides && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tides:</span>
                    <strong style={{ color: '#64ffda', textAlign: 'right' }}>{selectedSession.tides}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Leaflet map of patrol walk */}
          <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapView path={selectedSession.path} crawls={selectedSession.crawls} />
          </div>

          {/* General Session Photos Card */}
          {selectedSession.photos && selectedSession.photos.length > 0 && (
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#e6f1ff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                General Session Photos
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedSession.photos.map((p, idx) => (
                  <div key={p.id} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'visible' }}>
                    <img 
                      src={p.dataUrl} 
                      alt="General session detail" 
                      onClick={() => setSelectedPreviewPhoto({ crawlIndex: -1, photo: p })}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '6px', 
                        border: '1.5px solid rgba(100, 255, 218, 0.2)',
                        cursor: 'pointer' 
                      }} 
                      title="Click to view/download"
                    />
                    <button
                      onClick={() => {
                        const updatedPhotos = selectedSession.photos.filter(item => item.id !== p.id);
                        const updatedSessions = sessions.map(s => {
                          if (s.id !== selectedSession.id) return s;
                          return { ...s, photos: updatedPhotos };
                        });
                        setSessions(updatedSessions);
                      }}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#ff7a59',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 5
                      }}
                      title="Remove Photo"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patrol Notes Card */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#e6f1ff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Patrol Notes
              </h4>
              <span style={{ fontSize: '0.65rem', color: '#8892b0' }}>
                Autosaved
              </span>
            </div>
            <textarea
              placeholder="Add notes about this patrol (weather, beach conditions, tide level, volunteers, unusual tracks...)"
              value={selectedSession.notes || ''}
              onChange={(e) => handleUpdateSessionNotes(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: 'rgba(2, 12, 27, 0.4)',
                border: '1px solid rgba(48, 60, 85, 0.8)',
                borderRadius: '8px',
                color: '#e6f1ff',
                padding: '10px',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                resize: 'vertical',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#64ffda'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(48, 60, 85, 0.8)'}
            />
          </div>

          {/* Export Action Grid */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', color: '#e6f1ff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Export & Share Patrol Report</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => handleCopyClipboard(selectedSession)} style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}>
                <Clipboard size={14} /> {copiedId === selectedSession.id ? 'Copied!' : 'Copy Text'}
              </button>
              
              <a 
                href={generateMailtoLink(selectedSession)}
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
              >
                <Mail size={14} /> Email Pre-fill
              </a>

              <button className="btn btn-secondary" onClick={() => handleDownloadHTML(selectedSession)} style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}>
                <Download size={14} /> Standalone HTML
              </button>

              <button className="btn btn-secondary" onClick={() => handleDownloadCSV(selectedSession)} style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}>
                <Download size={14} /> CSV Spreadsheet
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => handleDownloadAllImages(selectedSession)} 
                style={{ 
                  padding: '10px 12px', 
                  fontSize: '0.78rem', 
                  borderRadius: '8px', 
                  gridColumn: 'span 2', 
                  backgroundColor: 'rgba(100, 255, 218, 0.05)', 
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  color: '#64ffda'
                }}
              >
                <Download size={14} /> Download All Session Images ({
                  (selectedSession.photos?.length || 0) + (selectedSession.crawls || []).reduce((acc, c) => acc + (c.photos?.length || 0), 0)
                })
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => handleNativeShare(selectedSession)}
                style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px', gridColumn: 'span 2' }}
              >
                <Share2 size={14} /> Share via Phone App (SMS/AirDrop)
              </button>

              <button 
                className="btn btn-accent" 
                onClick={handlePrint}
                style={{ padding: '10px 12px', fontSize: '0.8rem', borderRadius: '8px', gridColumn: 'span 2' }}
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/* Crawl logs inside the session */}
          <div>
            <h3 style={{ fontSize: '1rem', color: '#e6f1ff', marginBottom: '12px' }}>Detailed Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedSession.crawls?.map((crawl, idx) => {
                const isNest = crawl.type === 'nest';
                return (
                  <div 
                    key={idx} 
                    className="glass-card" 
                    style={{ 
                      borderLeft: `4px solid ${isNest ? '#64ffda' : '#f4a261'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#e6f1ff', fontSize: '0.9rem' }}>Crawl #{idx + 1} &bull; {isNest ? 'Nest' : 'False Crawl'}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>
                        {new Date(crawl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>
                      {isNest && !crawl.inSitu ? (
                        <>
                          <div><strong>Original GPS:</strong> {crawl.coordinates?.lat.toFixed(6)}, {crawl.coordinates?.lng.toFixed(6)}</div>
                          <div><strong>Relocated GPS:</strong> {crawl.relocationCoords ? `${crawl.relocationCoords.lat.toFixed(6)}, ${crawl.relocationCoords.lng.toFixed(6)}` : 'Not recorded'}</div>
                        </>
                      ) : (
                        <div><strong>GPS:</strong> {crawl.coordinates?.lat.toFixed(6)}, {crawl.coordinates?.lng.toFixed(6)}</div>
                      )}
                      <div><strong>Position:</strong> {crawl.tidelineRelation}</div>
                      {isNest ? (
                        <>
                          <div><strong>Status:</strong> {crawl.inSitu ? 'In Situ' : 'Relocated'}</div>
                          {!crawl.inSitu && (
                            <>
                              {crawl.totalEggCount !== undefined && crawl.totalEggCount !== null && (
                                <div><strong>Total Eggs Found:</strong> {crawl.totalEggCount || '0'}</div>
                              )}
                              {crawl.relocatedEggCount !== undefined && crawl.relocatedEggCount !== null && (
                                <div><strong>Relocated Eggs:</strong> {crawl.relocatedEggCount || '0'}</div>
                              )}
                              {(crawl.totalEggCount === undefined && crawl.eggCount) && (
                                <div><strong>Egg Count:</strong> {crawl.eggCount}</div>
                              )}
                            </>
                          )}
                          <div><strong>DNA Vial:</strong> {crawl.dnaVialNumber ? `#${crawl.dnaVialNumber}` : 'Not collected'}</div>
                          {crawl.isTurtleEncounter && (
                            <div style={{ color: '#a5b4fc', marginTop: '4px', fontWeight: '600' }}>
                              🐢 Turtle Encounter Logged {crawl.flipperPitTag ? `(Tag: ${crawl.flipperPitTag})` : (crawl.flipperTagLeft || crawl.flipperTagRight ? `(Tags: ${crawl.flipperTagLeft || 'None'}/${crawl.flipperTagRight || 'None'})` : '')}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div><strong>Factors:</strong> {crawl.falseCrawlFactors}</div>
                          {crawl.isPossibleNest && <div><strong>Possible Nest:</strong> Yes</div>}
                        </>
                      )}
                      {crawl.notes && <div style={{ marginTop: '4px' }}><strong>Notes:</strong> {crawl.notes}</div>}
                    </div>

                    {/* Photo previews if any */}
                    {crawl.photos && crawl.photos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                        {crawl.photos.map(p => (
                          <div key={p.id} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'visible', margin: '4px 0' }}>
                            <img 
                              src={p.dataUrl} 
                              alt={p.tag} 
                              onClick={() => setSelectedPreviewPhoto({ crawlIndex: idx, photo: p })}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                borderRadius: '6px', 
                                border: '1px solid rgba(100, 255, 218, 0.2)',
                                cursor: 'pointer' 
                              }} 
                              title="Click to view/edit comments"
                            />
                            <button
                              onClick={() => handleDetachPhoto(idx, p.id)}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: '#ff7a59',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                padding: 0,
                                zIndex: 5
                              }}
                              title="Remove Photo"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                            <span style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: 'rgba(2, 12, 27, 0.75)',
                              color: '#64ffda',
                              fontSize: '0.55rem',
                              textAlign: 'center',
                              padding: '2px 0',
                              borderBottomLeftRadius: '6px',
                              borderBottomRightRadius: '6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Photo attaching section for crawls */}
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(48, 60, 85, 0.3)' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setActivePickerCrawlIndex(activePickerCrawlIndex === idx ? null : idx)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: activePickerCrawlIndex === idx ? 'rgba(100, 255, 218, 0.1)' : 'rgba(23, 42, 69, 0.6)',
                          border: `1px solid ${activePickerCrawlIndex === idx ? '#64ffda' : 'rgba(48, 60, 85, 0.8)'}`,
                          color: activePickerCrawlIndex === idx ? '#64ffda' : '#8892b0',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <Plus size={12} />
                        {activePickerCrawlIndex === idx ? 'Close Photo Picker' : 'Attach Quick Cam Photo'}
                      </button>

                      {activePickerCrawlIndex === idx && (
                        <div 
                          className="glass-panel" 
                          style={{ 
                            marginTop: '10px', 
                            padding: '12px', 
                            backgroundColor: 'rgba(2, 12, 27, 0.6)', 
                            borderRadius: '8px',
                            border: '1px dashed rgba(100, 255, 218, 0.2)',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#e6f1ff', fontWeight: '600', marginBottom: '8px' }}>
                            Select from Quick Cam Roll:
                          </div>
                          
                          {quickCamPhotos.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#8892b0', fontStyle: 'italic' }}>
                              No photos found in Quick Cam roll. Capture photos in the Quick Cam tab first.
                            </div>
                          ) : (
                            <div 
                              style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                overflowX: 'auto', 
                                paddingBottom: '6px',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(100, 255, 218, 0.3) rgba(2, 12, 27, 0.6)'
                              }}
                            >
                              {quickCamPhotos.map(p => {
                                const isAlreadyAttached = (crawl.photos || []).some(ap => ap.id === p.id);
                                return (
                                  <div 
                                    key={p.id}
                                    onClick={() => {
                                      if (!isAlreadyAttached) {
                                        handleAttachPhoto(idx, p);
                                      } else {
                                        handleDetachPhoto(idx, p.id);
                                      }
                                    }}
                                    style={{
                                      position: 'relative',
                                      flexShrink: 0,
                                      width: '64px',
                                      height: '64px',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      border: `2px solid ${isAlreadyAttached ? '#64ffda' : 'transparent'}`,
                                      opacity: isAlreadyAttached ? 0.7 : 1,
                                      transition: 'all 0.2s ease'
                                    }}
                                    title={isAlreadyAttached ? "Tapped to detach" : "Tap to attach"}
                                  >
                                    <img 
                                      src={p.dataUrl} 
                                      alt={p.tag} 
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                      }} 
                                    />
                                    {isAlreadyAttached && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: 'rgba(10, 25, 47, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64ffda',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                      }}>
                                        ✓
                                      </div>
                                    )}
                                    <span style={{
                                      position: 'absolute',
                                      bottom: 0, left: 0, right: 0,
                                      backgroundColor: 'rgba(2, 12, 27, 0.8)',
                                      color: '#8892b0',
                                      fontSize: '0.5rem',
                                      textAlign: 'center',
                                      padding: '1px 0',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {p.tag}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedPreviewPhoto && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(2, 12, 27, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={() => setSelectedPreviewPhoto(null)}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              border: '1.5px solid var(--color-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', color: '#e6f1ff', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
                Photo Notes &bull; <span style={{ color: '#64ffda' }}>{selectedPreviewPhoto.photo.tag}</span>
              </h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedPreviewPhoto(null)}
                style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '12px' }}
              >
                Close
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.8)' }}>
              <img 
                src={selectedPreviewPhoto.photo.dataUrl} 
                alt={selectedPreviewPhoto.photo.tag} 
                style={{ width: '100%', display: 'block', maxHeight: '240px', objectFit: 'contain', backgroundColor: 'rgba(2, 12, 27, 0.6)' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', color: '#8892b0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Photo Notes / Comments:
              </label>
              <textarea
                placeholder="Enter comments about this image..."
                value={selectedPreviewPhoto.photo.notes || ''}
                onChange={(e) => {
                  const updatedNotes = e.target.value;
                  setSelectedPreviewPhoto({
                    ...selectedPreviewPhoto,
                    photo: {
                      ...selectedPreviewPhoto.photo,
                      notes: updatedNotes
                    }
                  });
                  handleUpdatePhotoNotes(selectedPreviewPhoto.crawlIndex, selectedPreviewPhoto.photo.id, updatedNotes);
                }}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: 'rgba(2, 12, 27, 0.4)',
                  border: '1px solid rgba(48, 60, 85, 0.8)',
                  borderRadius: '8px',
                  color: '#e6f1ff',
                  padding: '10px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#64ffda'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(48, 60, 85, 0.8)'}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => handleDownloadSingleImage(selectedPreviewPhoto.photo, selectedPreviewPhoto.photo.tag)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Photo
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setSelectedPreviewPhoto(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
