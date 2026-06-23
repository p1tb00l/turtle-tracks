import React, { useState, useEffect } from 'react';
import { Waves, Camera, Compass, BookOpen, FolderOpen, Wifi, WifiOff } from 'lucide-react';

export default function Layout({ currentTab, setCurrentTab, children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const TABS = [
    { id: 'session', label: 'Beach Session', icon: Waves },
    { id: 'camera', label: 'Quick Cam', icon: Camera },
    { id: 'gps', label: 'Nest GPS', icon: Compass },
    { id: 'guide', label: 'Field Guide', icon: BookOpen },
    { id: 'library', label: 'Sessions', icon: FolderOpen }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Waves className="w-5 h-5 text-[#64ffda]" style={{ color: '#64ffda' }} />
          <span className="app-title">TurtleTracks</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '0.75rem',
            color: isOnline ? '#64ffda' : '#ff7a59',
            backgroundColor: isOnline ? 'rgba(100, 255, 218, 0.08)' : 'rgba(255, 122, 89, 0.08)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: `1.5px solid ${isOnline ? 'rgba(100, 255, 218, 0.2)' : 'rgba(255, 122, 89, 0.2)'}`,
            fontWeight: '600'
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={12} />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>OFFLINE</span>
            </>
          )}
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      <nav className="bottom-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={tab.label}
            >
              <Icon size={20} />
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
