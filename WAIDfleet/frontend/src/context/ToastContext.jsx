import { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer } from '../components/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type, message) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const toast = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error', msg),
    info:    (msg) => addToast('info', msg),
    warning: (msg) => addToast('warning', msg),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
