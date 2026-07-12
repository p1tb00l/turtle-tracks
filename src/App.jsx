import React, { useState } from 'react';
import Layout from './components/Layout';
import ActiveSession from './components/ActiveSession';
import QuickCamera from './components/QuickCamera';
import GPSViewer from './components/GPSViewer';
import Guide from './components/Guide';
import SessionLibrary from './components/SessionLibrary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { idb } from './utils/idb';

function App() {
  const [currentTab, setCurrentTab] = useState('session');
  
  // Active in-progress beach session
  const [activeSession, setActiveSession, activeSessionLoaded] = useLocalStorage('turtletracks_active_session', null);
  
  // Library of completed sessions
  const [sessions, setSessions, sessionsLoaded] = useLocalStorage('turtletracks_sessions', []);

  // Preload a mock photo for testing/demo if roll is empty
  React.useEffect(() => {
    async function preloadQuickCam() {
      try {
        const existing = await idb.get('turtletracks_quickcam');
        if (!existing || existing.length === 0) {
          await idb.set('turtletracks_quickcam', [
            {
              id: 'test-photo-id',
              tag: 'Egg Specimen',
              dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
              notes: 'Mock egg specimen captured on Melrose Beach.'
            }
          ]);
        }
      } catch (e) {
        console.error("Failed to preload mock quickcam photo:", e);
      }
    }
    preloadQuickCam();
  }, []);

  // Automatic migration: de-duplicate any completed session logs sharing the same ID
  React.useEffect(() => {
    if (sessionsLoaded && sessions && sessions.length > 0) {
      let hasDuplicates = false;
      const seenIds = new Set();
      const updatedSessions = [];

      for (let i = sessions.length - 1; i >= 0; i--) {
        const session = sessions[i];
        let originalId = session.id;
        if (!originalId) {
          const dateStr = session.startTime ? new Date(session.startTime).toISOString().slice(0, 10).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
          originalId = `${dateStr}-01`;
        }

        let cleanId = originalId;
        let seq = 1;
        const match = originalId.match(/^(\d{8})-(\d+)$/);
        const prefix = match ? match[1] : originalId;

        while (seenIds.has(cleanId)) {
          hasDuplicates = true;
          seq++;
          cleanId = `${prefix}-${String(seq).padStart(2, '0')}`;
        }
        seenIds.add(cleanId);
        
        if (cleanId !== session.id) {
          updatedSessions.unshift({ ...session, id: cleanId });
        } else {
          updatedSessions.unshift(session);
        }
      }

      if (hasDuplicates) {
        console.log("De-duplicated sessions list and updated IDs:", updatedSessions.map(s => s.id));
        setSessions(updatedSessions);
      }
    }
  }, [sessionsLoaded]);

  const handleSessionComplete = (newSession) => {
    const updated = [newSession, ...sessions];
    if (updated.length > 10) {
      // Sort sessions by startTime descending to keep the newest ones
      const sorted = [...updated].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
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
      setSessions(truncated);
    } else {
      setSessions(updated);
    }
    // Switch to Library tab to view/export the session report
    setCurrentTab('library');
  };

  if (!activeSessionLoaded || !sessionsLoaded) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#020c1b',
        color: '#64ffda',
        gap: '15px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(100, 255, 218, 0.1)',
          borderTopColor: '#64ffda',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.9rem', color: '#8892b0', fontFamily: 'monospace' }}>Restoring local database...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'session' && (
        <ActiveSession 
          activeSession={activeSession} 
          setActiveSession={setActiveSession}
          onSessionComplete={handleSessionComplete}
          sessions={sessions}
          onNavigate={setCurrentTab}
        />
      )}
      
      {currentTab === 'camera' && (
        <QuickCamera />
      )}
      
      {currentTab === 'gps' && (
        <GPSViewer />
      )}
      
      {currentTab === 'guide' && (
        <Guide />
      )}
      
      {currentTab === 'library' && (
        <SessionLibrary 
          sessions={sessions} 
          setSessions={setSessions}
        />
      )}
    </Layout>
  );
}

export default App;
