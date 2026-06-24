import React, { useState } from 'react';
import Layout from './components/Layout';
import ActiveSession from './components/ActiveSession';
import QuickCamera from './components/QuickCamera';
import GPSViewer from './components/GPSViewer';
import Guide from './components/Guide';
import SessionLibrary from './components/SessionLibrary';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [currentTab, setCurrentTab] = useState('session');
  
  // Active in-progress beach session
  const [activeSession, setActiveSession] = useLocalStorage('turtletracks_active_session', null);
  
  // Library of completed sessions
  const [sessions, setSessions] = useLocalStorage('turtletracks_sessions', []);

  // Preload a mock photo for testing/demo if roll is empty
  React.useEffect(() => {
    const existing = localStorage.getItem('turtletracks_quickcam');
    if (!existing || existing === '[]') {
      localStorage.setItem('turtletracks_quickcam', JSON.stringify([
        {
          id: 'test-photo-id',
          tag: 'Egg Specimen',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          notes: 'Mock egg specimen captured on Melrose Beach.'
        }
      ]));
    }
  }, []);

  const handleSessionComplete = (newSession) => {
    setSessions([newSession, ...sessions]);
    // Switch to Library tab to view/export the session report
    setCurrentTab('library');
  };

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
