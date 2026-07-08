import { useState } from 'react';
import { Camera, Trash2, Eye, Upload, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function QuickCamera() {
  const [photos, setPhotos] = useLocalStorage('turtletracks_quickcam', []);
  const [currentTag, setCurrentTag] = useState('Crawl Tracks');
  const [currentNotes, setCurrentNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  const TAGS = ['Crawl Tracks', 'Nest Setup', 'Nest Card', 'Egg Specimen', 'Nest Predation', 'Other Details'];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // Resize to a maximum of 800px to drastically reduce base64 size
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Add watermark (tag, comments, timestamp) similar to Sessions tab
          const timestamp = new Date().toISOString();
          const textParts = [new Date(timestamp).toLocaleString()];
          if (currentNotes) textParts.push(`Notes: ${currentNotes}`);
          const subtitleText = textParts.join(' | ');

          // Configure font styles to calculate wraps
          const titleFontSize = Math.max(14, Math.round(canvas.height * 0.024));
          const bodyFontSize = Math.max(11, Math.round(canvas.height * 0.018));
          const lineSpacing = Math.round(bodyFontSize * 0.3);
          const padding = Math.max(10, Math.round(canvas.width * 0.03));
          const maxWidth = canvas.width - (padding * 2);

          // Calculate notes wrapping lines
          ctx.font = `${bodyFontSize}px sans-serif`;
          const words = subtitleText.split(' ');
          const lines = [];
          let currentLine = '';

          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }

          // Draw dynamic size banner background
          const bannerHeight = titleFontSize + (lines.length * (bodyFontSize + lineSpacing)) + (padding * 2);
          ctx.fillStyle = 'rgba(2, 12, 27, 0.82)';
          ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);
          
          // Draw Title / Tag
          ctx.font = `600 ${titleFontSize}px sans-serif`;
          ctx.fillStyle = '#64ffda';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          const tagText = `${currentTag || 'Field Log'}`.toUpperCase();
          ctx.fillText(tagText, padding, canvas.height - bannerHeight + padding);
          
          // Draw Wrapped Notes Lines
          ctx.font = `${bodyFontSize}px sans-serif`;
          ctx.fillStyle = '#8892b0';
          let currentY = canvas.height - bannerHeight + padding + titleFontSize + lineSpacing + 4;
          
          for (let j = 0; j < lines.length; j++) {
            ctx.fillText(lines[j], padding, currentY);
            currentY += bodyFontSize + lineSpacing;
          }

          // Compress to JPEG with 0.7 quality to target 30-50KB size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          const newPhoto = {
            id: Date.now().toString(),
            dataUrl: compressedDataUrl,
            tag: currentTag,
            notes: currentNotes,
            timestamp: timestamp
          };
          setPhotos([newPhoto, ...photos]);
          setCurrentNotes('');
          setSelectedPhoto(newPhoto);
        } catch (err) {
          console.error("Quick camera photo compression failed, using fallback:", err);
          const newPhoto = {
            id: Date.now().toString(),
            dataUrl: event.target.result,
            tag: currentTag,
            notes: currentNotes,
            timestamp: new Date().toISOString()
          };
          setPhotos([newPhoto, ...photos]);
          setCurrentNotes('');
          setSelectedPhoto(newPhoto);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id) => {
    setPhotos(photos.filter(p => p.id !== id));
    if (selectedPhoto && selectedPhoto.id === id) {
      setSelectedPhoto(null);
    }
  };

  const handleDownloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `${photo.tag.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Modal Preview */}
      {selectedPhoto && (
        <div className="glass-panel" style={{ padding: '20px', border: '1.5px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: '#e6f1ff' }}>Image Analysis Preview</h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => { setSelectedPhoto(null); }}
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

          </div>

          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div><strong>Tag:</strong> <span style={{ color: '#64ffda' }}>{selectedPhoto.tag}</span></div>
              {selectedPhoto.notes && <div style={{ marginTop: '4px' }}><strong>Comments:</strong> {selectedPhoto.notes}</div>}
              <div style={{ marginTop: '4px', fontSize: '0.75rem' }}><strong>Logged:</strong> {new Date(selectedPhoto.timestamp).toLocaleString()}</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleDownloadPhoto(selectedPhoto)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Download size={16} /> Download Photo to Device
            </button>
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
                      onClick={() => { setSelectedPhoto(p); }}
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
