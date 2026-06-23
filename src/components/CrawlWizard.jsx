import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckSquare, ArrowRight, ArrowLeft, Save, AlertTriangle, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function CrawlWizard({ activeCoords, onSaveCrawl, onCancel }) {
  const [step, setStep] = useState(1);
  const [crawlType, setCrawlType] = useState('nest'); // 'nest' or 'false_crawl'
  
  // Form State
  const [photos, setPhotos] = useState([]);
  const [tidelineRelation, setTidelineRelation] = useState('Above High Tideline');
  const [inSitu, setInSitu] = useState(true);
  const [dnaVialNumber, setDnaVialNumber] = useState('');
  
  // Relocation specific states
  const [relocationCoords, setRelocationCoords] = useState(null);
  const [eggCount, setEggCount] = useState('');

  // Equipment Checklist
  const [meshChecked, setMeshChecked] = useState(false);
  const [polesChecked, setPolesChecked] = useState(false);
  const [dnrSignChecked, setDnrSignChecked] = useState(false);
  const [cageChecked, setCageChecked] = useState(false);
  const [tapeChecked, setTapeChecked] = useState(false);

  // False Crawl state
  const [falseCrawlFactors, setFalseCrawlFactors] = useState('Simple U-turn');
  const [crossedOut, setCrossedOut] = useState(false);
  const [isPossibleNest, setIsPossibleNest] = useState(false);
  const [markedPost, setMarkedPost] = useState(false);

  const [notes, setNotes] = useState('');
  const [nestCardDone, setNestCardDone] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

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
      setPhotos([...photos, {
        id: Date.now().toString(),
        dataUrl: event.target.result,
        tag: tag
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureRelocationCoords = () => {
    if (activeCoords) {
      setRelocationCoords(activeCoords);
    }
  };

  const handleSave = () => {
    // Validate core checklists
    if (crawlType === 'nest') {
      const equipmentInstalled = meshChecked && polesChecked && dnrSignChecked && cageChecked && tapeChecked;
      
      onSaveCrawl({
        type: 'nest',
        timestamp: new Date().toISOString(),
        coordinates,
        photos,
        tidelineRelation,
        inSitu,
        dnaVialNumber,
        equipmentInstalled,
        relocationCoords: !inSitu ? relocationCoords : null,
        eggCount: !inSitu ? eggCount : null,
        nestCardDone,
        notes
      });
    } else {
      onSaveCrawl({
        type: 'false_crawl',
        timestamp: new Date().toISOString(),
        coordinates,
        photos,
        tidelineRelation,
        falseCrawlFactors,
        crossedOut,
        isPossibleNest,
        markedPost: isPossibleNest ? markedPost : false,
        nestCardDone,
        notes
      });
    }
  };

  const isRelocationSelected = !inSitu && crawlType === 'nest';
  const isWashoverWarning = tidelineRelation === 'Below High Tideline/Washover Zone';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Wizard Header Progress Node Bar */}
      <div className="wizard-steps">
        <div className={`wizard-step-node ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>1</div>
        <div className={`wizard-step-node ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>2</div>
        <div className={`wizard-step-node ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}`}>3</div>
        <div className={`wizard-step-node ${step >= 4 ? (step > 4 ? 'completed' : 'active') : ''}`}>4</div>
      </div>

      {/* STEP 1: INITIAL PHOTOS & PREDICTOR */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff', marginBottom: '8px' }}>Step 1: Initial Crawl Photos</h3>
            <p style={{ fontSize: '0.8rem', color: '#8892b0', marginBottom: '16px' }}>Capture photos of tracks and suspected body pit before probing.</p>
            
            <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', padding: '16px', borderRadius: '12px' }}>
              <Camera size={20} />
              Take Track/Body Pit Photo
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => handlePhotoUpload(e, 'Initial Crawl')} 
                style={{ display: 'none' }} 
              />
            </label>

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
            <button className="btn btn-danger" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setStep(2)} style={{ flex: 1 }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CRAWL DIAGNOSIS */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff', marginBottom: '16px' }}>Step 2: Crawl Type & Diagnosis</h3>
            
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
            <div className="glass-card" style={{ padding: '14px', borderLeft: '3px solid #f4a261' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#f4a261', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Probing & Chamber Search Checklist</h4>
              <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Probe grid area around suspected body pit using leg weight (never arms).</li>
                <li>Find soft spot where probe suddenly gives way to cavity (chamber top).</li>
                <li><strong>Dig carefully by hand only</strong> (no shovels) once soft spot is verified.</li>
                <li>Feel for first egg to confirm nest chamber.</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SETUP & LOGGING */}
      {step === 3 && (
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
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Number of Relocated Eggs</label>
                    <input 
                      type="number" 
                      value={eggCount}
                      onChange={(e) => setEggCount(e.target.value)}
                      placeholder="e.g. 112"
                      className="form-input"
                    />
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
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    value={dnaVialNumber}
                    onChange={(e) => setDnaVialNumber(e.target.value)}
                    placeholder="Enter DNA research vial number"
                    className="form-input"
                  />
                </div>
                <p style={{ fontSize: '0.7rem', color: '#8892b0', fontStyle: 'italic' }}>
                  Checklist: Remove 1 egg (or shell from broken egg). Label vial on side and cap top.
                </p>
              </div>

              {/* Equipment checklist items */}
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Protection Equipment Installed</label>
                
                <label className="form-checkbox">
                  <input type="checkbox" checked={meshChecked} onChange={(e) => setMeshChecked(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Center plastic mesh over chamber</span>
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" checked={polesChecked} onChange={(e) => setPolesChecked(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Place 3 PVC poles in a triangle</span>
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" checked={dnrSignChecked} onChange={(e) => setDnrSignChecked(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Front PVC pole DNR sign numbered & legible</span>
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" checked={cageChecked} onChange={(e) => setCageChecked(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Secure metal cages (corners tight)</span>
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" checked={tapeChecked} onChange={(e) => setTapeChecked(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem' }}>Wrap red tape around poles</span>
                </label>
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
                  <span style={{ fontSize: '0.85rem' }}>Cross out tracks in sand (marks track as counted)</span>
                </label>

                <label className="form-checkbox">
                  <input type="checkbox" checked={isPossibleNest} onChange={(e) => setIsPossibleNest(e.target.checked)} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ff7a59' }}>Mark as Possible Nest?</span>
                </label>

                {isPossibleNest && (
                  <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={markedPost} onChange={(e) => setMarkedPost(e.target.checked)} />
                      <span style={{ fontSize: '0.8rem', color: '#8892b0' }}>Marked nest site with a warning post/stake</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CARDS & NOTES & FINALIZE */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#e6f1ff' }}>
              {crawlType === 'nest' ? 'Step 4: Finalize Nest Card' : 'Step 4: Finalize Crawl Card'}
            </h3>

            {/* Nest card confirmation */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-checkbox">
                <input type="checkbox" checked={nestCardDone} onChange={(e) => setNestCardDone(e.target.checked)} />
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                  {crawlType === 'nest' ? 'Nest Card Completed Neatly & Fully' : 'Crawl Card Completed Neatly & Fully'}
                </span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <label className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <Camera size={14} /> Card Front
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Front')} style={{ display: 'none' }} />
                </label>
                {crawlType === 'nest' && (
                  <label className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <Camera size={14} /> Card Back
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Nest Card - Back')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Equipment Setup Photo */}
              {crawlType === 'nest' && (
                <label className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px' }}>
                  <Camera size={14} /> Setup Final Photo
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, 'Nest Final Setup')} style={{ display: 'none' }} />
                </label>
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
            <button className="btn btn-secondary" onClick={() => setStep(3)}>
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
