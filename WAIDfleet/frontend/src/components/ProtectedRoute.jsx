import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--primary-accent)',
        fontSize: '1.2rem', fontWeight: '600'
      }}>
        Loading Systems...
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
