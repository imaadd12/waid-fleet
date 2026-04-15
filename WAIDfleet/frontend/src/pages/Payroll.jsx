import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Download, Plus, Minus, Calculator, CheckCircle2 } from 'lucide-react';
import '../styles/Dashboard.css';

export function Payroll() {
  const navigate = useNavigate();

  const [drivers] = useState([
    { id: 1, name: 'Marcus Cole', baseEarnings: 1250.00, bonuses: 150.00, deductions: 45.00 },
    { id: 2, name: 'Jane Smith', baseEarnings: 1400.00, bonuses: 200.00, deductions: 0.00 },
    { id: 3, name: 'Robert Brown', baseEarnings: 950.00, bonuses: 50.00, deductions: 120.00 }, // Deductions e.g. ticket
  ]);

  const calculateNet = (driver) => (driver.baseEarnings + driver.bonuses - driver.deductions).toFixed(2);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Payroll Engine</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2>Automated Payroll Engine</h2>
            <p style={{ color: 'var(--text-muted)' }}>Process week-ending commissions, deduct maintenance costs, and generate payslips.</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white' }}>
            <Calculator size={16} /> Execute Global Payout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
          
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', backdropFilter: 'blur(8px)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Driver</th>
                  <th>Base Fares</th>
                  <th>Bonuses <Plus size={10} color="#10b981"/></th>
                  <th>Deductions <Minus size={10} color="#ef4444"/></th>
                  <th style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>Net Payout</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1.5rem', fontWeight: '500' }}>{d.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>${d.baseEarnings.toFixed(2)}</td>
                    <td style={{ color: '#10b981' }}>+${d.bonuses.toFixed(2)}</td>
                    <td style={{ color: '#ef4444' }}>-${d.deductions.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      ${calculateNet(d)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                      <button style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', color: '#333', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>WAID Fleet</h3>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Weekly Earnings Statement</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#111827' }}>Robert Brown</div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Period: Oct 5 - Oct 11, 2026</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563' }}>Completed Trips (42)</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>$950.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563' }}>Weekend Bonus Tier</span>
                <span style={{ fontWeight: '500', color: '#059669' }}>+$50.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#4b5563' }}>Deduction: Speeding Citation</span>
                <span style={{ fontWeight: '500', color: '#dc2626' }}>-$120.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span style={{ color: '#111827' }}>Total Net Payout</span>
                <span style={{ color: '#111827' }}>$880.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', width: '100%', justifyContent: 'center' }}>
                <Download size={16} /> Download PDF Payslip
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#059669', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Ready for Deposit
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
