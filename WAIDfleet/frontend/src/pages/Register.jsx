import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Shield } from 'lucide-react'
import '../styles/Auth.css'

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      // Always register as admin role — this page is admin-only
      await register(form.name, form.email, form.password, 'admin', form.phone)
      setSuccess('Admin account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Admin-only badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
            fontWeight: '600', color: '#818cf8'
          }}>
            <Shield size={14}/> Admin Registration
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>WAID Fleet</h1>
        <h2 style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 400, fontSize: '1rem', marginBottom: '2rem' }}>
          Create a new admin account
        </h2>

        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Full Name</label>
            <input type="text" name="name" placeholder="Admin full name" value={form.name} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Email Address</label>
            <input type="email" name="email" placeholder="admin@waidfleet.com" value={form.email} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Password</label>
            <input type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Phone (optional)</label>
            <input type="tel" name="phone" placeholder="Mobile number" value={form.phone} onChange={handleChange} style={{ width: '100%' }} />
          </div>

          {/* Locked role indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)'
          }}>
            <Shield size={13} color="#818cf8"/> Account role is locked to <strong style={{ color: '#818cf8', marginLeft: '4px' }}>Admin</strong>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem', padding: '0.9rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)', transition: 'all 0.25s'
            }}
          >
            {loading ? 'Creating Account...' : '🛡️ Create Admin Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
