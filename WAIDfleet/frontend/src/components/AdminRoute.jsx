import { useContext } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ShieldOff, AlertTriangle, LogOut } from 'lucide-react'

export function AdminRoute({ children }) {
  const { token, user, loading, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--primary-accent)',
        fontSize: '1rem', fontWeight: '500', gap: '10px'
      }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Verifying admin access...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Token exists but user profile is still being fetched → keep the spinner
  if (!user) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--primary-accent)',
        fontSize: '1rem', fontWeight: '500', gap: '10px'
      }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Verifying admin access...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Logged in but NOT admin → show hard block screen
  const adminRoles = ['admin', 'super_admin', 'superadmin', 'sub_admin', 'finance', 'operations', 'support', 'manager']
  if (user && !adminRoles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-deep)',
        fontFamily: 'Inter, sans-serif', padding: '2rem'
      }}>
        {/* Animated background */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'radial-gradient(at 30% 30%, rgba(239,68,68,0.12) 0px, transparent 60%), radial-gradient(at 70% 70%, rgba(99,102,241,0.08) 0px, transparent 60%)'
        }} />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '480px',
          background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '32px', padding: '3.5rem 2.5rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 80px rgba(0,0,0,0.5)'
        }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ShieldOff size={32} color="#ef4444" />
          </div>

          {/* Warning label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.78rem', fontWeight: '600', color: '#ef4444',
            marginBottom: '1.25rem'
          }}>
            <AlertTriangle size={12}/> Unauthorized Access Attempt
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
            Access Denied
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
            You do not have permission to access the <strong style={{ color: 'white' }}>Admin Control Center</strong>.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            This incident has been logged. Please use the <strong style={{ color: '#818cf8' }}>Driver Portal</strong> to access your account.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              🚗 Go to Driver Portal
            </button>
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: '#f87171', fontWeight: '600', fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <LogOut size={15}/> Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
