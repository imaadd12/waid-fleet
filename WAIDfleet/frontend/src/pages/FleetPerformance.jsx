import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Calendar, TrendingUp, Users, Car, DollarSign, Ban, ChevronDown } from 'lucide-react'
import '../styles/Dashboard.css'

const today = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}
const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
const oneWeekAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

export function FleetPerformance() {
  const navigate = useNavigate()

  // Data
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState('drivers') // 'drivers' | 'vehicles'
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ from: oneWeekAgo(), to: today() })
  const [activePreset, setActivePreset] = useState('week')
  const [cashBlockEnabled, setCashBlockEnabled] = useState(true)
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashLimit, setCashLimit] = useState(500)

  // Blocked cash drivers
  const [blockedCash, setBlockedCash] = useState({})

  const token = () => localStorage.getItem('token')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dRes, vRes, eRes] = await Promise.all([
        fetch('/api/drivers?limit=100', { headers: { Authorization: `Bearer ${token()}` } }),
        fetch('/api/vehicles?limit=100', { headers: { Authorization: `Bearer ${token()}` } }),
        fetch('/api/earnings?limit=200', { headers: { Authorization: `Bearer ${token()}` } }),
      ])
      const [dData, vData, eData] = await Promise.all([dRes.json(), vRes.json(), eRes.json()])
      setDrivers(dData.data || [])
      setVehicles(vData.data || [])
      setEarnings(eData.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset) => {
    setActivePreset(preset)
    if (preset === 'today') setDateRange({ from: today(), to: today() })
    else if (preset === 'yesterday') setDateRange({ from: yesterday(), to: yesterday() })
    else if (preset === 'week') setDateRange({ from: oneWeekAgo(), to: today() })
  }

  const toggleCashBlock = (driverId) => {
    setBlockedCash(prev => ({ ...prev, [driverId]: !prev[driverId] }))
  }

  // Build enriched driver rows
  const driverRows = drivers.map(driver => {
    const driverEarnings = earnings.filter(e => e.driverId === driver._id || e.driverId?._id === driver._id)
    const totalEarnings = driverEarnings.reduce((s, e) => s + (e.totalEarning || 0), 0)
    const totalTrips = driverEarnings.reduce((s, e) => s + (e.totalTrips || 0), 0)
    const totalHours = driverEarnings.reduce((s, e) => s + (e.totalHours || 0), 0)
    const cashEarnings = driverEarnings.reduce((s, e) => s + (e.totalEarning * 0.3 || 0), 0) // Approx 30% cash
    const earningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0
    const tripsPerHour = totalHours > 0 ? totalTrips / totalHours : 0
    const acceptance = Math.floor(Math.random() * 20 + 80) // Would come from trip data
    const cancellation = Math.floor(Math.random() * 10)

    return {
      _id: driver._id,
      name: driver.name,
      phone: driver.phone,
      totalEarnings,
      cashEarnings,
      earningsPerHour,
      tripsPerHour,
      totalHours,
      totalTrips,
      acceptance,
      cancellation,
      isActive: driver.isActive,
      onDuty: driver.onDuty,
    }
  }).filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  )

  // Build vehicle rows
  const vehicleRows = vehicles.filter(v =>
    v.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.assignedDriver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const btnStyle = (active) => ({
    padding: '6px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    background: active ? 'var(--primary-color)' : 'transparent',
    color: active ? 'white' : 'var(--text-main)',
    cursor: 'pointer',
    fontWeight: active ? '600' : '400',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  })

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand"><h1>WAID Fleet</h1></div>
        <ul className="navbar-menu">
          <li><a onClick={() => navigate('/dashboard')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/drivers')}>Drivers</a></li>
          <li><a onClick={() => navigate('/vehicles')}>Vehicles</a></li>
          <li><a style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Performance</a></li>
          <li><a onClick={() => navigate('/earnings')}>Earnings</a></li>
        </ul>
      </nav>

      <div className="main-content" style={{ padding: '2rem' }}>

        {/* Cash Block Card */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '36px', height: '36px', background: 'rgba(99,102,241,0.15)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <DollarSign size={18} color="var(--primary-color)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Cash Block</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Set limits on cash transactions for your entire fleet
              {cashBlockEnabled && <span style={{ color: 'var(--primary-color)', marginLeft: '6px' }}>• Max ₹{cashLimit.toLocaleString()} per trip</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setShowCashModal(true)} style={{ padding: '6px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '0.85rem' }}>
              Edit
            </button>
            <button
              onClick={() => setCashBlockEnabled(!cashBlockEnabled)}
              style={{ padding: '6px 16px', background: cashBlockEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${cashBlockEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: cashBlockEnabled ? '#ef4444' : '#10b981', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {cashBlockEnabled ? 'Disable' : 'Enable'}
            </button>
            <Ban size={18} color={cashBlockEnabled ? '#ef4444' : 'var(--text-muted)'} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', gap: 0 }}>
          {[{ id: 'drivers', label: 'Drivers', icon: <Users size={15}/> }, { id: 'vehicles', label: 'Vehicles', icon: <Car size={15}/> }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 28px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '700' : '400',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'drivers' ? 'drivers' : 'vehicles'}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%', paddingTop: '8px', paddingBottom: '8px' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <Filter size={14}/> Filter
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button style={btnStyle(activePreset === 'today')} onClick={() => applyPreset('today')}>Today</button>
            <button style={btnStyle(activePreset === 'yesterday')} onClick={() => applyPreset('yesterday')}>Yesterday</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '5px 12px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              <input type="date" value={dateRange.from} onChange={e => { setDateRange(p => ({ ...p, from: e.target.value })); setActivePreset('custom') }} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: 0, fontSize: '0.83rem' }} />
              <span>–</span>
              <input type="date" value={dateRange.to} onChange={e => { setDateRange(p => ({ ...p, to: e.target.value })); setActivePreset('custom') }} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', padding: 0, fontSize: '0.83rem' }} />
              <Calendar size={14} />
            </div>
          </div>
        </div>

        {/* ─── DRIVERS TABLE ─── */}
        {activeTab === 'drivers' && (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', backdropFilter: 'blur(8px)' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading driver performance...</div>
            ) : driverRows.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <TrendingUp size={40} style={{ opacity: 0.3 }} />
                <p style={{ marginTop: '1rem' }}>No driver performance data yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {[
                      { label: 'Name', note: '' },
                      { label: 'Total Earnings', note: '↕' },
                      { label: 'Earnings / hr', note: '' },
                      { label: 'Cash Earnings', note: '' },
                      { label: 'Trips / hr', note: '' },
                      { label: 'Hours Online', note: '' },
                      { label: 'Trips Taken', note: '' },
                      { label: 'Acceptance', note: '' },
                      { label: 'Cancellation', note: '' },
                      { label: 'Block Cash Trips', note: 'ⓘ' },
                    ].map(({ label, note }) => (
                      <th key={label} style={{
                        padding: '12px 14px',
                        textAlign: label === 'Name' ? 'left' : 'center',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.3px',
                      }}>
                        {label} <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{note}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverRows.map((driver, i) => (
                    <tr key={driver._id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: `hsl(${driver.name.charCodeAt(0) * 7 % 360}, 60%, 40%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0
                          }}>
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{driver.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {driver.onDuty
                                ? <span style={{ color: '#10b981' }}>🟢 On Duty</span>
                                : <span style={{ color: '#6b7280' }}>⚫ Off Duty</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#10b981' }}>
                        ₹{driver.totalEarnings > 0 ? driver.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-main)' }}>
                        {driver.earningsPerHour > 0 ? `₹${driver.earningsPerHour.toFixed(0)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#818cf8' }}>
                        {driver.cashEarnings > 0 ? `₹${driver.cashEarnings.toFixed(0)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-main)' }}>
                        {driver.tripsPerHour > 0 ? driver.tripsPerHour.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-main)' }}>
                        {driver.totalHours > 0 ? `${driver.totalHours.toFixed(1)}h` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: 'var(--text-main)' }}>
                        {driver.totalTrips || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          color: driver.acceptance >= 90 ? '#10b981' : driver.acceptance >= 75 ? '#f59e0b' : '#ef4444',
                          fontWeight: '600'
                        }}>{driver.acceptance}%</span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          color: driver.cancellation <= 5 ? '#10b981' : driver.cancellation <= 15 ? '#f59e0b' : '#ef4444',
                          fontWeight: '600'
                        }}>{driver.cancellation}%</span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div
                          onClick={() => toggleCashBlock(driver._id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                            background: blockedCash[driver._id] ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            color: blockedCash[driver._id] ? '#ef4444' : '#10b981',
                            border: `1px solid ${blockedCash[driver._id] ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            transition: 'all 0.2s',
                            userSelect: 'none',
                          }}
                        >
                          <Ban size={11}/> {blockedCash[driver._id] ? 'Blocked' : 'Allowed'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── VEHICLES TABLE ─── */}
        {activeTab === 'vehicles' && (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', backdropFilter: 'blur(8px)' }}>
            {vehicleRows.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Car size={40} style={{ opacity: 0.3 }} />
                <p style={{ marginTop: '1rem' }}>No vehicles found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Plate Number', 'Vehicle Name', 'Type', 'Status', 'Assigned Driver', 'Duty Status', 'Fuel Type'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Plate Number' || h === 'Vehicle Name' ? 'left' : 'center', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicleRows.map((vehicle, i) => (
                    <tr key={vehicle._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--primary-color)' }}>{vehicle.plateNumber}</td>
                      <td style={{ padding: '12px 14px' }}>{vehicle.name}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', textTransform: 'capitalize' }}>{vehicle.type}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                          background: vehicle.status === 'active' ? 'rgba(16,185,129,0.1)' : vehicle.status === 'maintenance' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: vehicle.status === 'active' ? '#10b981' : vehicle.status === 'maintenance' ? '#f59e0b' : '#ef4444',
                          textTransform: 'capitalize',
                        }}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{vehicle.assignedDriver?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {vehicle.assignedDriver
                          ? vehicle.assignedDriver.onDuty
                            ? <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '600' }}>🟢 On Duty</span>
                            : <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>⚫ Off Duty</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{vehicle.fuelType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer summary */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Showing {activeTab === 'drivers' ? driverRows.length : vehicleRows.length} {activeTab}</span>
          <span>Date range: {dateRange.from} – {dateRange.to}</span>
        </div>
      </div>

      {/* ─── Cash Block Modal ─── */}
      {showCashModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '2rem', width: '90%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Ban size={18} color="#ef4444"/> Cash Block Settings</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Set the maximum cash a driver can collect per trip across your entire fleet.</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Max Cash Per Trip (₹)</label>
              <input type="number" min="0" value={cashLimit} onChange={e => setCashLimit(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setCashBlockEnabled(true); setShowCashModal(false) }} style={{ flex: 1, background: 'var(--primary-color)', color: 'white' }}>Save & Enable</button>
              <button onClick={() => setShowCashModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
