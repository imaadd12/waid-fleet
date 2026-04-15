import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, FileText, Camera, ShieldAlert, CheckCircle2, Wrench, Plus, Trash2, Car } from 'lucide-react';
import '../styles/Dashboard.css';

const SEVERITY_COLOR = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export function Incidents() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Log Incident modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    driverId: '', vehicleId: '', type: 'accident', description: '', severity: 'medium'
  });

  // Repair modal
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairTarget, setRepairTarget] = useState(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [deductFromDriver, setDeductFromDriver] = useState(false);
  const [parts, setParts] = useState([{ partName: '', quantity: 1, unitCost: 0 }]);
  const [repairLoading, setRepairLoading] = useState(false);

  useEffect(() => {
    fetchIncidents();
    fetchDrivers();
    fetchVehicles();
  }, []);

  const token = () => localStorage.getItem('token');

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents/admin/all?limit=50', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (data.success) setIncidents(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers?limit=100', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (data.success) setDrivers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?limit=100', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch (e) { console.error(e); }
  };

  const handleLogIncident = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(incidentForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowIncidentModal(false);
        setIncidentForm({ driverId: '', vehicleId: '', type: 'accident', description: '', severity: 'medium' });
        fetchIncidents();
      } else {
        alert(data.message || 'Failed to log incident');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openRepairModal = (incident) => {
    setRepairTarget(incident);
    setParts([{ partName: '', quantity: 1, unitCost: 0 }]);
    setRepairNotes('');
    setDeductFromDriver(false);
    setShowRepairModal(true);
  };

  const addPartRow = () => setParts([...parts, { partName: '', quantity: 1, unitCost: 0 }]);
  const removePartRow = (i) => setParts(parts.filter((_, idx) => idx !== i));
  const updatePart = (i, field, value) => {
    const updated = [...parts];
    updated[i][field] = field === 'partName' ? value : parseFloat(value) || 0;
    setParts(updated);
  };

  const totalCost = parts.reduce((s, p) => s + (p.unitCost * p.quantity), 0);

  const handleSubmitRepair = async (e) => {
    e.preventDefault();
    if (parts.some(p => !p.partName.trim())) {
      alert('Please fill in all part names.');
      return;
    }
    try {
      setRepairLoading(true);
      const res = await fetch(`/api/incidents/${repairTarget._id}/repair`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ partsUsed: parts, repairNotes, deductFromDriver })
      });
      const data = await res.json();
      if (data.success) {
        setShowRepairModal(false);
        fetchIncidents();
      } else {
        alert(data.message || 'Failed to log repair');
      }
    } catch (e) { console.error(e); }
    finally { setRepairLoading(false); }
  };

  const isResolved = (inc) => inc.status === 'resolved' || inc.status === 'closed' || inc.repairCompleted;

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet <span style={{ color: '#8b5cf6', fontSize: '1rem' }}>| Incidents</span></h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/')}>Back to Dashboard</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Accident & Incident Management</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track fleet liabilities, repair logs, and driver deductions.</p>
          </div>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', whiteSpace: 'nowrap' }}
            onClick={() => setShowIncidentModal(true)}
          >
            <AlertOctagon size={16} /> Log Emergency Incident
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total', value: incidents.length, color: '#818cf8' },
            { label: 'Open', value: incidents.filter(i => i.status === 'reported' || i.status === 'under_review').length, color: '#ef4444' },
            { label: 'Repaired', value: incidents.filter(i => i.repairCompleted).length, color: '#10b981' },
            { label: 'Repair Cost', value: `₹${incidents.reduce((s, i) => s + (i.totalRepairCost || 0), 0).toLocaleString()}`, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Incident Cards */}
        {incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <AlertOctagon size={48} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: '1rem' }}>No incidents logged yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {incidents.map((incident) => (
              <div key={incident._id} style={{
                background: 'var(--card-bg)',
                border: incident.repairCompleted
                  ? '1px solid #10b981'
                  : incident.status === 'reported' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                backdropFilter: 'blur(8px)',
              }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      background: isResolved(incident) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      padding: '0.75rem', borderRadius: '8px',
                      color: isResolved(incident) ? '#10b981' : '#ef4444'
                    }}>
                      {isResolved(incident) ? <CheckCircle2 size={24} /> : <AlertOctagon size={24} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{incident.type.replace(/_/g, ' ')} Incident</h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Case #{incident._id.substring(0, 8).toUpperCase()} • {new Date(incident.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                      background: SEVERITY_COLOR[incident.severity] + '22',
                      color: SEVERITY_COLOR[incident.severity], border: `1px solid ${SEVERITY_COLOR[incident.severity]}44`,
                      textTransform: 'capitalize'
                    }}>
                      {incident.severity} severity
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                      background: isResolved(incident) ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: isResolved(incident) ? '#10b981' : '#f59e0b',
                      textTransform: 'capitalize'
                    }}>
                      {isResolved(incident) ? '✅ Repair Done' : incident.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Body: Driver + Vehicle + Description */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Involved Driver</div>
                    <div style={{ fontWeight: '600' }}>{incident.driverId?.name || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{incident.driverId?.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}><Car size={11}/> Vehicle</div>
                    <div style={{ fontWeight: '600' }}>{incident.vehicleId?.plateNumber || 'Not specified'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{incident.vehicleId?.name}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Description</div>
                    <div style={{ color: 'var(--text-main)' }}>{incident.description}</div>
                  </div>
                </div>

                {/* Repair Summary (if completed) */}
                {incident.repairCompleted && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>
                        <Wrench size={18}/> Repair Completed
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Repaired on {new Date(incident.repairedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Parts table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600' }}>Part / Component</th>
                            <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: '600' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600' }}>Unit Cost</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incident.partsUsed.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '7px 8px', fontWeight: '500' }}>{p.partName}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{p.quantity}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>₹{p.unitCost.toLocaleString()}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>₹{(p.unitCost * p.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid rgba(16,185,129,0.3)' }}>
                            <td colSpan={3} style={{ padding: '8px 8px', fontWeight: '700', textAlign: 'right', color: 'var(--text-muted)' }}>TOTAL REPAIR COST</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: '800', color: '#10b981', fontSize: '1rem' }}>₹{incident.totalRepairCost.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {incident.repairNotes && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Notes: {incident.repairNotes}
                      </div>
                    )}

                    {incident.payrollDeducted && (
                      <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: '#ef4444' }}>
                        💸 ₹{incident.payrollDeductionAmount?.toLocaleString()} deducted from driver payroll
                      </div>
                    )}
                  </div>
                )}

                {/* Action row */}
                {!incident.repairCompleted && (
                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openRepairModal(incident)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', padding: '0.6rem 1.2rem' }}
                    >
                      <Wrench size={14}/> Log Repair
                    </button>
                    <div style={{ background: 'rgba(15,23,42,0.3)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Camera size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No evidence attached</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Log Incident Modal ─── */}
      {showIncidentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '14px', width: '95%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20} color="#ef4444"/> Log Emergency Incident</h3>
            <form onSubmit={handleLogIncident} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Driver Involved *</label>
                <select required value={incidentForm.driverId} onChange={e => setIncidentForm({ ...incidentForm, driverId: e.target.value })} style={{ width: '100%' }}>
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Vehicle (optional)</label>
                <select value={incidentForm.vehicleId} onChange={e => setIncidentForm({ ...incidentForm, vehicleId: e.target.value })} style={{ width: '100%' }}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Incident Type *</label>
                <select required value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="accident">Accident</option>
                  <option value="speeding">Speeding</option>
                  <option value="vehicle_damage">Vehicle Damage</option>
                  <option value="rude_behavior">Rude Behavior</option>
                  <option value="complaint">Customer Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Severity</label>
                <select value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })} style={{ width: '100%' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description *</label>
                <textarea required rows={3} value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="What happened?" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, background: '#ef4444', color: 'white' }}>{loading ? 'Saving...' : 'Submit Incident'}</button>
                <button type="button" onClick={() => setShowIncidentModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Repair Invoice Modal ─── */}
      {showRepairModal && repairTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '14px', width: '95%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <Wrench size={20}/> Log Repair — Case #{repairTarget._id.substring(0,8).toUpperCase()}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Driver: <strong style={{ color: 'var(--text-main)' }}>{repairTarget.driverId?.name}</strong>
              {repairTarget.vehicleId && <> &nbsp;| Vehicle: <strong style={{ color: 'var(--text-main)' }}>{repairTarget.vehicleId.plateNumber} ({repairTarget.vehicleId.name})</strong></>}
            </div>

            <form onSubmit={handleSubmitRepair} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Parts table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Parts & Components Used</label>
                  <button type="button" onClick={addPartRow} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.82rem' }}>
                    <Plus size={13}/> Add Part
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 40px', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                    <span>Part Name</span><span>Qty</span><span>Unit Cost (₹)</span><span></span>
                  </div>
                  {parts.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                      <input placeholder="e.g. Front Bumper" value={p.partName} onChange={e => updatePart(i, 'partName', e.target.value)} style={{ padding: '8px 10px', fontSize: '0.85rem' }} />
                      <input type="number" min="1" value={p.quantity} onChange={e => updatePart(i, 'quantity', e.target.value)} style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'center' }} />
                      <input type="number" min="0" step="0.01" value={p.unitCost} onChange={e => updatePart(i, 'unitCost', e.target.value)} style={{ padding: '8px 10px', fontSize: '0.85rem' }} />
                      <button type="button" onClick={() => removePartRow(i)} disabled={parts.length === 1} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Total */}
                <div style={{ marginTop: '1rem', textAlign: 'right', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Repair Cost: </span>
                  <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.2rem' }}>₹{totalCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Repair Notes */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Repair Notes (optional)</label>
                <textarea rows={2} value={repairNotes} onChange={e => setRepairNotes(e.target.value)} placeholder="Any additional notes about the repair..." style={{ width: '100%' }} />
              </div>

              {/* Deduct from Driver toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: deductFromDriver ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${deductFromDriver ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`, borderRadius: '10px', cursor: 'pointer' }}
                onClick={() => setDeductFromDriver(!deductFromDriver)}>
                <div style={{ width: '40px', height: '22px', background: deductFromDriver ? '#ef4444' : '#374151', borderRadius: '11px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: deductFromDriver ? '21px' : '3px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Deduct from Driver Payroll</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {deductFromDriver ? `₹${totalCost.toLocaleString()} will be deducted from ${repairTarget.driverId?.name}'s earnings` : "Toggle to mark this repair cost as driver\u2019s liability"}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="submit" disabled={repairLoading} style={{ flex: 2, background: '#10b981', color: 'white' }}>
                  {repairLoading ? 'Saving Repair...' : '✅ Mark Repair Complete'}
                </button>
                <button type="button" onClick={() => setShowRepairModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
