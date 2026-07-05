import React, { useState } from 'react';
import { ChevronRight, Calendar, Clock, Trash2, ArrowLeft, Download, Mail, Share2, Clipboard, Printer, Plus, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateTextSummary, exportToCSV, exportToHTML, generateMailtoLink, downloadFile, generateFBPost } from '../utils/exportHelpers';
import MapView from './MapView';
import { getPointCommunity } from '../utils/communities';

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

  // Batch selection state
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);

  // Auto-cleanup helper: automatically keep the 10 most recent sessions
  const limitSessionCount = (updatedList) => {
    if (updatedList.length > 10) {
      // Sort sessions by startTime descending to identify the oldest ones
      const sorted = [...updatedList].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      const truncated = sorted.slice(0, 10);
      const toRemove = sorted.slice(10);

      // Offer to download JSON for all pruned sessions
      if (window.confirm(`Notice: Stored completed sessions list exceeded the 10 logs limit. The oldest ${toRemove.length} session logs will be automatically deleted to save local storage space.\n\nWould you like to download JSON backup files for these older sessions before they are deleted?`)) {
        toRemove.forEach((session) => {
          const jsonStr = JSON.stringify(session, null, 2);
          const link = document.createElement('a');
          const file = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
          link.href = URL.createObjectURL(file);
          link.download = `Backup_Stale_Session_${session.id}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        });
      }
      return truncated;
    }
    return updatedList;
  };

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
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      setSelectedSessionIds(prev => prev.filter(sid => sid !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedSessionIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedSessionIds.length} selected session logs? This cannot be undone.`)) {
      const remaining = sessions.filter((s) => !selectedSessionIds.includes(s.id));
      setSessions(remaining);
      setSelectedSessionIds([]);
      if (selectedSessionIds.includes(selectedSessionId)) {
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

  const [copiedFBId, setCopiedFBId] = useState(null);
  const handleCopyFBPost = (session) => {
    const text = generateFBPost(session);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFBId(session.id);
      setTimeout(() => setCopiedFBId(null), 2000);
    });
  };

  const handleNativeShare = (session) => {
    if (navigator.share) {
      navigator.share({
        title: `Shoreline Patrol Summary - ${session.locationName}`,
        text: generateTextSummary(session)
      }).catch(console.error);
    } else {
      alert("Web Sharing API not supported on this browser/device.");
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

  const handleDownloadJSON = (session) => {
    const jsonStr = JSON.stringify(session, null, 2);
    downloadFile(jsonStr, `TurtleTracks_Session_${session.id}.json`, 'application/json;charset=utf-8;');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSession = JSON.parse(event.target.result);
        
        // Validation checks
        if (!importedSession.id || !importedSession.startTime) {
          alert("Invalid session file: Missing required session identifiers.");
          return;
        }

        // Check if session already exists
        const exists = sessions.some(s => s.id === importedSession.id);
        if (exists) {
          if (!window.confirm("A session with this ID already exists. Would you like to overwrite it?")) {
            return;
          }
          // Overwrite existing
          const updated = sessions.map(s => s.id === importedSession.id ? importedSession : s);
          setSessions(limitSessionCount(updated));
          alert("Session overwritten successfully!");
        } else {
          // Add new
          const updated = [importedSession, ...sessions];
          setSessions(limitSessionCount(updated));
          alert("Session imported successfully!");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file: Make sure the file format is valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Helper function to draw watermark on the photo canvas before download
  const watermarkPhoto = (photo, extraInfo = '') => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw the original photo
        ctx.drawImage(img, 0, 0);
        
        // Setup banner parameters
        const bannerHeight = Math.max(40, Math.round(canvas.height * 0.12));
        ctx.fillStyle = 'rgba(2, 12, 27, 0.75)';
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);
        
        // Draw texts
        const fontSize = Math.max(12, Math.round(bannerHeight * 0.22));
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.fillStyle = '#64ffda';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Line 1: Tag
        const tagText = `${photo.tag || 'Field Log'}`.toUpperCase();
        ctx.fillText(tagText, 15, canvas.height - (bannerHeight * 0.65));
        
        // Line 2: GPS/Timestamp/Comments
        ctx.font = `${Math.max(10, Math.round(bannerHeight * 0.18))}px sans-serif`;
        ctx.fillStyle = '#8892b0';
        
        const parts = [];
        if (extraInfo) parts.push(extraInfo);
        if (photo.notes) parts.push(`Notes: ${photo.notes}`);
        
        const detailText = parts.join(' | ');
        ctx.fillText(detailText, 15, canvas.height - (bannerHeight * 0.3));
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => {
        resolve(photo.dataUrl); // Fallback to raw if load fails
      };
      img.src = photo.dataUrl;
    });
  };

  const handleDownloadAllImages = async (session) => {
    // Collect all photos from crawls and overall session photos
    const allPhotos = [];
    (session.photos || []).forEach((photo, pIdx) => {
      const info = `Session: ${session.locationName || 'Daufuskie'} (${new Date(session.startTime).toLocaleDateString()})`;
      allPhotos.push({
        photo: photo,
        info: info,
        fileName: `Session_${session.id}_General_${pIdx + 1}_${photo.id}.jpg`
      });
    });
    (session.crawls || []).forEach((crawl, cIdx) => {
      const isNest = crawl.type === 'nest';
      const gpsStr = crawl.coordinates ? `GPS: ${crawl.coordinates.lat.toFixed(6)}, ${crawl.coordinates.lng.toFixed(6)}` : '';
      (crawl.photos || []).forEach((photo, pIdx) => {
        allPhotos.push({
          photo: photo,
          info: gpsStr,
          fileName: `Session_${session.id}_Crawl_${cIdx + 1}_${photo.tag.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id}.jpg`
        });
      });
    });

    if (allPhotos.length === 0) {
      alert("No photos logged in this session to download.");
      return;
    }

    // Download each file sequentially with watermarks
    for (let index = 0; index < allPhotos.length; index++) {
      const item = allPhotos[index];
      const watermarkedUrl = await watermarkPhoto(item.photo, item.info);
      
      await new Promise((res) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = watermarkedUrl;
          link.download = item.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          res();
        }, 300); // 300ms delay to prevent browser download blocking
      });
    }
  };

  const handleDownloadSingleImage = async (photo, tag) => {
    const info = selectedSession ? `Session: ${selectedSession.locationName || 'Daufuskie'} (${new Date(selectedSession.startTime).toLocaleDateString()})` : '';
    const watermarkedUrl = await watermarkPhoto(photo, info);
    
    const link = document.createElement('a');
    link.href = watermarkedUrl;
    link.download = `${tag.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id || Date.now()}.jpg`;
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
            <p style={{ fontSize: '0.85rem', color: '#8892b0', marginBottom: '12px' }}>Browse and export completed shoreline patrols</p>
            
            {/* Storage Limit Notice Warning Box */}
            <div style={{
              backgroundColor: 'rgba(244, 162, 97, 0.08)',
              border: '1px solid rgba(244, 162, 97, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: '#f4a261',
              textAlign: 'left',
              lineHeight: '1.4',
              marginBottom: '15px'
            }}>
              <strong>⚠️ Storage Warning:</strong> To prevent device memory crashes, only up to <strong>10 sessions</strong> can be saved in local storage. Once exceeded, the oldest sessions will be overwritten. You will be prompted to download JSON backup files for any sessions that are deleted.
            </div>
          </div>

          {/* Import Session Button */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <label 
              className="btn btn-secondary" 
              style={{ 
                cursor: 'pointer', 
                padding: '10px 16px', 
                borderRadius: '8px', 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                flex: 1,
                backgroundColor: 'rgba(2, 12, 27, 0.4)',
                border: '1px dashed rgba(100, 255, 218, 0.4)',
                color: '#64ffda'
              }}
            >
              <Plus size={14} /> Import Session (.json)
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                style={{ display: 'none' }} 
              />
            </label>

            {selectedSessionIds.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={handleDeleteSelected}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  backgroundColor: '#ff7a59',
                  color: '#020c1b',
                  fontWeight: '600'
                }}
              >
                <Trash2 size={14} /> Delete Selected ({selectedSessionIds.length})
              </button>
            )}
          </div>

          {sessions.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                {selectedSessionIds.length} of {sessions.length} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedSessionIds(sessions.map(s => s.id))}
                  style={{ background: 'none', border: 'none', color: '#64ffda', fontSize: '0.75rem', cursor: 'pointer', padding: '4px' }}
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedSessionIds([])}
                  style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '0.75rem', cursor: 'pointer', padding: '4px' }}
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

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
                const isChecked = selectedSessionIds.includes(session.id);

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
                      padding: '16px',
                      border: isChecked ? '1px solid #64ffda' : '1px solid var(--panel-border)',
                      backgroundColor: isChecked ? 'rgba(100, 255, 218, 0.03)' : 'rgba(2, 12, 27, 0.4)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessionIds(prev => [...prev, session.id]);
                          } else {
                            setSelectedSessionIds(prev => prev.filter(id => id !== session.id));
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#64ffda' }}
                      />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.1fr 0.8fr', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Time</span>
                <strong style={{ fontSize: '0.85rem', color: '#e6f1ff' }}>{formatDuration(selectedSession.duration || 0)}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Patrol Dist</span>
                <strong style={{ fontSize: '0.85rem', color: '#e6f1ff' }}>{metersToMiles(selectedSession.distance || 0)} mi</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Beach Cover</span>
                <strong style={{ fontSize: '0.85rem', color: '#64ffda' }}>{metersToMiles(selectedSession.beachCoverage || 0)} mi</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 12, 27, 0.4)', padding: '8px 4px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.6rem', color: '#8892b0', display: 'block', textTransform: 'uppercase' }}>Crawls</span>
                <strong style={{ fontSize: '0.85rem', color: '#64ffda' }}>{selectedSession.crawls?.length || 0}</strong>
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
               
               <button 
                 className="btn btn-secondary" 
                 onClick={() => handleCopyFBPost(selectedSession)} 
                 style={{ 
                   padding: '8px 12px', 
                   fontSize: '0.78rem', 
                   borderRadius: '8px',
                   backgroundColor: copiedFBId === selectedSession.id ? 'rgba(100, 255, 218, 0.1)' : undefined,
                   borderColor: copiedFBId === selectedSession.id ? '#64ffda' : undefined,
                   color: copiedFBId === selectedSession.id ? '#64ffda' : undefined
                 }}
               >
                 <Share2 size={14} /> {copiedFBId === selectedSession.id ? 'FB Post Copied!' : 'Copy FB Post'}
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

               <button className="btn btn-secondary" onClick={() => handleDownloadJSON(selectedSession)} style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}>
                 <Download size={14} /> JSON Session Backup
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
                      <strong style={{ color: '#e6f1ff', fontSize: '0.9rem' }}>
                        Crawl #{idx + 1} &bull; {isNest ? 'Nest' : `False Crawl${crawl.falseCrawlNumber ? ` #${crawl.falseCrawlNumber}` : ''}`}
                      </strong>
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
                      {(() => {
                        const targetCoords = (isNest && !crawl.inSitu) ? crawl.relocationCoords : crawl.coordinates;
                        const community = getPointCommunity(targetCoords);
                        if (community) {
                          return <div><strong>Community:</strong> {community}</div>;
                        }
                        return null;
                      })()}
                      {crawl.nestLocationLandmark && (
                        <div><strong>Nest Location:</strong> {crawl.nestLocationLandmark}</div>
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
                          {crawl.isTurtleEncounter && (
                            <div style={{ color: '#a5b4fc', marginTop: '4px', fontWeight: '600' }}>
                              🐢 Turtle Encounter Logged {crawl.flipperPitTag ? `(Tag: ${crawl.flipperPitTag})` : (crawl.flipperTagLeft || crawl.flipperTagRight ? `(Tags: ${crawl.flipperTagLeft || 'None'}/${crawl.flipperTagRight || 'None'})` : '')}
                            </div>
                          )}
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
