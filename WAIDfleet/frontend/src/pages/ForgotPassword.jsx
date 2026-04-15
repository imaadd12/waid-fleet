import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Key, Eye, EyeOff, CheckCircle } from 'lucide-react'

export function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError('Universal ID and security keys are required')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Security keys do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Security key must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.message || 'Verification sequence failed')
      }
    } catch (err) {
      setError('Network synchronization error. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-pane animate-fade-scale" style={{ width: '100%', maxWidth: '500px', padding: '3.5rem', borderRadius: '40px', textAlign: 'center' }}>
        
        <div style={{ width: '80px', height: '80px', background: 'rgba(99,102,241,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)', margin: '0 auto 2.5rem' }}>
          <Key size={40} />
        </div>

        <header style={{ marginBottom: '3rem' }}>
          <h2 className="outfit" style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.8rem' }}>
            Credential Recovery
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Initialize password override sequence for your Waid Fleet account.
          </p>
        </header>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
        {message && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Universal ID</label>
            <input
              type="email"
              name="email"
              placeholder="identification@waid.io"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>New Security Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="newPassword"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={handleChange}
                required
                style={{ paddingRight: '50px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm Security Key</label>
            <input
              type={showPass ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ height: '56px', marginTop: '1rem' }}>
            {loading ? 'Resynchronizing...' : 'Re-establish Credentials'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Link to="/login" style={{ color: 'var(--primary-accent)', textDecoration: 'none', fontWeight: '800', fontSize: '0.85rem' }}>RETURN TO ACCESS GATEWAY</Link>
        </div>
      </div>
    </div>
  )
}