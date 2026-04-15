import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Map, CreditCard, LogOut, CheckCircle } from 'lucide-react';
import '../styles/Dashboard.css';

export function CorporatePortal() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      {/* Light Corporate Navbar */}
      <nav style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '8px' }}>
            <Building size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Apex Hotels Int.</h1>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>B2B Fleet Portal Portal provided by WAID</span>
          </div>
        </div>
        <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
          
          {/* Active Fleet Tracker */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <Map size={20} color="#3b82f6" /> Leased Fleet Status (3/3 Active)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['V-1002 (Toyota Prius)', 'V-3099 (Chevy Malibu)', 'V-2005 (Ford Transit)'].map((vehicle, idx) => (
                <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{vehicle}</h3>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Allocated to: Downtown Branch</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: '#dcfce7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                    <CheckCircle size={14} /> Active on Route
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing & Invoices */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
             <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <CreditCard size={20} color="#8b5cf6" /> Corporate Invoices
            </h2>
            
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Current Month Balance</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>$3,450.00</div>
              <button style={{ background: '#0f172a', color: 'white', width: '100%', marginTop: '1rem' }}>Pay Balance</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>INV-2026-09</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sept 2026 Fleet Lease</div>
                </div>
                <div style={{ color: '#64748b' }}>Paid</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>INV-2026-08</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Aug 2026 Fleet Lease</div>
                </div>
                <div style={{ color: '#64748b' }}>Paid</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b' }} onClick={() => navigate('/')}>
             &larr; (Admin) Return to WAID Main Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
