import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
  Car, Plus, Layers, Filter, Search, ChevronRight, Settings, 
  MapPin, Activity, Fuel, Calendar, Shield, Trash2, Edit3, 
  CheckCircle, AlertCircle, HardDrive, RefreshCw
} from 'lucide-react'

export function Vehicles() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('view')
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchPlate, setSearchPlate] = useState('')

  // Single vehicle form
  const [formData, setFormData] = useState({
    name: '', plateNumber: '', type: 'sedan', color: '',
    registrationNumber: '', registrationExpiry: '', insuranceExpiry: '',
    fuelType: 'petrol', mileage: 0, assignedDriver: ''
  })

  // Batch vehicles form
  const [batchVehicles, setBatchVehicles] = useState([
    { name: '', plateNumber: '', type: 'sedan', registrationNumber: '', color: '', fuelType: 'petrol' }
  ])

  useEffect(() => {
    fetchDrivers()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles()
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchPlate, filterStatus])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      queryParams.append('limit', 50)
      if (searchPlate) queryParams.append('search', searchPlate)
      if (filterStatus && filterStatus !== 'all') queryParams.append('status', filterStatus)
      
      const res = await fetch(`/api/vehicles?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setVehicles(data.data || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/drivers?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDrivers(data.data || [])
    } catch (error) { console.error(error) }
  }

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        fetchVehicles(); setActiveTab('view')
      }
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const handleUpdateVehicle = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vehicles/${editingVehicle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setEditingVehicle(null); fetchVehicles(); setActiveTab('view')
      }
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Decommission this vehicle from the fleet?')) return
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (res.ok) fetchVehicles()
    } catch (error) { console.error(error) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Fleet Sidebar */}
      <aside className="glass-pane" style={{ width: '280px', borderRadius: 0, borderRight: '1px solid var(--border-subtle)', background: 'rgba(15, 18, 24, 0.4)', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ marginBottom: '3rem' }}>
           <h1 className="outfit" style={{ fontSize: '1.4rem', color: 'white' }}>Fleet Directory</h1>
           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Management</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'view', label: 'Fleet Grid View', icon: <Layers size={18}/> },
            { id: 'add', label: 'Unit Acquisition', icon: <Plus size={18}/> },
            { id: 'batch', label: 'Batch Enrollment', icon: <HardDrive size={18}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? '' : 'secondary'}
              style={{
                justifyContent: 'flex-start', width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--primary-accent)' : 'transparent',
                borderColor: 'transparent', color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.88rem'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '2rem', left: '1.5rem', right: '1.5rem' }}>
           <button className="secondary" style={{ width: '100%' }} onClick={() => navigate('/admin')}>Exit to Control</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '3rem' }}>
        <header style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="outfit" style={{ fontSize: '2.5rem', margin: 0 }}>Fleet Assets</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time inventory of physical transportation units.</p>
          </div>
          {activeTab === 'view' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    placeholder="Identify by plate..." 
                    style={{ paddingLeft: '40px', width: '240px', height: '44px', background: 'var(--bg-secondary)', borderRadius: '100px' }} 
                    value={searchPlate}
                    onChange={e => setSearchPlate(e.target.value)}
                  />
               </div>
               <select 
                 style={{ height: '44px', width: '160px', borderRadius: '100px', background: 'var(--bg-secondary)', padding: '0 1rem' }}
                 value={filterStatus}
                 onChange={e => setFilterStatus(e.target.value)}
               >
                  <option value="all">All Units</option>
                  <option value="active">Operational</option>
                  <option value="maintenance">Maintenance</option>
               </select>
            </div>
          )}
        </header>

        <div className="animate-fade-in">
          {activeTab === 'view' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
              {loading ? <p>Syncing fleet data...</p> : vehicles.map((v, i) => (
                <div key={i} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                   <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--primary-glow)' }}>
                            <Car color="white" size={20} />
                         </div>
                         <span className="outfit" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{v.plateNumber}</span>
                      </div>
                      <div style={{ padding: '4px 12px', borderRadius: '100px', background: v.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: v.status === 'active' ? 'var(--success)' : 'var(--warning)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                         {v.status}
                      </div>
                   </div>
                   
                   <div style={{ padding: '1.5rem' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                         <h4 style={{ margin: 0, fontSize: '1rem' }}>{v.name}</h4>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.type} • {v.fuelType} Engine</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <Activity size={14} color="var(--text-muted)" />
                               <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status Index</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>94%</span>
                         </div>
                         <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                            <div style={{ width: '94%', height: '100%', background: 'linear-gradient(90deg, var(--primary-accent), #818cf8)', borderRadius: '10px' }}></div>
                         </div>
                      </div>

                      <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Personnel</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{v.assignedDriver?.name || 'Unassigned'}</span>
                         </div>
                         {v.assignedDriver && (
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Shield size={16} color="var(--primary-accent)" />
                           </div>
                         )}
                      </div>

                      <div style={{ marginTop: '2rem', display: 'flex', gap: '8px' }}>
                         <button className="secondary" style={{ flex: 1, padding: '10px' }} onClick={() => { setEditingVehicle(v); setFormData(v); setActiveTab('add') }}><Edit3 size={14}/> Config</button>
                         <button className="secondary" style={{ flex: 1, padding: '10px', color: 'var(--danger)' }} onClick={() => handleDeleteVehicle(v._id)}><Trash2 size={14}/> Prune</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="glass-card animate-fade-in" style={{ padding: '3rem', maxWidth: '800px' }}>
               <h3 className="outfit" style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>{editingVehicle ? 'Operational Update' : 'Unit Acquisition'}</h3>
               <form onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                     <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Asset Model Name</label>
                     <input placeholder="e.g. Toyota Camry Hybrid" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Identification Plate</label>
                     <input placeholder="DL 01 AB 1234" value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} required />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Chassis ID / Registration</label>
                     <input placeholder="REG-100200300" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} required />
                  </div>
                  <div style={{ marginTop: '2rem', gridColumn: 'span 2' }}>
                     <button style={{ width: '100%', height: '54px' }}>{editingVehicle ? 'Commit Changes' : 'Initialize Acquisition'}</button>
                  </div>
               </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
