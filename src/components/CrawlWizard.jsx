import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckSquare, ArrowRight, ArrowLeft, Save, AlertTriangle, AlertCircle, Upload } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function CrawlWizard({ activeCoords, onSaveCrawl, onCancel, isTurtleEncounter = false }) {
  const [step, setStep] = useState(1);
  const [crawlType, setCrawlType] = useState('nest'); // 'nest' or 'false_crawl'
  
  // Form State
  const [photos, setPhotos] = useState([]);
  const [tidelineRelation, setTidelineRelation] = useState('Above High Tideline');
  const [inSitu, setInSitu] = useState(true);
  const [dnaVialNumber, setDnaVialNumber] = useState('');
  const [nestNumber, setNestNumber] = useState('');
  
  // Relocation specific states
  const [relocationCoords, setRelocationCoords] = useState(null);
  const [totalEggCount, setTotalEggCount] = useState('');
  const [relocatedEggCount, setRelocatedEggCount] = useState('');

  // False Crawl state
  const [falseCrawlFactors, setFalseCrawlFactors] = useState('Simple U-turn');
  const [crossedOut, setCrossedOut] = useState(false);
  const [isPossibleNest, setIsPossibleNest] = useState(false);
  const [markedPost, setMarkedPost] = useState(false);

  const [notes, setNotes] = useState('');
  const [nestCardDone, setNestCardDone] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  // Turtle Encounter Form State
  const [flipperTagLeft, setFlipperTagLeft] = useState('');
  const [flipperTagRight, setFlipperTagRight] = useState('');
  const [carapaceNotchToNotch, setCarapaceNotchToNotch] = useState('');
  const [carapaceNotchToTip, setCarapaceNotchToTip] = useState('');
  const [carapaceWidestPoint, setCarapaceWidestPoint] = useState('');

  // Auto-fill active GPS coordinates when mounting
  useEffect(() => {
    if (activeCoords && !coordinates) {
      setCoordinates(activeCoords);
    }
  }, [activeCoords, coordinates]);

  // Capture photos helper
  const handlePhotoUpload = (e, tag) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      // If we have a nest number, we watermark the photo
      if (nestNumber) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Add watermark configuration
          const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
          const watermarkText = `Nest #${nestNumber} - ${todayStr}`;
          // Set font size proportional to image width
          const fontSize = Math.max(14, Math.round(canvas.width * 0.035));
          ctx.font = `bold ${fontSize}px sans-serif`;
          
          // Measure text width to position in bottom right corner
          const textMetrics = ctx.measureText(watermarkText);
          const padding = 15;
          const x = canvas.width - textMetrics.width - padding;
          const y = canvas.height - padding;
          
          // Draw semi-transparent background card for readability
          ctx.fillStyle = 'rgba(2, 12, 27, 0.6)';
          ctx.fillRect(
            x - 6,
            y - fontSize + 2,
            textMetrics.width + 12,
            fontSize + 6
          );
          
          // Draw text
          ctx.fillStyle = '#64ffda'; // Primary Seafoam accent color
          ctx.fillText(watermarkText, x, y);
          
          const watermarkedDataUrl = canvas.toDataURL('image/png');
          setPhotos(prev => [...prev, {
            id: Date.now().toString(),
            dataUrl: watermarkedDataUrl,
            tag: tag,
            watermarked: true
          }]);
        };
        img.src = dataUrl;
      } else {
        setPhotos(prev => [...prev, {
          id: Date.now().toString(),
          dataUrl: dataUrl,
          tag: tag,
          watermarked: false
        }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureRelocationCoords = () => {
    if (activeCoords) {
      setRelocationCoords(activeCoords);
    }
  };

  const handleSave = () => {
    // Helper to proceed with actual saving
    const saveWithPhotos = (processedPhotos) => {
      if (crawlType === 'nest') {
        const equipmentInstalled = true;
        onSaveCrawl({
          type: 'nest',
          timestamp: new Date().toISOString(),
          coordinates,
          photos: processedPhotos,
          tidelineRelation,
          inSitu,
          dnaVialNumber,
          equipmentInstalled,
          relocationCoords: !inSitu ? relocationCoords : null,
          totalEggCount: !inSitu ? totalEggCount : null,
          relocatedEggCount: !inSitu ? relocatedEggCount : null,
          nestCardDone,
          notes,
          isTurtleEncounter,
          flipperTagLeft: isTurtleEncounter ? flipperTagLeft : '',
          flipperTagRight: isTurtleEncounter ? flipperTagRight : '',
          carapaceNotchToNotch: isTurtleEncounter ? carapaceNotchToNotch : '',
          carapaceNotchToTip: isTurtleEncounter ? carapaceNotchToTip : '',
          carapaceWidestPoint: isTurtleEncounter ? carapaceWidestPoint : ''
        });
      } else {
        onSaveCrawl({
          type: 'false_crawl',
          timestamp: new Date().toISOString(),
          coordinates,
          photos: processedPhotos,
          tidelineRelation,
          falseCrawlFactors,
          crossedOut,
          isPossibleNest,
          markedPost: isPossibleNest ? markedPost : false,
          nestCardDone,
          notes,
          isTurtleEncounter,
          flipperTagLeft: isTurtleEncounter ? flipperTagLeft : '',
          flipperTagRight: isTurtleEncounter ? flipperTagRight : '',
          carapaceNotchToNotch: isTurtleEncounter ? carapaceNotchToNotch : '',
          carapaceNotchToTip: isTurtleEncounter ? carapaceNotchToTip : '',
          carapaceWidestPoint: isTurtleEncounter ? carapaceWidestPoint : ''
        });
      }
    };

    // If we have a nest number and unwatermarked photos, apply watermarks retroactively now
    const unwatermarkedPhotos = photos.filter(p => !p.watermarked);
    if (nestNumber && unwatermarkedPhotos.length > 0) {
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const watermarkText = `Nest #${nestNumber} - ${todayStr}`;
      
      Promise.all(photos.map(p => {
        if (p.watermarked) return Promise.resolve(p);
        return new Promise((resolve) => {
          try {
            const img = new Image();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const fontSize = Math.max(14, Math.round(canvas.width * 0.035));
                ctx.font = `bold ${fontSize}px sans-serif`;
                const textMetrics = ctx.measureText(watermarkText);
                const padding = 15;
                const x = canvas.width - textMetrics.width - padding;
                const y = canvas.height - padding;
                
                ctx.fillStyle = 'rgba(2, 12, 27, 0.6)';
                ctx.fillRect(x - 6, y - fontSize + 2, textMetrics.width + 12, fontSize + 6);
                ctx.fillStyle = '#64ffda';
                ctx.fillText(watermarkText, x, y);
                
                resolve({
                  ...p,
                  dataUrl: canvas.toDataURL('image/png'),
                  watermarked: true
                });
              } catch (err) {
                console.error("Watermark canvas drawing failed, using fallback:", err);
                resolve(p);
              }
            };
            img.onerror = (e) => {
              console.error("Watermark image load failed:", e);
              resolve(p);
            };
            img.src = p.dataUrl;
          } catch (err) {
            console.error("Watermark setup failed:", err);
            resolve(p);
          }
        });
      })).then(updatedPhotos => {
        saveWithPhotos(updatedPhotos);
      }).catch(err => {
        console.error("Promise.all for watermarks failed, saving original photos:", err);
        saveWithPhotos(photos);
      });
    } else {
      saveWithPhotos(photos);
    }
  };

  const isRelocationSelected = !inSitu && crawlType === 'nest';
  const isWashoverWarning = tidelineRelation === 'Below High Tideline/Washover Zone';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Wizard Header Progress Node Bar */}
      <div className="wizard-steps">
        {Array.from({ length: isTurtleEncounter ? 5 : 4 }, (_, i) => {
          const sNum = i + 1;
          return (
            <div 
              key={sNum} 
              className={`wizard-step-node ${step >= sNum ? (step > sNum ? 'completed' : 'active') : ''}`}
            >
              {sNum}
            </div>
          );
        })}
      </div>

      {/* STEP 1: TURTLE ENCOUNTER DETAILS (ONLY if isTurtleEncounter is true) */}
      {isTurtleEncounter && step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff' }}>Step 1: Sea Turtle Encounter Details</h3>
            
            {/* Caution/Instruction Banner */}
            <div style={{
              backgroundColor: 'rgba(255, 122, 89, 0.1)',
              border: '1px solid #ff7a59',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              fontSize: '0.8rem',
              lineHeight: '1.4'
            }}>
              <AlertCircle className="text-[#ff7a59]" style={{ flexShrink: 0, marginTop: '2px' }} size={18} />
              <div>
                <strong style={{ color: '#e6f1ff', display: 'block', marginBottom: '4px' }}>Safety & Conservation Protocol</strong>
                <p style={{ color: '#8892b0', margin: 0 }}>
                  To avoid interrupting nesting, <strong style={{ color: '#ff7a59' }}>only take measurements and check flipper tags after the turtle has finished nesting and is heading back to the ocean.</strong> Never shine white lights or camera flashes directly at the turtle's eyes. Use red light only.
                </p>
              </div>
            </div>

             {/* Photos section */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Turtle Photographs</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Camera size={16} />
                  Take Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={(e) => handlePhotoUpload(e, 'Sea Turtle')} 
                    style={{ display: 'none' }} 
                  />
                </label>
                <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Upload size={16} />
                  Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handlePhotoUpload(e, 'Sea Turtle')} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>

              {photos.filter(p => p.tag === 'Sea Turtle').length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {photos.filter(p => p.tag === 'Sea Turtle').map(p => (
                    <img 
                      key={p.id} 
                      src={p.dataUrl} 
                      alt="Sea Turtle" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--panel-border)' }} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Flipper tags */}
            <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.3)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Flipper Tag IDs</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', color: '#8892b0' }}>Left Flipper Tag</label>
                  <input 
                    type="text" 
                    value={flipperTagLeft}
                    onChange={(e) => setFlipperTagLeft(e.target.value)}
                    placeholder="e.g. ZZ-1234"
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '36px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', color: '#8892b0' }}>Right Flipper Tag</label>
                  <input 
                    type="text" 
                    value={flipperTagRight}
                    onChange={(e) => setFlipperTagRight(e.target.value)}
                    placeholder="e.g. ZZ-1235"
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '36px' }}
                  />
                </div>
              </div>
            </div>

            {/* Carapace measurements */}
            <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.3)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Carapace Measurements (cm)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', color: '#8892b0', whiteSpace: 'nowrap' }}>Notch-to-Notch</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={carapaceNotchToNotch}
                    onChange={(e) => setCarapaceNotchToNotch(e.target.value)}
                    placeholder="e.g. 98.5"
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '36px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', color: '#8892b0', whiteSpace: 'nowrap' }}>Notch-to-Tip</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={carapaceNotchToTip}
                    onChange={(e) => setCarapaceNotchToTip(e.target.value)}
                    placeholder="e.g. 101.2"
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '36px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', color: '#8892b0', whiteSpace: 'nowrap' }}>Widest Point</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={carapaceWidestPoint}
                    onChange={(e) => setCarapaceWidestPoint(e.target.value)}
                    placeholder="e.g. 85.0"
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '36px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-danger" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setStep(2)} style={{ flex: 1 }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1/2: INITIAL PHOTOS */}
      {((step === 1 && !isTurtleEncounter) || (step === 2 && isTurtleEncounter)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff', marginBottom: '8px' }}>
              {isTurtleEncounter ? 'Step 2: Initial Crawl Photos' : 'Step 1: Initial Crawl Photos'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#8892b0', marginBottom: '16px' }}>Capture photos of tracks and suspected body pit before probing.</p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', padding: '14px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Camera size={18} />
                Take Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={(e) => handlePhotoUpload(e, 'Initial Crawl')} 
                  style={{ display: 'none' }} 
                />
              </label>
              <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', padding: '14px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Upload size={18} />
                Upload Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoUpload(e, 'Initial Crawl')} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>

            {/* List uploaded photos */}
            {photos.filter(p => p.tag === 'Initial Crawl').length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                {photos.filter(p => p.tag === 'Initial Crawl').map(p => (
                  <img 
                    key={p.id} 
                    src={p.dataUrl} 
                    alt="Crawl Track" 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--panel-border)' }} 
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            {isTurtleEncounter ? (
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button className="btn btn-danger" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
            )}
            <button className="btn btn-primary" onClick={() => setStep(prev => prev + 1)} style={{ flex: 1 }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2/3: CRAWL DIAGNOSIS */}
      {((step === 2 && !isTurtleEncounter) || (step === 3 && isTurtleEncounter)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff', marginBottom: '16px' }}>Step 3: Crawl Type & Diagnosis</h3>
            
            {/* Toggle choice */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCrawlType('nest')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${crawlType === 'nest' ? '#64ffda' : 'rgba(48, 60, 85, 0.6)'}`,
                  backgroundColor: crawlType === 'nest' ? 'rgba(100, 255, 218, 0.1)' : 'rgba(2, 12, 27, 0.4)',
                  color: '#e6f1ff',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontFamily: 'Montserrat',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🐢</span>
                Nesting Crawl
              </button>
              <button 
                onClick={() => setCrawlType('false_crawl')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${crawlType === 'false_crawl' ? '#f4a261' : 'rgba(48, 60, 85, 0.6)'}`,
                  backgroundColor: crawlType === 'false_crawl' ? 'rgba(244, 162, 97, 0.1)' : 'rgba(2, 12, 27, 0.4)',
                  color: '#e6f1ff',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontFamily: 'Montserrat',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>✗</span>
                False Crawl
              </button>
            </div>

            {/* Probing checklist instructions */}
            <div className="glass-card" style={{ padding: '14px', borderLeft: '3px solid #f4a261', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#f4a261', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Probing & Chamber Search Checklist</h4>
                <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Probe grid area around suspected body pit using leg weight (never arms).</li>
                  <li>Find soft spot where probe suddenly gives way to cavity (chamber top).</li>
                  <li><strong>Dig carefully by hand only</strong> (no shovels) once soft spot is verified.</li>
                  <li>Feel for first egg to confirm nest chamber.</li>
                </ul>
              </div>

              <details style={{
                marginTop: '4px',
                borderTop: '1px solid rgba(244, 162, 97, 0.2)',
                paddingTop: '8px'
              }}>
                <summary style={{
                  fontSize: '0.78rem',
                  color: '#f4a261',
                  cursor: 'pointer',
                  fontWeight: '600',
                  outline: 'none',
                  userSelect: 'none',
                  display: 'list-item'
                }}>
                  Locating the Chamber via Crawl Anatomy
                </summary>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#8892b0',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  lineHeight: '1.4'
                }}>
                  <div>
                    <strong style={{ color: '#e6f1ff' }}>1. Locate the Primary Sand Mound:</strong>
                    Identify the large, heavy mound of dry sand that the turtle flung backward with her front flippers. The egg chamber is never in the middle of this high mound—it is located just in front of it (on the inland side).
                  </div>
                  <div>
                    <strong style={{ color: '#e6f1ff' }}>2. Pinpoint the Transition Zone:</strong>
                    Stand at the inland/leading edge of that thrown sand mound, right where it transitions into the shallower depression of the body pit. The egg chamber is typically centered horizontally between her final incoming and outgoing flipper marks in this specific zone.
                  </div>
                  <div>
                    <strong style={{ color: '#e6f1ff' }}>3. Probe GENTLY from the Edge Inward:</strong>
                    Using a standard, blunt-tipped nest probe, push vertically into the sand every few inches, moving from the known hard, undisturbed beach sand toward the soft, disturbed area. Listen and feel for a sudden change in resistance: the probe will drop easily through loose sand or into the top 1-2 inches of an air pocket when you hit the chamber. Stop immediately when the resistance drops to avoid puncturing eggs.
                  </div>
                  <div style={{ borderTop: '1px solid rgba(244, 162, 97, 0.2)', paddingTop: '6px', fontStyle: 'italic', fontSize: '0.72rem', color: '#f4a261' }}>
                    <strong>Pro Tip:</strong> Loggerhead egg chambers are usually shaped like a lightbulb or flask and sit roughly 10 to 18 inches (25–45 cm) below the surface of the undisturbed sand layer. If you are probing deeper than that without a change in resistance, you are likely off-center.
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(prev => prev + 1)}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3/4: SETUP & LOGGING */}
      {((step === 3 && !isTurtleEncounter) || (step === 4 && isTurtleEncounter)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* NEST FLOW */}
          {crawlType === 'nest' && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff' }}>Step 3: Nest Documentation</h3>

              {/* Coordinates check */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', display: 'block' }}>Nest Coordinates</strong>
                  <span style={{ fontSize: '0.95rem', color: '#e6f1ff', fontFamily: 'monospace' }}>
                    {coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : 'Acquiring GPS fix...'}
                  </span>
                </div>
                <MapPin className="text-[#64ffda]" />
              </div>

              {/* Relative to Tideline */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Position Relative to Tideline</label>
                <select 
                  value={tidelineRelation}
                  onChange={(e) => setTidelineRelation(e.target.value)}
                  className="form-select"
                >
                  <option value="Above High Tideline">Above High Tideline (Safe Zone)</option>
                  <option value="Below High Tideline/Washover Zone">Below High Tideline / Washover Zone</option>
                </select>
              </div>

              {/* Washover Risk Trigger warning */}
              {isWashoverWarning && (
                <div style={{
                  backgroundColor: 'rgba(255, 122, 89, 0.1)',
                  border: '1px solid #ff7a59',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <AlertTriangle className="text-[#ff7a59]" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#e6f1ff' }}><strong>High Washover Risk Warning!</strong> Nest is vulnerable to high tides. Consider relocating eggs.</span>
                </div>
              )}

              {/* In situ question */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nest Status</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setInSitu(true)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${inSitu ? '#64ffda' : 'var(--panel-border)'}`,
                      backgroundColor: inSitu ? 'rgba(100, 255, 218, 0.08)' : 'rgba(2, 12, 27, 0.2)',
                      color: inSitu ? '#64ffda' : '#8892b0',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    In Situ (Leave in sand)
                  </button>
                  <button 
                    onClick={() => setInSitu(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${!inSitu ? '#ff7a59' : 'var(--panel-border)'}`,
                      backgroundColor: !inSitu ? 'rgba(255, 122, 89, 0.08)' : 'rgba(2, 12, 27, 0.2)',
                      color: !inSitu ? '#ff7a59' : '#8892b0',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    Relocating Eggs
                  </button>
                </div>
              </div>

              {/* Relocation specific flow fields */}
              {isRelocationSelected && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#ff7a59' }}>
                  <h4 style={{ color: '#ff7a59', fontSize: '0.85rem', textTransform: 'uppercase' }}>Relocation Details</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Total Eggs Found</label>
                      <input 
                        type="number" 
                        step="1"
                        min="0"
                        value={totalEggCount}
                        onChange={(e) => setTotalEggCount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 112"
                        className="form-input"
                        style={{ height: '38px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Relocated Eggs</label>
                      <input 
                        type="number" 
                        step="1"
                        min="0"
                        value={relocatedEggCount}
                        onChange={(e) => setRelocatedEggCount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 110"
                        className="form-input"
                        style={{ height: '38px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', display: 'block' }}>Relocation Coordinates</strong>
                      <span style={{ fontSize: '0.85rem', color: '#e6f1ff', fontFamily: 'monospace' }}>
                        {relocationCoords ? `${relocationCoords.lat.toFixed(6)}, ${relocationCoords.lng.toFixed(6)}` : 'Capture at relocated nest site'}
                      </span>
                    </div>
                    <button 
                      onClick={handleCaptureRelocationCoords}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Log Coordinates
                    </button>
                  </div>
                </div>
              )}

              {/* DNA sample vial label checklist */}
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '15px' }}>
                <label className="form-label">DNR DNA Sample Collection</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>Nest Number (integer)</span>
                    <input 
                      type="number" 
                      step="1"
                      min="1"
                      value={nestNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNestNumber(val);
                        if (val) {
                          const yy = new Date().getFullYear().toString().slice(-2);
                          setDnaVialNumber(`${yy}-DAU-${val}`);
                        } else {
                          setDnaVialNumber('');
                        }
                      }}
                      placeholder="e.g. 84"
                      className="form-input"
                    />
                  </div>
                  {dnaVialNumber && (
                    <div style={{ fontSize: '0.8rem', color: '#64ffda', marginTop: '4px' }}>
                      <strong>Generated DNA Vial ID:</strong> {dnaVialNumber}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: '#8892b0', fontStyle: 'italic' }}>
                  Checklist: Remove 1 egg (or shell from broken egg). Label vial on side and cap top.
                </p>
              </div>

              {/* Equipment checklist items */}
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label" style={{ color: '#e6f1ff', fontSize: '0.9rem', fontWeight: '600' }}>Install Nest Equipment</label>
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                  <li>Center plastic mesh over chamber</li>
                  <li>Place 3 PVC poles in a triangle</li>
                  <li>Front PVC pole DNR sign numbered & legible</li>
                  <li>Secure metal cages (corners tight)</li>
                  <li>Wrap red tape around poles</li>
                </ul>
              </div>
            </div>
          )}

          {/* FALSE CRAWL FLOW */}
          {crawlType === 'false_crawl' && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff' }}>Step 3: False Crawl Documentation</h3>

              {/* Coordinates check */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', display: 'block' }}>GPS Coordinates</strong>
                  <span style={{ fontSize: '0.95rem', color: '#e6f1ff', fontFamily: 'monospace' }}>
                    {coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : 'Acquiring GPS fix...'}
                  </span>
                </div>
                <MapPin className="text-[#f4a261]" />
              </div>

              {/* Relative to Tideline */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Position Relative to Tideline</label>
                <select 
                  value={tidelineRelation}
                  onChange={(e) => setTidelineRelation(e.target.value)}
                  className="form-select"
                >
                  <option value="Above High Tideline">Above High Tideline</option>
                  <option value="Below High Tideline/Washover Zone">Below High Tideline / Washover Zone</option>
                </select>
              </div>

              {/* False crawl factors */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Possible Obstructive Factors</label>
                <select 
                  value={falseCrawlFactors}
                  onChange={(e) => setFalseCrawlFactors(e.target.value)}
                  className="form-select"
                >
                  <option value="Simple U-turn">Simple U-turn (None observed)</option>
                  <option value="Artificial White Lights">Artificial White Lights (LED/Flashlight)</option>
                  <option value="Human Disturbance">Human Disturbance (Walkers/Vehicles)</option>
                  <option value="Beach Debris / Driftwood">Beach Debris / Driftwood obstacle</option>
                  <option value="Seawall or Rock Revetment">Seawall or Rock Revetment barrier</option>
                  <option value="Predator Disturbance">Predator Disturbance (Dogs/Coyotes)</option>
                  <option value="Other">Other (Detail in Field Notes)</option>
                </select>
              </div>

              {/* Checkbox checks */}
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="form-checkbox">
                  <input type="checkbox" checked={crossedOut} onChange={(e) => setCrossedOut(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Cross out tracks in sand to indicate crawl was processed</span>
                </label>

                <label className="form-checkbox">
                  <input type="checkbox" checked={isPossibleNest} onChange={(e) => setIsPossibleNest(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ff7a59' }}>Mark as Possible Nest?</span>
                </label>

                {isPossibleNest && (
                  <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={markedPost} onChange={(e) => setMarkedPost(e.target.checked)} />
                      <span style={{ fontSize: '0.8rem', color: '#8892b0' }}>Marked possible nest site with PN pole</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(prev => prev + 1)}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4/5: CARDS & NOTES & FINALIZE */}
      {((step === 4 && !isTurtleEncounter) || (step === 5 && isTurtleEncounter)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff' }}>
              {crawlType === 'nest' 
                ? `Step ${isTurtleEncounter ? 5 : 4}: Finalize Nest Card` 
                : `Step ${isTurtleEncounter ? 5 : 4}: Finalize Crawl Card`}
            </h3>

            {/* Nest card confirmation */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-checkbox">
                <input type="checkbox" checked={nestCardDone} onChange={(e) => setNestCardDone(e.target.checked)} />
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                  {crawlType === 'nest' ? 'Nest Card Completed Neatly & Fully' : 'Crawl Card Completed Neatly & Fully'}
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8892b0', width: '80px', flexShrink: 0 }}>Card Front:</span>
                  <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Camera size={12} /> Camera
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Front')} style={{ display: 'none' }} />
                  </label>
                  <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Upload size={12} /> Upload
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Front')} style={{ display: 'none' }} />
                  </label>
                </div>

                {crawlType === 'nest' && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8892b0', width: '80px', flexShrink: 0 }}>Card Back:</span>
                    <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Camera size={12} /> Camera
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Back')} style={{ display: 'none' }} />
                    </label>
                    <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Back')} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {crawlType === 'nest' && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', borderTop: '1px dashed rgba(48, 60, 85, 0.3)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8892b0', width: '80px', flexShrink: 0 }}>Nest Photo:</span>
                    <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Camera size={12} /> Camera
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Protected Nest Photo')} style={{ display: 'none' }} />
                    </label>
                    <label className="btn btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'Protected Nest Photo')} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>

              {/* Show selected cards/photos previews */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', borderTop: '1px solid rgba(48, 60, 85, 0.2)', paddingTop: '8px' }}>
                  {photos.filter(p => p.tag.includes('Nest Card') || p.tag.includes('Protected Nest')).map(p => (
                    <div key={p.id} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={p.dataUrl} alt={p.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: '0.5rem', background: 'rgba(2,12,27,0.8)', color: '#64ffda', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.tag.replace('Nest Card - ', '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observations & Field Notes</label>
              <textarea 
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Raccoon tracks nearby. High tides washing close."
                className="form-textarea"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={handleSave} style={{ backgroundColor: '#64ffda', color: '#020c1b' }}>
              <Save size={16} /> Save Crawl Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
