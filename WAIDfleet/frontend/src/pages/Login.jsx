import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Shield, Car, ArrowRight, Lock, Eye, EyeOff, CheckCircle, Globe, Zap, Cpu, Orbit } from 'lucide-react'

export function Login() {
  const [portal, setPortal] = useState(null) // null | 'admin' | 'driver'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (portal) {
      setError('')
      setEmail('')
      setPassword('')
    }
  }, [portal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const resp = await login(email, password, portal)
      const role = resp?.data?.role || ''
      
      if (portal === 'admin') {
        const adminRoles = ['admin', 'super_admin', 'sub_admin', 'finance', 'operations', 'support', 'manager', 'superadmin']
        if (adminRoles.includes(role)) {
          navigate('/admin')
        } else {
          setError('⛔ Unauthorized: Access Denied. Registered Admins Only.')
          setLoading(false)
          return
        }
      } else {
        if (['admin', 'super_admin', 'superadmin'].includes(role)) {
          setError('⛔ Redirect: Admin accounts must utilize the System Command Center.')
          setLoading(false)
          return
        }
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  if (!portal) {
    return (
      <div className="premium-gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '1000px' }} className="animate-fade-up">
          
          <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(99,102,241,0.1)', padding: '8px 20px', borderRadius: '100px', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '2rem' }}>
              <Orbit size={18} className="text-glow" style={{ color: 'var(--primary-accent)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational Intelligence Engine</span>
            </div>
            
            <h1 className="outfit" style={{ 
              fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-4px', margin: 0,
              background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.4) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 0.95, textTransform: 'uppercase'
            }}>
              Waid Fleet <span style={{ color: 'var(--primary-accent)', WebkitTextFillColor: 'initial' }}>.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1.5rem', fontWeight: '500' }}>
              The future of fleet management, decoded into real-time precision.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            <div onClick={() => setPortal('admin')} className="glass-card" style={{ padding: '3rem', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)', marginBottom: '2rem' }}>
                <Shield size={32} />
              </div>
              <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Admin Gateway</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Manage fleet infrastructure, financial auditing, and systemic optimizations.
              </p>
              <div className="entry-action" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', fontWeight: 800 }}>
                Enter Command Hub <ArrowRight size={18} />
              </div>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>
                <Cpu size={140} />
              </div>
            </div>

            <div onClick={() => setPortal('driver')} className="glass-card" style={{ padding: '3rem', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '2rem' }}>
                <Car size={32} />
              </div>
              <h2 className="outfit" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Driver Terminal</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Real-time trip analytics, revenue extraction, and pilot performance.
              </p>
              <div className="entry-action" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 800 }}>
                Launch Cockpit <ArrowRight size={18} />
              </div>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>
                <Zap size={140} />
              </div>
            </div>
          </div>
          
          <footer style={{ marginTop: '5rem', display: 'flex', justifySelf: 'center', gap: '40px', opacity: 0.4 }}>
             <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><CheckCircle size={16}/> End-to-End Encryption</span>
             <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Globe size={16}/> Nodes: Active</span>
             <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Shield size={16}/> V3.0 Core</span>
          </footer>
        </div>
      </div>
    )
  }

  const isAdmin = portal === 'admin'
  return (
    <div className="premium-gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-pane animate-fade-scale" style={{ width: '100%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '450px 1fr', overflow: 'hidden', borderRadius: '40px' }}>
        
        {/* Left: Input Sector */}
        <div style={{ padding: '4rem 3.5rem', background: 'rgba(15, 18, 24, 0.4)' }}>
          <button onClick={() => setPortal(null)} className="secondary" style={{ marginBottom: '3rem', padding: '6px 14px', fontSize: '0.8rem' }}>
            ← Switch Gateway
          </button>

          <header style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--primary-accent)', letterSpacing: '2px', marginBottom: '1rem', background: 'rgba(99,102,241,0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: '4px' }}>
              {isAdmin ? 'SYSTEM SECURED | REGISTERED ADMINS ONLY' : 'PILOT INTERFACE'}
            </div>
            <h2 className="outfit" style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.8rem' }}>
              {isAdmin ? 'Commander Sync' : 'Pilot Authentication'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Initialize sequence to enter the {isAdmin ? 'Command Center' : 'Terminal Interface'}.
            </p>
          </header>

          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Universal ID</label>
              <input 
                type="email" 
                placeholder="identification@waid.io" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Access Protocol</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '50px' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                  {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" style={{ 
              marginTop: '1rem', height: '56px',
              background: isAdmin ? 'var(--primary-accent)' : 'var(--success)',
              boxShadow: isAdmin ? '0 10px 30px rgba(99, 102, 241, 0.3)' : '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}>
              {loading ? 'Decrypting...' : `Initialize Access Mode`}
            </button>
          </form>

          <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
             <Link to="/forgot-password" style={{ color: isAdmin ? 'var(--primary-accent)' : 'var(--success)', textDecoration: 'none', fontWeight: '900', letterSpacing: '1px', borderBottom: `2px solid ${isAdmin ? 'var(--primary-accent)' : 'var(--success)'}`, paddingBottom: '2px' }}>LOST ACCESS PROTOCOL?</Link>
             {!isAdmin && (
               <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                 New Pilot? <Link to="/register" style={{ color: 'var(--success)', fontWeight: '800', textDecoration: 'none' }}>RECRUITMENT OPEN</Link>
               </div>
             )}
          </div>
        </div>

        {/* Right: Visual Projection */}
        <div style={{ 
          background: isAdmin 
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' 
            : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem',
          position: 'relative',
          textAlign: 'center'
        }}>
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '10%', left: '10%', border: '1px solid white', width: '200px', height: '200px', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '10%', right: '10%', border: '1px solid white', width: '300px', height: '300px', borderRadius: '50%' }}></div>
           </div>

           <div style={{ marginBottom: '3rem', position: 'relative' }}>
             {isAdmin ? (
               <div style={{ width: '180px', height: '180px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                 <Shield size={80} color="var(--primary-accent)" className="text-glow" />
               </div>
             ) : (
               <div style={{ width: '180px', height: '180px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                 <Zap size={80} color="var(--success)" className="text-glow" />
               </div>
             )}
           </div>
           
           <h3 className="outfit" style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: 1.1 }}>
             {isAdmin ? 'Secure System Integrity' : 'Maximum Pilot Efficiency'}
           </h3>
           <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: '320px', lineHeight: 1.6, fontWeight: '500' }}>
             {isAdmin 
               ? 'Encrypted gateway for global fleet monitoring and systemic overrides.' 
               : 'Telemetry synchronization for trip validation, earnings, and asset care.'}
           </p>

           <div style={{ marginTop: '4rem', display: 'flex', gap: '15px' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 800 }}>METER: {isAdmin ? 'SYSTEM' : 'PILOT'}</div>
              <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 800 }}>REGION: GLO</div>
           </div>
        </div>
      </div>
    </div>
  )
}
