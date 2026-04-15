import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
  }, [])

  const fetchProfile = useCallback(async (authToken) => {
    if (!authToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.data)
      } else if (res.status === 401) {
        // Token is invalid or expired — clear session so the user can re-login
        logout()
      }
      // For 403 (suspended) or 5xx (server error) we keep the token in place;
      // the user stays on whatever page they navigated to and can retry.
    } catch (err) {
      // Network error — keep the token, don't force a logout
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [token, fetchProfile])

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
    // Store token first so it's available if localStorage is read synchronously,
    // then update state — useEffect will trigger a single fetchProfile call
    localStorage.setItem('token', newToken)
    setToken(newToken)
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

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
