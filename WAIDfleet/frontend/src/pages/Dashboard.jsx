import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { 
  Home, Wallet, ShieldCheck, User, Zap, Clock, 
  MapPin, AlertCircle, ChevronRight, Activity,
  TrendingUp, Award, Power, Bell, DollarSign,
  Car, ShieldAlert, BadgeCheck, Trophy
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { DriverPayouts } from './DriverPayouts'
import '../styles/Dashboard.css'

export function Dashboard() {
  const { user, token, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [onDuty, setOnDuty] = useState(user?.onDuty || false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [earnings, setEarnings] = useState({ totalEarnings: 0, thisWeekEarnings: 0, totalTrips: 0 })
  const [alerts, setAlerts] = useState([])
  const [performance, setPerformance] = useState(null)
  
  // Clock
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchEverything()
    if (user && user.onDuty !== undefined) setOnDuty(user.onDuty)
  }, [user])

  const fetchEverything = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [earnRes, alertsRes, perfRes] = await Promise.all([
        fetch('/api/earnings/summary', { headers }),
        fetch('/api/notifications/my-alerts', { headers }),
        fetch(`/api/performance/dashboard/${user?.id}`, { headers })
      ])
      
      const earnData = await earnRes.json()
      const alertsData = alertsRes.ok ? await alertsRes.json() : { data: [] }
      const perfData = await perfRes.json()

      setEarnings(earnData.data || { totalEarnings: 0, thisWeekEarnings: 0, totalTrips: 0 })
      setAlerts(alertsData.data || [])
      setPerformance(perfData.data)
    } catch (err) { console.error(err) }
  }

  const toggleDutyStatus = async () => {
    setLoadingStatus(true)
    const newStatus = !onDuty
    try {
      const res = await fetch('/api/auth/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onDuty: newStatus, location: { lat: 28.5355, lng: 77.3910 } })
      })
      if (res.ok) setOnDuty(newStatus)
    } catch (err) { console.error(err) } 
    finally { setLoadingStatus(false) }
  }

  const NAV_ITEMS = [
    { id: 'home', icon: <Home size={22}/>, label: 'Home' },
    { id: 'wallet', icon: <Wallet size={22}/>, label: 'Wallet' },
    { id: 'safety', icon: <ShieldCheck size={22}/>, label: 'Safety' },
    { id: 'profile', icon: <User size={22}/>, label: 'Account' },
  ]

  return (
    <div className="driver-portal-layout">
      {/* ── Left Sidebar ── */}
      <aside className="driver-sidebar">
        <div className="driver-brand">
          <div className="brand-dot" />
          <h1>WAID Pilot</h1>
        </div>

        <nav className="driver-nav">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={activeTab === item.id ? 'active' : ''}
            >
              <div className="nav-icon-box">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => { logout(); navigate('/login') }} className="driver-logout-btn">
             Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="driver-main">
        {/* Top Header */}
        <header className="driver-header">
          <div className="header-welcome">
            <h2>Hello, {user?.name?.split(' ')[0] || 'Pilot'}</h2>
            <p>Ready for your next trip?</p>
          </div>

          <div className="header-center">
            <div className="header-clock">
              <Clock size={16} />
              <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="header-actions">
             <button 
               onClick={toggleDutyStatus} 
               disabled={loadingStatus}
               className={`duty-toggle ${onDuty ? 'on-duty' : 'off-duty'}`}
             >
               <Power size={18} />
               {onDuty ? 'Go Offline' : 'Go Online'}
             </button>
             <button className="icon-btn notification-btn">
               <Bell size={20} />
               {alerts.length > 0 && <span className="badge" />}
             </button>
          </div>
        </header>

        {/* Home View */}
        {activeTab === 'home' && (
          <div className="driver-view-container animate-fade">
            {/* KPI Section */}
            <section className="driver-stats-grid">
               <div className="driver-stat-card">
                  <div className="stat-label">Total Earnings</div>
                  <div className="stat-value">₹{earnings.totalEarnings?.toLocaleString() || '0'}</div>
                  <div className="stat-trend up">+12.5% vs last week</div>
               </div>
               <div className="driver-stat-card">
                  <div className="stat-label">Total Trips</div>
                  <div className="stat-value">{earnings.totalTrips || '0'}</div>
                  <div className="stat-trend">Consistent volume</div>
               </div>
               <div className="driver-stat-card">
                  <div className="stat-label">Rating</div>
                  <div className="stat-value">4.8 <span className="star-icon">★</span></div>
                  <div className="stat-trend up">Top 5% of Pilots</div>
               </div>
               <div className="driver-stat-card health-card">
                  <div className="stat-label">Vehicle Health</div>
                  <div className="stat-value healthy">Good</div>
                  <div className="stat-trend">Oil change in 1,200km</div>
               </div>
            </section>

            {/* Performance Chart */}
            <section className="driver-chart-section glass-card">
               <div className="section-header">
                 <h3>Revenue Performance</h3>
                 <button className="text-btn">View Full Report</button>
               </div>
               <div className="chart-wrapper">
                 <ResponsiveContainer width="100%" height={240}>
                   <AreaChart data={[
                     { name: 'Mon', r: 400 }, { name: 'Tue', r: 500 }, { name: 'Wed', r: 450 },
                     { name: 'Thu', r: 800 }, { name: 'Fri', r: 700 }, { name: 'Sat', r: 900 }, { name: 'Sun', r: 1100 }
                   ]}>
                     <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                     <YAxis hide />
                     <Tooltip 
                       contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                       itemStyle={{ color: '#10b981' }}
                     />
                     <Area type="monotone" dataKey="r" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </section>

            {/* Bottom Row */}
            <div className="driver-bottom-grid">
               <section className="recent-activity-card glass-card">
                  <div className="section-header">
                    <h3>Recent Shifts</h3>
                    <TrendingUp size={18} color="#10b981" />
                  </div>
                  <div className="activity-list">
                    <div className="activity-item">
                       <div className="activity-icon"><Clock size={16}/></div>
                       <div className="activity-info">
                          <p className="act-title">Night Shift • Completed</p>
                          <p className="act-time">Yesterday, 10:00 PM - 6:00 AM</p>
                       </div>
                       <div className="activity-amount">₹1,240</div>
                    </div>
                    <div className="activity-item">
                       <div className="activity-icon"><Clock size={16}/></div>
                       <div className="activity-info">
                          <p className="act-title">Morning Shift • Completed</p>
                          <p className="act-time">Apr 13, 8:00 AM - 4:00 PM</p>
                       </div>
                       <div className="activity-amount">₹980</div>
                    </div>
                  </div>
               </section>

               <section className="safety-card glass-card">
                  <div className="section-header">
                    <h3>Safety Score</h3>
                    <ShieldCheck size={18} color="#10b981" />
                  </div>
                  <div className="safety-gauge-wrap">
                    <div className="safety-gauge-value">98</div>
                    <div className="safety-gauge-label">Elite Pilot Level</div>
                  </div>
                  <p className="safety-hint">No speeding or harsh braking detected this week. Keep it up!</p>
               </section>
            </div>
          </div>
        )}

        {/* Wallet View */}
        {activeTab === 'wallet' && <DriverPayouts />}

        {/* Safety & Profile Placeholders */}
        {['safety', 'profile'].includes(activeTab) && (
           <div className="driver-view-container placeholder-view">
             <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
             <p>This section is being synchronized with the main fleet server.</p>
           </div>
        )}
      </main>
    </div>
  )
}
