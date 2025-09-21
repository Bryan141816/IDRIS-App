import React from 'react';

type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';

const NavTabs: React.FC<{ activeTab: ActiveTab; onChange: (t: ActiveTab) => void }> = ({ activeTab, onChange }) => (
  <div className="navigation">
    <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onChange('dashboard')}>📊 Dashboard</button>
    <button className={`nav-btn ${activeTab === 'inflows' ? 'active' : ''}`} onClick={() => onChange('inflows')}>💰 Fund Inflows</button>
    <button className={`nav-btn ${activeTab === 'outflows' ? 'active' : ''}`} onClick={() => onChange('outflows')}>💸 Fund Outflows</button>
    <button className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => onChange('reports')}>📋 Reports & Audits</button>
    {/* <button className={`nav-btn ${activeTab === 'exports' ? 'active' : ''}`} onClick={() => onChange('exports')}>📤 Export Logs</button> */}
  </div>
);

export default NavTabs;
