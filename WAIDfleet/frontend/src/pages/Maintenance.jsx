import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Droplets, Calendar, Car, AlertCircle, Fuel, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

export function Maintenance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('defect-reporter');

  const [defects, setDefects] = useState([
    { id: 1, vehicle: 'V-1002 (Toyota Prius)', zone: 'Front Bumper', severity: 'Low', status: 'Pending' },
    { id: 2, vehicle: 'V-1045 (Honda Civic)', zone: 'Tires', severity: 'High', status: 'Urgent Repair' }
  ]);

  const fuelData = [
    { name: 'Mon', consumption: 40, efficiency: 24 },
    { name: 'Tue', consumption: 38, efficiency: 25 },
    { name: 'Wed', consumption: 55, efficiency: 21 }, // Anomaly
    { name: 'Thu', consumption: 45, efficiency: 23 },
    { name: 'Fri', consumption: 42, efficiency: 24 },
    { name: 'Sat', consumption: 35, efficiency: 26 },
    { name: 'Sun', consumption: 30, efficiency: 27 },
  ];

  const inventory = [
    { id: 1, item: 'Synthetic Engine Oil (5W-30)', category: 'Fluids', stock: 12, max: 50, unit: 'gallons' },
    { id: 2, item: 'Brake Pads (Front)', category: 'Hardware', stock: 4, max: 40, unit: 'pairs' },
    { id: 3, item: 'Cabin Air Filters', category: 'Filters', stock: 25, max: 30, unit: 'units' },
    { id: 4, item: 'Wiper Blades (22")', category: 'Accessories', stock: 3, max: 20, unit: 'pairs' },
  ];

  const recordDefect = (zone) => {
    const newDefect = {
      id: Date.now(),
      vehicle: 'Select Vehicle...',
      zone: zone,
      severity: 'Medium',
      status: 'Pending'
    };
    setDefects([newDefect, ...defects]);
    alert('Logged defect on: ' + zone);
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Auto Shop</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'defect-reporter' ? 'var(--primary-color)' : 'rgba(15,23,42,0.4)' }}
            onClick={() => setActiveTab('defect-reporter')}
          >
            <AlertCircle size={18} /> Visual Defect Reporter
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'schedule' ? 'var(--primary-color)' : 'rgba(15,23,42,0.4)' }}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={18} /> Maintenance Schedule
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'fuel' ? 'var(--primary-color)' : 'rgba(15,23,42,0.4)' }}
            onClick={() => setActiveTab('fuel')}
          >
            <Fuel size={18} /> Fuel Analytics
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'inventory' ? 'var(--primary-color)' : 'rgba(15,23,42,0.4)' }}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={18} /> Parts Inventory
          </button>
        </div>

        {activeTab === 'defect-reporter' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '12px', 
              padding: '2rem', 
              border: '1px solid var(--border-color)', 
              backdropFilter: 'blur(8px)',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Interactive Diagram</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Click on a zone to report a defect.</p>
              
              <div style={{ position: 'relative', width: '300px', height: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '2px solid var(--border-color)' }}>
                {/* Mock Car Diagram Layout */}
                <button onClick={() => recordDefect('Front Bumper')} style={{ position: 'absolute', top: '10px', left: '100px', width: '100px', height: '40px', background: 'rgba(239, 68, 68, 0.2)', border: '1px dashed #ef4444' }}>Front</button>
                <button onClick={() => recordDefect('Engine Bay')} style={{ position: 'absolute', top: '60px', left: '100px', width: '100px', height: '100px', background: 'rgba(99, 102, 241, 0.2)', border: '1px dashed #6366f1' }}>Engine</button>
                <button onClick={() => recordDefect('Roof')} style={{ position: 'absolute', top: '180px', left: '100px', width: '100px', height: '180px', background: 'rgba(99, 102, 241, 0.2)', border: '1px dashed #6366f1' }}>Roof / Cabin</button>
                <button onClick={() => recordDefect('Rear Trunk')} style={{ position: 'absolute', bottom: '10px', left: '100px', width: '100px', height: '80px', background: 'rgba(99, 102, 241, 0.2)', border: '1px dashed #6366f1' }}>Trunk</button>
                
                {/* Wheels */}
                <button onClick={() => recordDefect('Front Left Tire')} style={{ position: 'absolute', top: '80px', left: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', border: '1px dashed #f59e0b' }}>FL</button>
                <button onClick={() => recordDefect('Front Right Tire')} style={{ position: 'absolute', top: '80px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', border: '1px dashed #f59e0b' }}>FR</button>
                <button onClick={() => recordDefect('Rear Left Tire')} style={{ position: 'absolute', bottom: '80px', left: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', border: '1px dashed #f59e0b' }}>RL</button>
                <button onClick={() => recordDefect('Rear Right Tire')} style={{ position: 'absolute', bottom: '80px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', border: '1px dashed #f59e0b' }}>RR</button>
              </div>
            </div>

            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '12px', 
              padding: '2rem', 
              border: '1px solid var(--border-color)', 
              backdropFilter: 'blur(8px)'
            }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Reported Defects</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 0' }}>Vehicle</th>
                    <th>Zone</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: '500' }}>{d.vehicle}</td>
                      <td>{d.zone}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                          background: d.severity === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: d.severity === 'High' ? '#ef4444' : '#f59e0b'
                        }}>{d.severity}</span>
                      </td>
                      <td>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
           <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '12px', 
            padding: '2rem', 
            border: '1px solid var(--border-color)', 
            backdropFilter: 'blur(8px)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wrench size={20} className="text-primary"/> Preventative Maintenance Schedule</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Vehicle</th>
                  <th>Service Type</th>
                  <th>Due Date</th>
                  <th>Cost Estimate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>V-2005 (Ford Transit)</td>
                  <td>Engine Oil Change</td>
                  <td style={{ color: '#ef4444' }}>Overdue (2 Days)</td>
                  <td>$120.00</td>
                  <td><button style={{ padding: '0.5rem 1rem', background: '#3b82f6' }}>Approve</button></td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>V-1022 (Toyota Prius)</td>
                  <td>Tire Rotation</td>
                  <td>Tommorow</td>
                  <td>$45.00</td>
                  <td><button style={{ padding: '0.5rem 1rem', background: '#3b82f6' }}>Approve</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '12px', 
              padding: '2rem', 
              border: '1px solid var(--border-color)', 
              backdropFilter: 'blur(8px)',
              height: '400px'
            }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Fuel size={20} className="text-primary"/> Fleet Fuel Consumption
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={fuelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="consumption" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorConsumption)" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>*Notice the anomalous consumption spike on Wednesday.</div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border-color)' }}>
               <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>⚠️ Inefficient Vehicles Detected</h3>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0' }}>Vehicle</th>
                      <th>Driver</th>
                      <th>Expected MPG</th>
                      <th>Actual MPG</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: '500' }}>V-3099 (Chevy Malibu)</td>
                      <td>Marcus Cole</td>
                      <td>28.0</td>
                      <td style={{ color: '#ef4444' }}>14.2</td>
                      <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8rem' }}>-49.2%</span></td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {inventory.map(item => {
              const percentage = (item.stock / item.max) * 100;
              const isLow = percentage <= 15;

              return (
                <div key={item.id} style={{ 
                  background: 'var(--card-bg)', 
                  borderRadius: '12px', 
                  padding: '2rem', 
                  border: isLow ? '1px solid #ef4444' : '1px solid var(--border-color)', 
                  backdropFilter: 'blur(8px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {isLow && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' }}></div>}
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</div>
                  <h3 style={{ margin: 0, marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{item.item}</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    <span style={{ color: isLow ? '#ef4444' : 'var(--text-main)', fontSize: '1.5rem' }}>{item.stock}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/ {item.max} {item.unit}</span>
                  </div>

                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`,
                      background: isLow ? '#ef4444' : '#10b981',
                      transition: 'width 0.5s ease-out'
                    }}></div>
                  </div>

                  {isLow && <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}><AlertCircle size={14} /> Critical Low Stock</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
