import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, XCircle, FileText, Search } from 'lucide-react';
import '../styles/Dashboard.css';

export function ComplianceCenter() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [complianceData] = useState([
    { id: 1, driver: 'John Doe', license: 'Valid', licenseExpiry: '2026-05-10', insurance: 'Expiring', insuranceExpiry: '2024-05-01', permit: 'Valid', permitExpiry: '2025-11-20', overall: 'Warning' },
    { id: 2, driver: 'Jane Smith', license: 'Valid', licenseExpiry: '2027-01-15', insurance: 'Valid', insuranceExpiry: '2025-06-15', permit: 'Valid', permitExpiry: '2025-08-30', overall: 'Valid' },
    { id: 3, driver: 'Mike Johnson', license: 'Expired', licenseExpiry: '2024-03-01', insurance: 'Valid', insuranceExpiry: '2024-12-01', permit: 'Valid', permitExpiry: '2025-01-10', overall: 'Blocked' },
    { id: 4, driver: 'Sarah Wilson', license: 'Valid', licenseExpiry: '2025-04-20', insurance: 'Valid', insuranceExpiry: '2024-10-10', permit: 'Expiring', permitExpiry: '2024-04-25', overall: 'Warning' },
    { id: 5, driver: 'Robert Brown', license: 'Valid', licenseExpiry: '2028-02-14', insurance: 'Valid', insuranceExpiry: '2025-02-14', permit: 'Valid', permitExpiry: '2026-02-14', overall: 'Valid' },
  ]);

  const filteredData = complianceData.filter(d => d.driver.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderStatusBadge = (status, date) => {
    let bgColor, color, icon;
    if (status === 'Valid') {
      bgColor = 'rgba(16, 185, 129, 0.1)'; color = '#10b981'; icon = <ShieldCheck size={14} />;
    } else if (status === 'Expiring') {
      bgColor = 'rgba(245, 158, 11, 0.1)'; color = '#f59e0b'; icon = <AlertTriangle size={14} />;
    } else {
      bgColor = 'rgba(239, 68, 68, 0.1)'; color = '#ef4444'; icon = <XCircle size={14} />;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content',
          padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', background: bgColor, color: color 
        }}>
          {icon} {status}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{date}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Compliance Hub</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div>
            <h2>Document Compliance Center</h2>
            <p style={{ color: 'var(--text-muted)' }}>Monitor expiration dates across all driver and vehicle documents.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search driver..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(15, 23, 42, 0.4)',
                color: 'var(--text-main)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Severely Non-Compliant</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>1</div>
            <div style={{ fontSize: '0.85rem' }}>Drivers currently blocked from dispatch.</div>
          </div>
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Expiring Soon (30 Days)</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>2</div>
            <div style={{ fontSize: '0.85rem' }}>Documents needing attention this month.</div>
          </div>
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #10b981', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Fully Compliant</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>42</div>
            <div style={{ fontSize: '0.85rem' }}>Drivers clear for operations.</div>
          </div>
        </div>

        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          backdropFilter: 'blur(8px)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem' }}>Driver / Entity</th>
                <th>Driver's License</th>
                <th>Commercial Insurance</th>
                <th>City Operating Permit</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: d.overall === 'Blocked' ? '#ef4444' : d.overall === 'Warning' ? '#f59e0b' : '#10b981' 
                    }}></div>
                    {d.driver}
                  </td>
                  <td>{renderStatusBadge(d.license, d.licenseExpiry)}</td>
                  <td>{renderStatusBadge(d.insurance, d.insuranceExpiry)}</td>
                  <td>{renderStatusBadge(d.permit, d.permitExpiry)}</td>
                  <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                    <button style={{ 
                      padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600',
                      background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      Review Files
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
