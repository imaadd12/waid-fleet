import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const CONFIG = {
  success: { icon: CheckCircle, color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  error:   { icon: XCircle,     color: '#ef4444', glow: 'rgba(239,68,68,0.15)'  },
  info:    { icon: Info,        color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
}

function Toast({ id, type, message, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const { icon: Icon, color, glow } = CONFIG[type] ?? CONFIG.info

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(id), 280)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: 'rgba(21, 25, 36, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${color}33`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
        minWidth: '300px',
        maxWidth: '420px',
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 2rem))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent left border */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: color,
        borderRadius: '12px 0 0 12px',
      }} />

      {/* Icon */}
      <div style={{
        flexShrink: 0,
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={color} strokeWidth={2} />
      </div>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: '13.5px',
        fontWeight: 500,
        color: '#f1f5f9',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      }}>
        {message}
      </span>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: '#64748b',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.color = '#cbd5e1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#64748b'
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
