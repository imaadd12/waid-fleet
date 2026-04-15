import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { 
  PieChart as PieChartIcon, ChartArea as AreaIcon, Shield, DollarSign, Target, Trophy, 
  Mail, CheckCircle, Activity, Clock, TrendingUp, AlertTriangle, Play, Info, User,
  Star, BarChart as BarChartIcon, MapPin, List, Lock, Navigation, ChevronRight, Globe
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import '../styles/Dashboard.css'
import '../styles/Auth.css'

export function Performance() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [driverId, setDriverId] = useState(user?.id)
  const [activeTab, setActiveTab] = useState('overview')
  const [performance, setPerformance] = useState(null)
  const [ratingBreakdown, setRatingBreakdown] = useState(null)
  const [hourlyData, setHourlyData] = useState({})
  const [weeklyData, setWeeklyData] = useState({})
  const [incidents, setIncidents] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [goals, setGoals] = useState([])
  const [alerts, setAlerts] = useState([])
  const [badges, setBadges] = useState({ earned: [], available: [] })
  const [comparison, setComparison] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newGoal, setNewGoal] = useState({ type: '', targetValue: 0, deadline: '', reward: 0 })

  useEffect(() => {
    if (driverId) fetchAllData()
  }, [driverId])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [perfRes, ratingRes, hourlyRes, weeklyRes, incidentRes, earningsRes, goalsRes, alertsRes, badgesRes, compareRes, leaderRes, insightRes] =
        await Promise.all([
          fetch(`/api/performance/dashboard/${driverId}`, { headers }),
          fetch(`/api/performance/ratings/${driverId}`, { headers }),
          fetch(`/api/performance/hourly/${driverId}`, { headers }),
          fetch(`/api/performance/weekly-patterns/${driverId}`, { headers }),
          fetch(`/api/performance/incidents/${driverId}`, { headers }),
          fetch(`/api/performance/earnings/${driverId}`, { headers }),
          fetch(`/api/performance/goals/${driverId}`, { headers }),
          fetch(`/api/performance/alerts/${driverId}`, { headers }),
          fetch(`/api/performance/badges/${driverId}`, { headers }),
          fetch(`/api/performance/compare/${driverId}`, { headers }),
          fetch(`/api/performance/leaderboard`, { headers }),
          fetch(`/api/performance/insights/${driverId}`, { headers })
        ])

      const [perfData, ratingData, hourlyD, weeklyD, incidentD, earningsD, goalsD, alertsD, badgesD, compareD, leaderD, insightD] =
        await Promise.all([
          perfRes.json(), ratingRes.json(), hourlyRes.json(), weeklyRes.json(),
          incidentRes.json(), earningsRes.json(), goalsRes.json(), alertsRes.json(), badgesRes.json(),
          compareRes.json(), leaderRes.json(), insightRes.json()
        ])

      setPerformance(perfData.data)
      setRatingBreakdown(ratingData.data)
      setHourlyData(hourlyD.data || {})
      setWeeklyData(weeklyD.data || {})
      setIncidents(incidentD.incidents || [])
      setEarnings(earningsD.data)
      setGoals(goalsD.data || [])
      setAlerts(alertsD.data || [])
      setBadges(badgesD.data || { earned: [], available: [] })
      setComparison(compareD.data)
      setLeaderboard(leaderD.data || [])
      setInsights(insightD.data)
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/performance/goals/${driverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newGoal)
      })
      if (res.ok) {
        setNewGoal({ type: '', targetValue: 0, deadline: '', reward: 0 })
        fetchAllData()
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--primary-accent)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ marginLeft: '1rem', fontWeight: 600 }}>Deciphering telemetry data...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  
  if (!performance) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-deep)', color: 'white' }}>
       <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
       <h2 className="outfit">Telemetry Offline</h2>
       <p style={{ color: 'var(--text-secondary)' }}>Unable to establish connection with Pilot Performance systems.</p>
       <button onClick={() => navigate('/admin')} className="secondary" style={{ marginTop: '2rem' }}>Return to Command</button>
    </div>
  )

  const hourlyArray = Object.entries(hourlyData).map(([hour, data]) => ({ hour: `${hour}:00`, ...data }))
  const weeklyArray = Object.entries(weeklyData).map(([day, data]) => ({ day, ...data }))
  const leaderboardArray = leaderboard.slice(0, 10).map((item, idx) => ({ ...item, rank: idx + 1 }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'white' }}>
      
      {/* Tactical Sidebar */}
      <aside className="glass-pane" style={{ width: '280px', borderRadius: 0, borderRight: '1px solid var(--border-subtle)', background: 'rgba(15, 18, 24, 0.4)', padding: '2rem 1rem', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 1rem 3rem' }}>
           <h1 className="outfit" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Performance OS</h1>
           <div style={{ height: '4px', width: '30px', background: 'var(--primary-accent)', borderRadius: '10px' }}></div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {[
            { id: 'overview',     label: 'Tactical Overview', icon: <PieChartIcon size={18}/> },
            { id: 'analytics',    label: 'Deep Analytics',    icon: <AreaIcon size={18}/> },
            { id: 'safety',       label: 'Safety Audit',      icon: <Shield size={18}/> },
            { id: 'earnings',     label: 'Revenue Growth',    icon: <DollarSign size={18}/> },
            { id: 'goals',        label: 'Objective Tracker', icon: <Target size={18}/> },
            { id: 'leaderboard',  label: 'Global Ranking',    icon: <Trophy size={18}/> },
            { id: 'insights',     label: 'AI Insights',       icon: <Info size={18}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? '' : 'secondary'}
              style={{
                justifyContent: 'flex-start',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                background: activeTab === tab.id ? 'var(--primary-accent)' : 'transparent',
                borderColor: 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
           <button onClick={() => navigate('/admin')} className="secondary" style={{ width: '100%', padding: '10px' }}>Return to Control</button>
        </div>
      </aside>

      {/* Primary Intelligence Feed */}
      <main style={{ flex: 1, padding: '3rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Pilot Telemetry</span>
            <h2 className="outfit" style={{ fontSize: '3rem', marginTop: '0.5rem' }}>{performance.driverId?.name}</h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
               <span style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>TIER: {performance.level?.toUpperCase()}</span>
               <span style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>STATUS: ACTIVE</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px' }}>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SAFETY SCORE</div>
                <div className="outfit" style={{ fontSize: '2.5rem', fontWeight: 800, color: performance.safetyScore >= 80 ? 'var(--success)' : 'var(--danger)' }}>{performance.safetyScore}</div>
             </div>
             <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AVG RATING</div>
                <div className="outfit" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>★ {performance.avgRating}</div>
             </div>
          </div>
        </header>

        <section className="animate-fade-in">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
              <div className="glass-card" style={{ gridColumn: 'span 5', padding: '2.5rem' }}>
                <h3 className="outfit" style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>Core Attributes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { category: 'Rating', value: performance.avgRating * 20 },
                    { category: 'Completion', value: performance.completionRate },
                    { category: 'On-Time', value: performance.onTimeDeliveryRate },
                    { category: 'Safety', value: performance.safetyScore },
                    { category: 'Acceptance', value: performance.acceptanceRate }
                  ]}>
                    <PolarGrid stroke="var(--border-subtle)" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Pilot" dataKey="value" stroke="var(--primary-accent)" fill="var(--primary-accent)" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: 'span 7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[
                  { label: 'Completion Rate', value: `${performance.completionRate}%`, icon: <CheckCircle size={20}/>, color: 'var(--success)' },
                  { label: 'System Acceptance', value: `${performance.acceptanceRate}%`, icon: <Activity size={20}/>, color: 'var(--primary-accent)' },
                  { label: 'On-Time Accuracy', value: `${performance.onTimeDeliveryRate}%`, icon: <Clock size={20}/>, color: '#38bdf8' },
                  { label: 'Daily Momentum', value: performance.tripsPerDay, icon: <TrendingUp size={20}/>, color: 'var(--warning)' },
                ].map((s, i) => (
                  <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ color: s.color, marginBottom: '1.2rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                    <div className="outfit" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h4 className="outfit" style={{ margin: 0 }}>Tier Elevation Progress</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>NEXT RANK: <span style={{ color: 'white' }}>PLATINUM ELITE</span></span>
                 </div>
                 <div style={{ height: '12px', background: 'var(--bg-elevated)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, var(--primary-accent), #c084fc)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}></div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Current: <strong style={{ color: 'white' }}>8.2k Points</strong></span>
                    <span>10k Points Required</span>
                 </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
              <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                <h3 className="outfit" style={{ marginBottom: '2.5rem' }}>Hourly Operational Velocity</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={hourlyArray}>
                    <defs>
                      <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'white' }} />
                    <Area type="monotone" dataKey="trips" stroke="var(--primary-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                <h3 className="outfit" style={{ marginBottom: '2.5rem' }}>Weekly Pattern Extraction</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={weeklyArray}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'white' }} />
                    <Bar dataKey="earnings" fill="var(--primary-accent)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SAFETY TAB */}
          {activeTab === 'safety' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
               <div className="glass-card" style={{ gridColumn: 'span 4', padding: '2.5rem', borderTop: `6px solid ${performance.safetyScore >= 80 ? 'var(--success)' : 'var(--danger)'}` }}>
                  <h4 className="outfit" style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Safety Posture Index</h4>
                  <div style={{ fontSize: '4rem', fontWeight: 800 }}>{performance.safetyScore}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Comprehensive safety quotient synthesized from real-time telemetry and incident reports.</p>
               </div>

               <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {[
                    { label: 'Speeding Violations', value: performance.speedingViolations, color: performance.speedingViolations > 0 ? 'var(--warning)' : 'var(--success)' },
                    { label: 'Harsh Maneuvers', value: performance.hardBrakingCount, color: performance.hardBrakingCount > 2 ? 'var(--danger)' : 'var(--success)' },
                    { label: 'Active Incidents', value: performance.incidents, color: performance.incidents > 0 ? 'var(--danger)' : 'var(--success)' },
                    { label: 'Collision History', value: performance.accidentCount, color: performance.accidentCount > 0 ? 'var(--danger)' : 'var(--success)' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                       <div className="outfit" style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
               </div>

               <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                  <h3 className="outfit" style={{ marginBottom: '2rem' }}>Tactical Incident Repository</h3>
                  {incidents.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</th>
                            <th style={{ textAlign: 'right', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incidents.slice(0, 10).map((incident, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '1.2rem' }}><span style={{ color: 'var(--danger)', fontWeight: 700 }}>{incident.type?.toUpperCase()}</span></td>
                              <td style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{incident.description}</td>
                              <td style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(incident.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px' }}>No recorded safety breaches in current sector.</div>}
               </div>
            </div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === 'earnings' && earnings && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
               <div className="glass-card" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
                  <h4 className="outfit" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>Gross Yield</h4>
                  <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--success)' }}>₹{earnings.totalEarnings.toFixed(0)}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Accumulated liquidity including base revenue and operational multipliers.</p>
               </div>

               <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Yield per Deployment</div>
                    <div className="outfit" style={{ fontSize: '2rem', fontWeight: 800 }}>₹{earnings.avgPerTrip.toFixed(0)}</div>
                  </div>
                  <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Hourly Velocity Index</div>
                    <div className="outfit" style={{ fontSize: '2rem', fontWeight: 800 }}>₹{earnings.avgPerHour.toFixed(0)}</div>
                  </div>
               </div>

               <div className="glass-card" style={{ gridColumn: 'span 6', padding: '2.5rem' }}>
                  <h4 className="outfit" style={{ marginBottom: '2.5rem' }}>Revenue Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     {[
                       { label: 'Fundamental Payload', value: earnings.breakdown.baseEarnings, color: 'var(--primary-accent)' },
                       { label: 'Tactical Bonuses', value: earnings.breakdown.bonusEarnings, color: 'var(--success)' },
                       { label: 'Incentive Multiplier', value: earnings.breakdown.incentiveEarnings, color: '#38bdf8' },
                     ].map((b, i) => (
                       <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                             <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                             <span style={{ fontWeight: 700 }}>₹{b.value.toFixed(0)}</span>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                             <div style={{ width: `${(b.value / earnings.totalEarnings) * 100}%`, height: '100%', background: b.color, borderRadius: '10px' }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="glass-card" style={{ gridColumn: 'span 6', padding: '2.5rem' }}>
                  <h4 className="outfit" style={{ marginBottom: '2.5rem' }}>Trajectory Projections</h4>
                  <div style={{ background: 'rgba(16,185,129,0.05)', padding: '2rem', borderRadius: '20px', marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Weekly Estimated Yield</div>
                     <div className="outfit" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>₹{earnings.projection.weeklyProjection}</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.05)', padding: '2rem', borderRadius: '20px', borderLeft: '4px solid var(--success)' }}>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Monthly Estimated Yield</div>
                     <div className="outfit" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>₹{earnings.projection.monthlyProjection}</div>
                  </div>
               </div>
            </div>
          )}

          {/* GOALS TAB */}
          {activeTab === 'goals' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
              <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                 <h3 className="outfit" style={{ marginBottom: '2rem' }}>Strategic Objective Deployment</h3>
                 <form onSubmit={handleCreateGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>OBJECTIVE TYPE</label>
                       <input value={newGoal.type} onChange={e=>setNewGoal({...newGoal, type: e.target.value})} placeholder="e.g. Night Ops" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>TARGET QUANTITY</label>
                       <input type="number" value={newGoal.targetValue} onChange={e=>setNewGoal({...newGoal, targetValue: e.target.value})} placeholder="0" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>DEADLINE</label>
                       <input type="date" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal, deadline: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                       <button type="submit" style={{ width: '100%', height: '50px' }}>Deploy Objective</button>
                    </div>
                 </form>
              </div>

              {goals.map((goal, idx) => (
                <div key={idx} className="glass-card" style={{ gridColumn: 'span 4', padding: '2.5rem', borderTop: `6px solid ${goal.completed ? 'var(--success)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                    <div>
                       <h4 className="outfit" style={{ margin: 0, fontSize: '1.2rem' }}>{goal.type}</h4>
                       <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                    </div>
                    {goal.completed ? <CheckCircle size={24} color="var(--success)"/> : <Activity size={24} color="var(--warning)"/>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>{goal.currentValue} / {goal.targetValue} Unit</span>
                     <span style={{ fontWeight: 700, color: 'white' }}>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`, height: '100%', background: goal.completed ? 'var(--success)' : 'var(--warning)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                 <div>
                    <h3 className="outfit" style={{ margin: 0 }}>Global Fleet Merit Order</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>Elite pilot rankings across the entire network architecture.</p>
                 </div>
                 <Globe size={32} color="var(--primary-accent)" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pilot / Call-Sign</th>
                      <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Merit Index</th>
                      <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Payout</th>
                      <th style={{ textAlign: 'right', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Deployments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardArray.map((lb, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: lb.driverId?._id === driverId ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1.5rem', fontWeight: 800, color: idx < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                           {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${lb.rank}`}
                        </td>
                        <td style={{ padding: '1.5rem' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>{lb.driverId?.name?.charAt(0)}</div>
                              <div>
                                 <div style={{ fontWeight: 700, fontSize: '1rem' }}>{lb.driverId?.name}</div>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lb.driverId?._id?.slice(-8)}</div>
                              </div>
                           </div>
                        </td>
                        <td style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--warning)', fontWeight: 800 }}>★ {lb.avgRating}</td>
                        <td style={{ padding: '1.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>₹{lb.totalEarnings.toLocaleString()}</td>
                        <td style={{ padding: '1.5rem', textAlign: 'right', fontWeight: 600 }}>{lb.totalTrips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && insights && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
               <div className="glass-card" style={{ gridColumn: 'span 12', padding: '3.5rem', borderLeft: '8px solid var(--primary-accent)', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(15,18,24,0.4) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                     <div>
                        <h3 className="outfit" style={{ fontSize: '2rem', margin: 0 }}>Operational Intelligence Hub</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Heuristic analysis of your piloting performance and optimization potential.</p>
                     </div>
                     <div style={{ padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', color: 'var(--primary-accent)' }}>
                        <Info size={32} />
                     </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                     <div>
                        <h4 className="outfit" style={{ color: 'var(--success)', marginBottom: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <CheckCircle size={16}/> Dominant Strengths
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                           {insights.strengths.map((s, i) => (
                             <div key={i} style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', marginTop: '8px', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{s}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h4 className="outfit" style={{ color: 'var(--warning)', marginBottom: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <TrendingUp size={16}/> Optimization Required
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                           {insights.improvements.map((im, i) => (
                             <div key={i} style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', marginTop: '8px', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{im}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <hr style={{ margin: '4rem 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

                  <div>
                     <h4 className="outfit" style={{ color: '#38bdf8', marginBottom: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={16}/> Tactical Recommendations
                     </h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {insights.recommendations.map((r, i) => (
                          <div key={i} style={{ background: 'rgba(56,189,248,0.03)', padding: '2rem', borderRadius: '24px', display: 'flex', gap: '20px', border: '1px solid rgba(56,189,248,0.1)' }}>
                             <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Play size={20} color="#38bdf8"/>
                             </div>
                             <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{r}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

        </section>

      </main>
    </div>
  )
}
