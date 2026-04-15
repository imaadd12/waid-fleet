import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // if token exists, try to fetch profile on mount
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchProfile = async (authToken = token) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.data)
      } else {
        // invalid token
        logout()
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, portal = null) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, portal }),
    })
    let data;
    try {
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch (err) {
        if (res.status === 429) throw new Error('Too many requests, please try again later.')
        throw new Error(text || 'Operation failed')
      }
    } catch (err) {
      throw new Error(err.message || 'Network error occurred')
    }
    
    if (!res.ok) throw new Error(data?.message || 'Login failed')

    const newToken = data.token
    setToken(newToken)
    localStorage.setItem('token', newToken)
    await fetchProfile(newToken)
    return data
  }

  const register = async (name, email, password, role, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, phone }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')
    return data
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
