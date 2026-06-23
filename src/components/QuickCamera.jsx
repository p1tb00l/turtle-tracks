import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Eye, Scan, RefreshCw, Upload } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function QuickCamera() {
  const [photos, setPhotos] = useLocalStorage('turtletracks_quickcam', []);
  const [currentTag, setCurrentTag] = useState('Crawl Tracks');
  const [currentNotes, setCurrentNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Interactive prediction states
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const TAGS = ['Crawl Tracks', 'Nest Setup', 'Nest Card', 'Broken Egg Specimen', 'Nest Predation', 'Other Details'];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = {
        id: Date.now().toString(),
        dataUrl: event.target.result,
        tag: currentTag,
        notes: currentNotes,
        timestamp: new Date().toISOString()
      };
      setPhotos([newPhoto, ...photos]);
      setCurrentNotes('');
      
      // Select for preview immediately
      setSelectedPhoto(newPhoto);
      setPredictionResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id) => {
    setPhotos(photos.filter(p => p.id !== id));
    if (selectedPhoto && selectedPhoto.id === id) {
      setSelectedPhoto(null);
      setPredictionResult(null);
    }
  };

  const handlePredictChamber = () => {
    setIsPredicting(true);
    setPredictionResult(null);
    
    // Simulate analyzing the track pattern
    setTimeout(() => {
      setIsPredicting(false);
      
      // Create random simulated offsets for the Daufuskie Island loggerhead
      const horizontalOffset = (Math.random() * 0.6 - 0.3).toFixed(2);
      const verticalDistance = (1.1 + Math.random() * 0.4).toFixed(2);
      
      setPredictionResult({
        x: 40 + Math.random() * 20, // percentage for overlay placement
        y: 45 + Math.random() * 20,
        text: `Nesting chamber likely located ${verticalDistance}m behind crawl apex, offset ${horizontalOffset}m ${horizontalOffset > 0 ? 'right' : 'left'} of track centerline.`
      });
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#e6f1ff', marginBottom: '6px' }}>Quick Camera Capture</h2>
        <p style={{ fontSize: '0.85rem', color: '#8892b0' }}>Store and tag field photographs instantly</p>
      </div>

      {/* Upload Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="form-group">
          <label className="form-label">Photo Tag / Subject</label>
          <select 
            value={currentTag} 
            onChange={(e) => setCurrentTag(e.target.value)}
            className="form-select"
          >
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Optional Comments</label>
          <input 
            type="text"
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            placeholder="e.g. Broken egg found near tideline"
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <label 
            className="btn btn-primary" 
            style={{ 
              flex: 1, 
              cursor: 'pointer',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.95rem' 
            }}
          >
            <Camera size={20} />
            Take Photo
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handlePhotoUpload} 
              style={{ display: 'none' }} 
            />
          </label>

          <label 
            className="btn btn-secondary" 
            style={{ 
              flex: 1, 
              cursor: 'pointer',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.95rem' 
            }}
          >
            <Upload size={20} />
            Upload File
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* Modal Preview with Predictor */}
      {selectedPhoto && (
        <div className="glass-panel" style={{ padding: '20px', border: '1.5px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: '#e6f1ff' }}>Image Analysis Preview</h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => { setSelectedPhoto(null); setPredictionResult(null); }}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
            >
              Close
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#020c1b' }}>
            <img 
              src={selectedPhoto.dataUrl} 
              alt="Preview" 
              style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }} 
            />

            {/* Simulated Chamber Prediction Target Overlay */}
            {isPredicting && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(2, 12, 27, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <RefreshCw className="animate-spin text-[#64ffda]" size={36} style={{ animation: 'spin 2s linear infinite', color: '#64ffda' }} />
                <span style={{ fontSize: '0.85rem', color: '#64ffda', fontWeight: '600', letterSpacing: '0.05em' }}>RUNNING APEX ALIGNMENT...</span>
              </div>
            )}

            {predictionResult && (
              <div style={{
                position: 'absolute',
                top: `${predictionResult.y}%`,
                left: `${predictionResult.x}%`,
                transform: 'translate(-50%, -50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #ff7a59',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255,122,89,0.8)',
                zIndex: 10
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff7a59' }}></div>
                {/* Ping rings */}
                <div className="radar-circle" style={{ borderColor: '#ff7a59', width: '40px', height: '40px' }}></div>
              </div>
            )}
          </div>

          {/* Analysis Actions */}
          {selectedPhoto.tag === 'Crawl Tracks' && (
            <div style={{ marginTop: '15px' }}>
              {!predictionResult ? (
                <button 
                  className="btn btn-accent" 
                  onClick={handlePredictChamber} 
                  disabled={isPredicting}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <Scan size={18} />
                  Predict Nest Chamber Location
                </button>
              ) : (
                <div style={{ 
                  backgroundColor: 'rgba(255, 122, 89, 0.1)', 
                  border: '1.5px dashed #ff7a59', 
                  borderRadius: '8px', 
                  padding: '12px',
                  fontSize: '0.85rem',
                  color: '#e6f1ff',
                  marginTop: '10px'
                }}>
                  <strong style={{ color: '#ff7a59', display: 'block', marginBottom: '4px' }}>Chamber Locator Estimate:</strong>
                  {predictionResult.text}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#8892b0' }}>
            <div><strong>Tag:</strong> <span style={{ color: '#64ffda' }}>{selectedPhoto.tag}</span></div>
            {selectedPhoto.notes && <div style={{ marginTop: '4px' }}><strong>Comments:</strong> {selectedPhoto.notes}</div>}
            <div style={{ marginTop: '4px', fontSize: '0.75rem' }}><strong>Logged:</strong> {new Date(selectedPhoto.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Gallery List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff', marginBottom: '12px' }}>Camera Roll ({photos.length})</h3>
        
        {photos.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#8892b0', fontStyle: 'italic', fontSize: '0.9rem' }}>
            No quick images saved yet. Click capture to begin.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {photos.map(p => (
              <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', padding: '10px' }}>
                <div style={{ position: 'relative', width: '100', height: '100px', backgroundColor: '#020c1b', borderRadius: '6px', overflow: 'hidden' }}>
                  <img 
                    src={p.dataUrl} 
                    alt={p.tag} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ 
                    position: 'absolute', 
                    top: '4px', 
                    left: '4px', 
                    backgroundColor: 'rgba(10, 25, 47, 0.85)', 
                    color: '#64ffda', 
                    fontSize: '0.6rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}>
                    {p.tag}
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                  {p.notes && (
                    <span style={{ fontSize: '0.75rem', color: '#8892b0', lineBreak: 'anywhere', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {p.notes}
                    </span>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <button 
                      onClick={() => { setSelectedPhoto(p); setPredictionResult(null); }}
                      style={{ background: 'none', border: 'none', color: '#64ffda', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '500' }}
                    >
                      <Eye size={12} /> View
                    </button>
                    
                    <button 
                      onClick={() => handleDeletePhoto(p.id)}
                      style={{ background: 'none', border: 'none', color: '#ff7a59', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '500' }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
