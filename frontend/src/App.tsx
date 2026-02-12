import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Documents } from './components/Documents';
import { RulesEngine } from './components/RulesEngine';
import { Violations } from './components/Violations';
import { AuditTrail } from './components/AuditTrail';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Helper to sync Sidebar with Location
  const LocationSyncer = ({ setTab }: { setTab: (t: string) => void }) => {
    const location = useLocation();
    useEffect(() => {
      const path = location.pathname.replace('/', '') || 'dashboard';
      setTab(path);
    }, [location, setTab]);
    return null;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex transition-colors duration-300`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&family=JetBrains+Mono&display=swap');
          
          :root {
            --font-outfit: 'Outfit', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
          }

          h1, h2, h3, h4, .font-heading {
            font-family: var(--font-outfit);
          }
          
          pre, code, .font-mono {
            font-family: var(--font-mono);
          }
          
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      <LocationSyncer setTab={setActiveTab} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header activeTab={activeTab} />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/rules" element={<RulesEngine />} />
              <Route path="/violations" element={<Violations />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/settings" element={
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <h2 className="text-2xl font-bold mb-2">Settings</h2>
                  <p>Configuration panel is coming soon.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>

        <footer className="p-6 text-center border-t border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
          © 2026 ScalerAi Compliance Platform. All rights reserved. Enterprise Version 2.4.0
        </footer>
      </div>
    </div>
  );
};

export default App;
