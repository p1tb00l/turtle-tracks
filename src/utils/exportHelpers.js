/**
 * Utility functions for exporting beach monitoring session data.
 */

// Helper to convert meters to miles
function metersToMiles(meters) {
  return (meters * 0.000621371).toFixed(2);
}

// Helper to format duration in seconds to MM:SS or HH:MM:SS
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? h : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].filter(Boolean).join(':');
}

/**
 * Generates a clean text/markdown summary of the session.
 */
export function generateTextSummary(session) {
  const date = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const startTimeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress';
  const durationStr = formatDuration(session.duration || 0);
  const distMiles = metersToMiles(session.distance || 0);

  let text = `=========================================\n`;
  text += `   TURTLETRACKS BEACH MONITORING REPORT  \n`;
  text += `=========================================\n`;
  text += `Date: ${date}\n`;
  text += `Location: ${session.locationName || 'Daufuskie Island'}\n`;
  text += `Time: ${startTimeStr} - ${endTimeStr} (${durationStr})\n`;
  text += `Distance Tracked: ${distMiles} miles\n`;
  if (session.weather) {
    text += `Weather: ${session.weather}\n`;
  }
  if (session.tides) {
    text += `Tides: ${session.tides}\n`;
  }
  if (session.notes) {
    text += `Patrol Notes: ${session.notes}\n`;
  }
  text += `-----------------------------------------\n`;
  text += `SUMMARY:\n`;
  text += `  Total Crawls Detected: ${session.crawls?.length || 0}\n`;
  
  const nests = session.crawls?.filter(c => c.type === 'nest') || [];
  const falseCrawls = session.crawls?.filter(c => c.type === 'false_crawl') || [];
  
  text += `  - Confirmed Nests: ${nests.length}\n`;
  text += `  - False Crawls: ${falseCrawls.length}\n`;
  text += `=========================================\n\n`;

  if (session.crawls && session.crawls.length > 0) {
    text += `DETAILED CRAWL LOGS:\n\n`;
    session.crawls.forEach((crawl, idx) => {
      text += `CRAWL #${idx + 1} - [${crawl.type === 'nest' ? 'NESTING CRAWL' : 'FALSE CRAWL'}]\n`;
      text += `Time Logged: ${new Date(crawl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
      text += `GPS Coordinates: ${crawl.coordinates?.lat.toFixed(6)}, ${crawl.coordinates?.lng.toFixed(6)}\n`;
      text += `Relative to Tideline: ${crawl.tidelineRelation || 'Not recorded'}\n`;
      
      if (crawl.type === 'nest') {
        text += `Is Nest In Situ?: ${crawl.inSitu ? 'Yes' : 'No (Relocated)'}\n`;
        if (!crawl.inSitu && crawl.relocationCoords) {
          text += `  Relocation GPS: ${crawl.relocationCoords.lat.toFixed(6)}, ${crawl.relocationCoords.lng.toFixed(6)}\n`;
          if (crawl.totalEggCount !== undefined && crawl.totalEggCount !== null) {
            text += `  Total Eggs Found: ${crawl.totalEggCount}\n`;
            text += `  Relocated Eggs: ${crawl.relocatedEggCount}\n`;
          } else {
            text += `  Relocated Eggs Count: ${crawl.eggCount || 'Not specified'}\n`;
          }
        }
        text += `DNA Vial Sample: ${crawl.dnaVialNumber ? 'Collected (Vial #' + crawl.dnaVialNumber + ')' : 'Not collected/broken'}\n`;
        text += `Nest Card Completed: ${crawl.nestCardDone ? 'Yes' : 'No'}\n`;
        text += `Protective Equipment Installed: ${crawl.equipmentInstalled ? 'Yes' : 'No'}\n`;
      } else {
        text += `False Crawl Factors: ${crawl.falseCrawlFactors || 'None observed'}\n`;
        text += `Crawl Crossed Out: ${crawl.crossedOut ? 'Yes' : 'No'}\n`;
        text += `Is Possible Nest?: ${crawl.isPossibleNest ? 'Yes' : 'No'}\n`;
      }
      
      if (crawl.notes) {
        text += `Notes: ${crawl.notes}\n`;
      }
      text += `Photos Attached: ${crawl.photos?.length || 0}\n`;
      text += `-----------------------------------------\n\n`;
    });
  } else {
    text += `No crawls logged during this session.\n`;
  }
  
  return text;
}

/**
 * Triggers browser download of a file.
 */
export function downloadFile(content, fileName, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Exports session data to a CSV string.
 */
export function exportToCSV(session) {
  let csv = 'Crawl Number,Type,Timestamp,Latitude,Longitude,Tideline Relation,In Situ,Relocation Lat,Relocation Lng,Total Eggs,Relocated Eggs,DNA Vial,Equipment Installed,False Crawl Factors,Is Possible Nest,Notes\n';
  
  if (session.crawls) {
    session.crawls.forEach((c, idx) => {
      const row = [
        idx + 1,
        c.type === 'nest' ? 'Nest' : 'False Crawl',
        new Date(c.timestamp).toISOString(),
        c.coordinates?.lat || '',
        c.coordinates?.lng || '',
        `"${c.tidelineRelation || ''}"`,
        c.inSitu !== undefined ? c.inSitu : '',
        c.relocationCoords?.lat || '',
        c.relocationCoords?.lng || '',
        c.totalEggCount !== undefined && c.totalEggCount !== null ? c.totalEggCount : (c.eggCount || ''),
        c.relocatedEggCount !== undefined && c.relocatedEggCount !== null ? c.relocatedEggCount : '',
        c.dnaVialNumber || '',
        c.equipmentInstalled || '',
        `"${c.falseCrawlFactors || ''}"`,
        c.isPossibleNest || '',
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });
  }
  
  return csv;
}

/**
 * Generates an interactive, beautiful HTML file including embedded Base64 photos.
 */
export function exportToHTML(session) {
  const dateStr = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const startTimeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress';
  const durationStr = formatDuration(session.duration || 0);
  const distMiles = metersToMiles(session.distance || 0);
  const nests = session.crawls?.filter(c => c.type === 'nest') || [];
  const falseCrawls = session.crawls?.filter(c => c.type === 'false_crawl') || [];
  const textSummary = generateTextSummary(session);
  
  let crawlsHtml = '';
  if (session.crawls && session.crawls.length > 0) {
    session.crawls.forEach((crawl, idx) => {
      const isNest = crawl.type === 'nest';
      
      let photoGrid = '';
      if (crawl.photos && crawl.photos.length > 0) {
        photoGrid = '<div class="photo-grid">';
        crawl.photos.forEach(photo => {
          photoGrid += `
            <div class="photo-card">
              <img src="${photo.dataUrl}" alt="${photo.tag || 'Crawl Photo'}" />
              <div class="photo-tag">${photo.tag || 'Photo'}</div>
            </div>
          `;
        });
        photoGrid += '</div>';
      }

      crawlsHtml += `
        <div class="crawl-card ${isNest ? 'nest-card' : 'false-crawl-card'}">
          <div class="crawl-header">
            <h3>Crawl #${idx + 1} &mdash; ${isNest ? 'Confirmed Nest' : 'False Crawl'}</h3>
            <span class="badge ${isNest ? 'badge-nest' : 'badge-false'}">
              ${isNest ? 'Nest' : 'False Crawl'}
            </span>
          </div>
          
          <div class="meta-grid">
            <div><strong>Logged At:</strong> ${new Date(crawl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>GPS Coordinates:</strong> ${crawl.coordinates?.lat.toFixed(6)}, ${crawl.coordinates?.lng.toFixed(6)}</div>
            <div><strong>Tideline Position:</strong> ${crawl.tidelineRelation || 'Not Specified'}</div>
            ${isNest ? `
              <div><strong>In Situ:</strong> ${crawl.inSitu ? 'Yes' : 'No (Relocated)'}</div>
              ${!crawl.inSitu && crawl.relocationCoords ? `
                <div><strong>Relocation Coordinates:</strong> ${crawl.relocationCoords.lat.toFixed(6)}, ${crawl.relocationCoords.lng.toFixed(6)}</div>
                ${crawl.totalEggCount !== undefined && crawl.totalEggCount !== null ? `
                  <div><strong>Total Eggs Found:</strong> ${crawl.totalEggCount}</div>
                  <div><strong>Relocated Eggs:</strong> ${crawl.relocatedEggCount}</div>
                ` : `
                  <div><strong>Egg Count:</strong> ${crawl.eggCount || 'Not specified'}</div>
                `}
              ` : ''}
              <div><strong>DNA Vial:</strong> ${crawl.dnaVialNumber ? 'Vial #' + crawl.dnaVialNumber : 'Not collected'}</div>
              <div><strong>Protective Cage/Mesh:</strong> ${crawl.equipmentInstalled ? 'Installed' : 'Not installed'}</div>
            ` : `
              <div><strong>Factors:</strong> ${crawl.falseCrawlFactors || 'None logged'}</div>
              <div><strong>Crossed Out:</strong> ${crawl.crossedOut ? 'Yes' : 'No'}</div>
              <div><strong>Is Possible Nest?:</strong> ${crawl.isPossibleNest ? 'Yes' : 'No'}</div>
            `}
          </div>

          ${crawl.notes ? `<div class="notes-box"><strong>Notes:</strong> ${crawl.notes}</div>` : ''}
          ${photoGrid}
        </div>
      `;
    });
  } else {
    crawlsHtml = '<p class="no-crawls">No crawls logged during this session.</p>';
  }

  // Create HTML report file content
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TurtleTracks Report - ${dateStr}</title>
  <style>
    :root {
      --bg: #0a192f;
      --panel: #172a45;
      --text: #8892b0;
      --text-bright: #e6f1ff;
      --accent: #64ffda;
      --sand: #f4a261;
      --coral: #e76f51;
      --border: #303c55;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--panel);
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 10px 30px -15px rgba(2,12,27,0.7);
      padding: 30px;
    }
    h1, h2, h3 {
      font-family: 'Montserrat', sans-serif;
      color: var(--text-bright);
      margin-top: 0;
    }
    h1 {
      border-bottom: 2px solid var(--border);
      padding-bottom: 15px;
      font-size: 2rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .accent-text {
      color: var(--accent);
    }
    .session-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      background: rgba(2, 12, 27, 0.3);
      padding: 15px;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 30px;
    }
    .session-meta div {
      font-size: 0.95rem;
    }
    .session-meta strong {
      color: var(--text-bright);
    }
    .crawl-card {
      background: rgba(2, 12, 27, 0.4);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      transition: border-color 0.2s;
    }
    .crawl-card:hover {
      border-color: var(--accent);
    }
    .nest-card {
      border-left: 5px solid var(--accent);
    }
    .false-crawl-card {
      border-left: 5px solid var(--sand);
    }
    .crawl-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px dashed var(--border);
      padding-bottom: 10px;
    }
    .crawl-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }
    .badge-nest {
      background-color: rgba(100, 255, 218, 0.1);
      color: var(--accent);
      border: 1px solid var(--accent);
    }
    .badge-false {
      background-color: rgba(244, 162, 97, 0.1);
      color: var(--sand);
      border: 1px solid var(--sand);
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 10px;
      margin-bottom: 15px;
    }
    .meta-grid div {
      font-size: 0.9rem;
    }
    .meta-grid strong {
      color: var(--text-bright);
    }
    .notes-box {
      background: rgba(2, 12, 27, 0.2);
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 0.9rem;
      border: 1px solid rgba(48, 60, 85, 0.4);
      margin-bottom: 15px;
      color: var(--text-bright);
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .photo-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .photo-card img {
      width: 100%;
      height: 140px;
      object-fit: cover;
      border-bottom: 1px solid var(--border);
    }
    .photo-tag {
      padding: 6px 10px;
      font-size: 0.75rem;
      text-align: center;
      font-weight: 500;
      background: rgba(2, 12, 27, 0.2);
      color: var(--accent);
    }
    .no-crawls {
      text-align: center;
      padding: 40px;
      font-style: italic;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 0.8rem;
      border-top: 1px solid var(--border);
      padding-top: 20px;
    }
    @media print {
      body {
        background-color: #fff;
        color: #333;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      h1, h2, h3 {
        color: #111;
      }
      h1 {
        border-bottom: 2px solid #333;
      }
      .session-meta, .crawl-card, .notes-box {
        border: 1px solid #ccc;
        background: #fff;
      }
      .crawl-card {
        page-break-inside: avoid;
      }
      .photo-card {
        border: 1px solid #ccc;
        page-break-inside: avoid;
      }
      .photo-card img {
        filter: grayscale(100%);
      }
      .badge-nest, .badge-false {
        background: none;
        color: #333;
        border: 1px solid #333;
      }
      .footer {
        color: #777;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>TurtleTracks <span class="accent-text">Report</span></h1>
    
    <div class="session-meta">
      <div><strong>Date:</strong> ${dateStr}</div>
      <div><strong>Beach Location:</strong> ${session.locationName || 'Daufuskie Island'}</div>
      <div><strong>Time Period:</strong> ${startTimeStr} - ${endTimeStr}</div>
      <div><strong>Duration Walked:</strong> ${durationStr}</div>
      <div><strong>Distance:</strong> ${distMiles} miles</div>
      <div><strong>Nests Found:</strong> ${nests.length}</div>
      <div><strong>False Crawls:</strong> ${falseCrawls.length}</div>
      ${session.weather ? `<div><strong>Weather:</strong> ${session.weather}</div>` : ''}
      ${session.tides ? `<div style="grid-column: 1 / -1; border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 4px;"><strong>Tides:</strong> ${session.tides}</div>` : ''}
    </div>
    
    ${session.notes ? `
    <div class="notes-box" style="margin-top: -15px; margin-bottom: 30px;">
      <strong>Patrol Notes:</strong> ${session.notes}
    </div>
    ` : ''}

    <h2>Activity Logs</h2>
    ${crawlsHtml}
    
    <div class="footer">
      Generated automatically by TurtleTracks &bull; Sea Turtle Nest Logger Mobile PWA &bull; Daufuskie Island, SC
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Creates a pre-filled mailto URL for sending reports via email.
 */
export function generateMailtoLink(session) {
  const subject = encodeURIComponent(`TurtleTracks Report - ${new Date(session.startTime).toLocaleDateString()} - ${session.locationName || 'Daufuskie Island'}`);
  const summaryText = generateTextSummary(session);
  const body = encodeURIComponent(
    `Hi team,\n\nHere is the beach monitoring report for Daufuskie Island:\n\n${summaryText}\n\nSent from TurtleTracks mobile app.`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}
