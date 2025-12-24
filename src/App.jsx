import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import GrowthDiscovery from './components/GrowthDiscovery';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">StockApp</div>
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          Portfolio
        </button>

      </nav>
      <main className="main-content">
        {currentView === 'dashboard' ? <Dashboard /> : <GrowthDiscovery />}
      </main>
    </div >
  );
}

export default App;
