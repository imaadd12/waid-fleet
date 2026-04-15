import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, Calendar, Settings, Car, Users, ClipboardList, Shield, DollarSign, AlertTriangle, Building } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pages = [
    { name: 'Dashboard', path: '/dashboard', icon: <Search size={16} /> },
    { name: 'Live Telematics', path: '/telematics', icon: <Map size={16} /> },
    { name: 'Dispatch Board', path: '/dispatch', icon: <ClipboardList size={16} /> },
    { name: 'Maintenance Hub', path: '/maintenance', icon: <Settings size={16} /> },
    { name: 'Compliance Center', path: '/compliance', icon: <Shield size={16} /> },
    { name: 'Drivers', path: '/drivers', icon: <Users size={16} /> },
    { name: 'Vehicles', path: '/vehicles', icon: <Car size={16} /> },
    { name: 'Shift Rostering', path: '/rostering', icon: <Calendar size={16} /> },
    { name: 'Incident Manager', path: '/incidents', icon: <AlertTriangle size={16} /> },
    { name: 'Payroll Engine', path: '/payroll', icon: <DollarSign size={16} /> },
    { name: 'B2B Client Portal', path: '/corporate/b2b-portal', icon: <Building size={16} /> }
  ];

  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '10vh'
    }} onClick={() => setIsOpen(false)}>
      <div style={{
        background: 'var(--card-bg)', width: '100%', maxWidth: '600px',
        borderRadius: '16px', border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', height: 'fit-content'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} color="var(--text-muted)" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none' }}
          />
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>
        <div style={{ padding: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredPages.length > 0 ? filteredPages.map((page, i) => (
            <div key={i} onClick={() => { navigate(page.path); setIsOpen(false); }}
                 style={{
                   padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                   cursor: 'pointer', borderRadius: '8px', color: 'var(--text-main)'
                 }}
                 onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ color: 'var(--text-muted)' }}>{page.icon}</div>
              {page.name}
            </div>
          )) : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</div>}
        </div>
      </div>
    </div>
  );
}
