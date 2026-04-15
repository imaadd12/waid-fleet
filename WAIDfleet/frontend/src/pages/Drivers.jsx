import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
  Users, Plus, Calendar, Trophy, DollarSign, AlertTriangle, 
  CreditCard, PieChart as PieChartIcon, ClipboardList, Banknote, 
  Target, FileText, Share2, User, MessageSquare, Ticket, Search, 
  ChevronRight, Filter, Download, Mail, Upload, CheckCircle, XCircle, Activity
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import '../styles/Dashboard.css'

export function Drivers() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, revenue: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/drivers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (data.success) {
        const total = data.pagination.totalDrivers
        const active = data.data.filter(d => d.isActive).length
        const pending = data.data.filter(d => d.verificationStatus === 'pending').length
        setStats({ total, active, pending, revenue: 12400 }) // Mock revenue for now
      }
    } catch (e) { console.error(e) }
  }

  const tabs = [
    { id: 'overview',     label: 'Intelligence Overview', icon: <Users size={18}/> },
    { id: 'add-driver',   label: 'Enrollment Console',    icon: <Plus size={18}/> },
    { id: 'bulk-enroll',  label: 'Bulk Deployment',       icon: <Upload size={18}/> },
    { id: 'performance',  label: 'Performance KPIs',      icon: <Trophy size={18}/> },
    { id: 'billing',      label: 'Invoice Repository',    icon: <FileText size={18}/> },
    { id: 'notifications',label: 'Fleet Guardian',        icon: <MessageSquare size={18}/> },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <aside className="glass-pane" style={{ width: '300px', borderRadius: 0, borderRight: '1px solid var(--border-subtle)', background: 'rgba(15, 18, 24, 0.4)', padding: '2rem 1rem', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '0 1rem 2rem' }}>
           <h1 className="outfit" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--primary-accent) 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Ops</h1>
           <div style={{ height: '4px', width: '30px', background: 'var(--primary-accent)', borderRadius: '10px' }}></div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? '' : 'secondary'}
              style={{
                justifyContent: 'flex-start',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? 'var(--primary-accent)' : 'transparent',
                borderColor: 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
           <button onClick={() => navigate('/admin')} className="secondary" style={{ width: '100%' }}>Back to Command</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '3rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
          <div>
            <h2 className="outfit" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{tabs.find(t=>t.id===activeTab)?.label}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Fleet-wide workforce logistics and operational mastery.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Status</div>
               <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.9rem' }}>SECURE</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <User size={20} color="var(--primary-accent)" />
            </div>
          </div>
        </header>

        <div className="tab-content animate-fade-in">
          {activeTab === 'overview' && <DriverOverview stats={stats} />}
          {activeTab === 'add-driver' && <AddDriver onComplete={fetchStats} />}
          {activeTab === 'bulk-enroll' && <BulkEnrollment onComplete={fetchStats} />}
          
          {['performance', 'billing', 'notifications'].includes(activeTab) && (
            <div className="glass-card" style={{ padding: '5rem', textAlign: 'center' }}>
               <ClipboardList size={64} color="var(--primary-accent)" style={{ margin: '0 auto 2rem' }} />
               <h3 className="outfit" style={{ fontSize: '1.5rem' }}>Module Migration in Progress</h3>
               <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                 We are upgrading the {tabs.find(t=>t.id===activeTab)?.label} to the Operations OS design language. Available shortly.
               </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function DriverOverview({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
       {[
          { label: 'Total Pilots', value: stats.total, sub: 'Global network registry', icon: <Users size={24}/>, color: 'var(--primary-accent)' },
          { label: 'On-Duty Assets', value: stats.active, sub: 'Live deployment status', icon: <Activity size={24}/>, color: 'var(--success)' },
          { label: 'KYC Pending', value: stats.pending, sub: 'Verification queue', icon: <Shield size={24}/>, color: 'var(--warning)' },
          { label: 'Weekly Gross', value: `₹${stats.revenue.toLocaleString()}`, sub: 'Consolidated yield', icon: <DollarSign size={24}/>, color: 'var(--info)' }
       ].map((card, i) => (
         <div key={i} className="glass-card" style={{ gridColumn: 'span 3', padding: '2.5rem' }}>
            <div style={{ color: card.color, marginBottom: '2rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{card.label}</div>
            <div className="outfit" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{card.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>{card.sub}</div>
         </div>
       ))}

       <div className="glass-card" style={{ gridColumn: 'span 12', padding: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
             <h3 className="outfit" style={{ fontSize: '1.5rem', margin: 0 }}>Active Sector Activity</h3>
             <button className="secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Export Log</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {[1,2,3].map(i => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-accent)' }}>P{i}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Pilot-0{i} initialized sector sequence</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Logistics Hub A • Noida • 14:2{i} IST</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ color: 'var(--success)', fontWeight: 800 }}>+₹1,240</div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operational Yield</div>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  )
}

function AddDriver({ onComplete }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState({ aadharCard: null, drivingLicense: null, panCard: null })
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', age: '', experience: '',
    aadharNumber: '', panNumber: '', licenseNumber: '', licenseExpiry: '',
    street: '', city: '', state: '', pincode: '',
    enforceSecurity: true,
    rentType: 'weekly',
    rentAmount: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target
    setFiles(prev => ({ ...prev, [name]: uploadedFiles[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, val]) => {
         if (['street', 'city', 'state', 'pincode'].includes(key)) {
            // Nested address handling is handled by the flatten/unflatten logic in backend or just send as JSON string
         } else {
            data.append(key, val)
         }
      })
      
      // Construct address object for backend
      data.append('address', JSON.stringify({
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      }))

      // Append files
      if (files.aadharCard) data.append('aadharCard', files.aadharCard)
      if (files.drivingLicense) data.append('drivingLicense', files.drivingLicense)
      if (files.panCard) data.append('panCard', files.panCard)

      const res = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: data
      })
      const result = await res.json()
      if (result.success) {
        setSuccess(true)
        if (onComplete) onComplete()
      } else {
        alert(result.message || "Enrollment failed")
      }
    } catch (err) {
      console.error(err)
      alert("System error during enrollment execution")
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
       <CheckCircle size={80} color="var(--success)" style={{ margin: '0 auto 2rem' }} />
       <h3 className="outfit" style={{ fontSize: '2rem' }}>Pilot Enrolled</h3>
       <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Pilot credentials generated and telemetry systems initialized.</p>
       <button onClick={() => setSuccess(false)}>Enroll Another</button>
    </div>
  )

  return (
    <div className="glass-card" style={{ padding: '4rem', maxWidth: '1000px', margin: '0 auto' }}>
       <div style={{ marginBottom: '4rem' }}>
          <h3 className="outfit" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Tactical Enrollment</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Enter precise biographical and professional telemetry for the candidate.</p>
       </div>

       <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          
          <div style={{ gridColumn: 'span 2' }}>
             <h4 style={{ color: 'var(--primary-accent)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16}/> Identification Matrix
             </h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div className="input-group">
                   <label>Full Name</label>
                   <input name="name" value={formData.name} onChange={handleChange} required placeholder="Legal Name" />
                </div>
                <div className="input-group">
                   <label>Phone Line</label>
                   <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="10 Digits" />
                </div>
                <div className="input-group">
                   <label>Email ID</label>
                   <input name="email" value={formData.email} onChange={handleChange} required type="email" placeholder="admin@waid.in" />
                </div>
                <div className="input-group">
                   <label>Access Pin</label>
                   <input name="password" value={formData.password} onChange={handleChange} required type="password" placeholder="••••••••" />
                </div>
             </div>
          </div>

          <div>
             <h4 style={{ color: 'var(--primary-accent)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={16}/> KYC Repository
             </h4>
             <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div className="input-group">
                   <label>Aadhar ID</label>
                   <input name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} required placeholder="12 Digit ID" />
                </div>
                <div className="input-group">
                   <label>PAN ID</label>
                   <input name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
                </div>
                <div className="input-group">
                   <label>License No</label>
                   <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required placeholder="DL-XXXXXXX" />
                </div>
                <div className="input-group">
                   <label>License Expiry</label>
                   <input name="licenseExpiry" type="date" value={formData.licenseExpiry} onChange={handleChange} required />
                </div>
             </div>
          </div>

          <div>
             <h4 style={{ color: 'var(--primary-accent)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={16}/> Operational Stats
             </h4>
             <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div className="input-group">
                   <label>Age</label>
                   <input name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="25" />
                </div>
                <div className="input-group">
                   <label>Experience (Years)</label>
                   <input name="experience" type="number" value={formData.experience} onChange={handleChange} required placeholder="5" />
                </div>
                <div className="input-group">
                   <label>Revenue Plan</label>
                   <select name="rentType" value={formData.rentType} onChange={handleChange} style={{ height: '52px' }}>
                      <option value="weekly">Weekly Lease</option>
                      <option value="monthly">Monthly Lease</option>
                   </select>
                </div>
                <div className="input-group">
                   <label>Fixed Rent (₹)</label>
                   <input name="rentAmount" type="number" value={formData.rentAmount} onChange={handleChange} required placeholder="3500" />
                </div>
             </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
             <h4 style={{ color: 'var(--primary-accent)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={16}/> Primary Residence
             </h4>
             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group"><label>Street Address</label><input name="street" value={formData.street} onChange={handleChange} required /></div>
                <div className="input-group"><label>City</label><input name="city" value={formData.city} onChange={handleChange} required /></div>
                <div className="input-group"><label>State</label><input name="state" value={formData.state} onChange={handleChange} required /></div>
                <div className="input-group"><label>Pincode</label><input name="pincode" value={formData.pincode} onChange={handleChange} required /></div>
             </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
             <h4 style={{ color: 'var(--primary-accent)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16}/> Document Verification Hub
             </h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="file-upload">
                   <label>Aadhar Front/Back</label>
                   <input type="file" name="aadharCard" onChange={handleFileChange} required />
                   <div className="upload-btn">{files.aadharCard ? '✓ Selected' : 'Upload PDF/JPG'}</div>
                </div>
                <div className="file-upload">
                   <label>Driving License</label>
                   <input type="file" name="drivingLicense" onChange={handleFileChange} required />
                   <div className="upload-btn">{files.drivingLicense ? '✓ Selected' : 'Upload PDF/JPG'}</div>
                </div>
                <div className="file-upload">
                   <label>PAN Card (Optional)</label>
                   <input type="file" name="panCard" onChange={handleFileChange} />
                   <div className="upload-btn">{files.panCard ? '✓ Selected' : 'Upload PDF/JPG'}</div>
                </div>
             </div>
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '2rem' }}>
             <button type="submit" disabled={loading} style={{ width: '100%', height: '60px', fontSize: '1.2rem', background: 'linear-gradient(90deg, var(--primary-accent), #c084fc)', border: 'none', color: 'white' }}>
               {loading ? 'Initializing Telemetry...' : 'Execute Full Enrollment'}
             </button>
          </div>
       </form>

       <style>{`
          .input-group label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; font-family: 'Outfit', sans-serif; text-transform: uppercase; }
          .file-upload { position: relative; }
          .file-upload input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
          .upload-btn { height: 52px; background: var(--bg-elevated); border: 1px dashed var(--border-subtle); border-radius: 12px; display: flex; alignItems: center; justifyContent: center; font-size: 0.85rem; color: var(--text-secondary); transition: all 0.2s; }
          .file-upload:hover .upload-btn { border-color: var(--primary-accent); background: rgba(99,102,241,0.05); }
       `}</style>
    </div>
  )
}

function BulkEnrollment({ onComplete }) {
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleBulkSubmit = async () => {
    try {
      setLoading(true)
      const driversArr = JSON.parse(data)
      const res = await fetch('/api/drivers/bulk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ drivers: driversArr })
      })
      const result = await res.json()
      setResults(result.data)
      if (onComplete) onComplete()
    } catch (e) {
      alert("Invalid JSON format. Please ensure all required fields are present.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card" style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
       <h3 className="outfit" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bulk Deployment Console</h3>
       <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Deploy multiple pilots simultaneously via JSON matrix input.</p>
       
       <textarea 
         placeholder='[{"name": "John Doe", "phone": "9876543210", ...}]' 
         style={{ width: '100%', height: '300px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#c084fc' }}
         value={data}
         onChange={e => setData(e.target.value)}
       />
       
       <button 
         onClick={handleBulkSubmit} 
         disabled={loading || !data}
         style={{ width: '100%', marginTop: '2rem', height: '56px' }}
       >
         {loading ? 'Executing Bulk Sequence...' : 'Initialize Batch Deployment'}
       </button>

       {results && (
         <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
            <h4 className="outfit" style={{ marginBottom: '1.5rem' }}>Deployment Summary</h4>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
               <div style={{ color: 'var(--success)', fontWeight: 800 }}>✓ {results.success.length} Pilot(s) Online</div>
               <div style={{ color: 'var(--danger)', fontWeight: 800 }}>✗ {results.failed.length} Pilot(s) Rejected</div>
            </div>
            {results.failed.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                 {results.failed.map((f, i) => <div key={i}>• {f.driver}: {f.reason}</div>)}
              </div>
            )}
         </div>
       )}
    </div>
  )
}
