import { useState, useContext, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
  Search, FileText, Printer, MessageCircle, ArrowLeft,
  User, Receipt, Calculator, CheckCircle2, AlertCircle,
  Hash, Car, TrendingUp, RefreshCw, X, ChevronRight,
  Eye, History, Download, Phone, Clock
} from 'lucide-react'

/* ─────────────────────── THEME ────────────────────────── */
const C = {
  bg:       '#f0f4f8',
  panel:    '#ffffff',
  sidebar:  '#0f0c29',
  border:   '#e2e8f0',
  primary:  '#4f46e5',
  green:    '#10b981',
  red:      '#ef4444',
  amber:    '#f59e0b',
  muted:    '#64748b',
  dark:     '#0f172a',
}

/* ─────────────────────── HELPERS ───────────────────────── */
const fmt = (n) => `₹${(+n || 0).toFixed(2)}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminInvoiceGenerator() {
  const { token } = useContext(AuthContext)
  const navigate   = useNavigate()

  /* ── View toggle: 'generator' | 'history' ── */
  const [view, setView] = useState('generator')

  /* ── Driver search ── */
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [driver,      setDriver]      = useState(null)
  const [searching,   setSearching]   = useState(false)
  const debounceRef = useRef(null)

  /* ── Invoice fields ── */
  const [fields, setFields] = useState({
    totalEarnings:  0,
    payoutRatio:    80,
    personalWallet: 0,
    totalRent:      0,
    numberOfDays:   7,
    tollRefund:     0,
    vehiclesCount:  1,
  })
  const [fetchedTrips, setFetchedTrips] = useState(0)
  const [generating, setGenerating]     = useState(false)
  const [generated,  setGenerated]      = useState(null)
  const [error, setError]               = useState('')

  /* ── Invoice history ── */
  const [recentInvoices, setRecentInvoices] = useState([])
  const [histLoading,    setHistLoading]    = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  /* ─── Derived math ─── */
  const driverPayout  = +((fields.totalEarnings * fields.payoutRatio) / 100).toFixed(2)
  const platformShare = +(fields.totalEarnings - driverPayout).toFixed(2)
  const weeklyPayout  = +(driverPayout + +fields.tollRefund + +fields.personalWallet - +fields.totalRent).toFixed(2)

  /* ─── Fetch suggestions (debounced) ─── */
  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/drivers/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setSuggestions(data.data || [])
    } catch { setSuggestions([]) }
    setSearching(false)
  }, [token])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
  }, [query, fetchSuggestions])

  /* ─── Select driver from suggestions ─── */
  const selectDriver = async (drv) => {
    setSuggestions([])
    setQuery(drv.driverSerial || drv.name)
    setGenerated(null)
    setError('')

    try {
      const res  = await fetch(`/api/billing/admin/invoice/preview/${drv.driverSerial || drv.phone}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      const d = data.data
      setDriver(d.driver)
      setFetchedTrips(d.stats.totalTrips)
      setFields(prev => ({
        ...prev,
        totalEarnings: d.stats.grossEarnings,
        tollRefund:    d.stats.tollRefund,
        totalRent:     d.driver.weeklyRent,
      }))
    } catch { setError('Failed to fetch driver data.') }
  }

  /* ─── Commit invoice ─── */
  const commitInvoice = async () => {
    if (!driver) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/billing/admin/invoice/generate/${driver.serial}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          totalEarnings:  fields.totalEarnings,
          payoutRatio:    fields.payoutRatio,
          totalTrips:     fetchedTrips,
          personalWallet: fields.personalWallet,
          totalRent:      fields.totalRent,
          numberOfDays:   fields.numberOfDays,
          tollRefund:     fields.tollRefund,
          vehiclesCount:  fields.vehiclesCount,
          finalBalance:   weeklyPayout,
        })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message); setGenerating(false); return }
      setGenerated(data.data)
      if (view === 'history') fetchRecentInvoices()
    } catch { alert('Network error generating invoice.') }
    setGenerating(false)
  }

  /* ─── WhatsApp ─── */
  const sendWhatsApp = (drv = driver, payout = weeklyPayout, f = fields) => {
    const phone = (drv?.phone || '').replace(/\D/g, '')
    const msg = encodeURIComponent(
`━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WAID Fleet – Payout Statement*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Driver     : *${drv?.name}*
🔢 Serial     : *${drv?.serial || drv?.driverSerial}*
📅 Period     : *${f.numberOfDays} days*
🚗 Vehicles   : *${f.vehiclesCount}*
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Gross Earnings    : ${fmt(f.totalEarnings)}
✂️  Platform (${100 - f.payoutRatio}%)   : ${fmt(platformShare)}
👤 Driver Share      : ${fmt(driverPayout)}
🛣️  Toll Refund       : + ${fmt(f.tollRefund)}
💼 Wallet Adj.       : ${+f.personalWallet >= 0 ? '+' : ''} ${fmt(f.personalWallet)}
🏠 Rent Deduction    : - ${fmt(f.totalRent)}
━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *Net Payout : ${fmt(payout)}*
━━━━━━━━━━━━━━━━━━━━━━━━
_WAID Fleet · ${new Date().toLocaleDateString('en-IN')}_`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  /* ─── Print Invoice ─── */
  const printInvoice = (bill = null, drv = driver) => {
    const b = bill || {
      billNumber: generated?.billNumber || 'PREVIEW',
      createdAt: new Date(),
      periodStartDate: new Date(Date.now() - fields.numberOfDays * 86400000),
      periodEndDate: new Date(),
      grossEarnings: fields.totalEarnings,
      commissionAmount: platformShare,
      vehicleRent: fields.totalRent,
      tollRefund: fields.tollRefund,
      completedTrips: fetchedTrips,
      finalAmount: weeklyPayout,
      billStatus: generated?.billStatus || 'pending',
    }
    const dName = bill ? (drv?.name || bill?.driverId?.name || '—') : drv?.name
    const dSerial = bill ? (bill?.driverId?.driverSerial || '—') : drv?.serial
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${b.billNumber}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Inter,sans-serif;padding:50px 60px;color:#0f172a;max-width:750px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:3px solid #4f46e5}
      .brand{font-size:1.8rem;font-weight:900;color:#4f46e5}
      .brand small{display:block;font-size:0.7rem;color:#64748b;font-weight:400;letter-spacing:0.1em;text-transform:uppercase}
      .invoice-no{text-align:right;color:#64748b;font-size:0.85rem}
      .invoice-no strong{display:block;font-size:1.1rem;color:#0f172a;font-weight:800}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem;padding:1.5rem;background:#f8fafc;border-radius:12px}
      .meta-item label{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;display:block;margin-bottom:4px}
      .meta-item span{font-size:0.95rem;font-weight:700;color:#0f172a}
      table{width:100%;border-collapse:collapse;margin-bottom:1rem}
      th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}
      td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:0.9rem}
      td:last-child,th:last-child{text-align:right}
      .total-row{background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-radius:12px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:1.5rem}
      .total-label{font-size:1rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em}
      .total-value{font-size:1.8rem;font-weight:900;letter-spacing:-0.02em}
      .status{display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;text-transform:uppercase}
      .status-pending{background:#fef9c3;color:#854d0e}
      .status-paid{background:#dcfce7;color:#166534}
      .footer{margin-top:3rem;color:#94a3b8;font-size:0.72rem;text-align:center;padding-top:1rem;border-top:1px solid #f1f5f9}
      .red{color:#ef4444;font-weight:700} .amber{color:#f59e0b;font-weight:700} .green{color:#10b981;font-weight:700}
      @media print{button{display:none}}
    </style></head><body>
    <div class="header">
      <div class="brand">WAID Fleet<small>Official Payout Statement</small></div>
      <div class="invoice-no">Invoice<strong>${b.billNumber}</strong><br><span class="status status-${b.billStatus === 'paid' ? 'paid' : 'pending'}">${b.billStatus}</span></div>
    </div>
    <div class="meta">
      <div class="meta-item"><label>Driver Name</label><span>${dName}</span></div>
      <div class="meta-item"><label>Driver Serial</label><span>${dSerial}</span></div>
      <div class="meta-item"><label>Generated</label><span>${new Date(b.createdAt).toLocaleDateString('en-IN')}</span></div>
      <div class="meta-item"><label>Billing Period</label><span>${new Date(b.periodStartDate).toLocaleDateString('en-IN')} – ${new Date(b.periodEndDate).toLocaleDateString('en-IN')}</span></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Gross Trip Earnings</td><td class="green">${fmt(b.grossEarnings)}</td></tr>
        <tr><td>Platform Commission Deducted</td><td class="red">− ${fmt(b.commissionAmount)}</td></tr>
        <tr><td>Vehicle Rent Charge</td><td class="amber">− ${fmt(b.vehicleRent)}</td></tr>
        <tr><td>Toll Refund Credit</td><td class="green">+ ${fmt(b.tollRefund)}</td></tr>
        <tr><td>Trips Completed</td><td>${b.completedTrips || 0} rides</td></tr>
      </tbody>
    </table>
    <div class="total-row"><span class="total-label">Net Payout to Driver</span><span class="total-value">${fmt(b.finalAmount)}</span></div>
    <p class="footer">WAID Fleet Management System &bull; Auto-generated on ${new Date().toLocaleString('en-IN')} &bull; This is an official document.</p>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  /* ─── Load Recent Invoices ─── */
  const fetchRecentInvoices = async () => {
    setHistLoading(true)
    try {
      const res  = await fetch('/api/billing/admin/invoice/recent', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setRecentInvoices(data.data)
    } catch {}
    setHistLoading(false)
  }
  useEffect(() => { if (view === 'history') fetchRecentInvoices() }, [view])

  const setF = (k, v) => setFields(p => ({ ...p, [k]: isNaN(+v) ? p[k] : +v }))

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── TOPBAR ── */}
      <header style={{ background: C.sidebar, color: '#fff', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <ArrowLeft size={14}/> Admin Panel
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 4 }}>
          <div style={{ background: C.primary, padding: '8px', borderRadius: 10, display: 'flex' }}><Calculator size={18} color="#fff"/></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>Smart Invoice Generator</div>
            <div style={{ fontSize: '0.7rem', color: '#a5b4fc', marginTop: 2 }}>Automated Payout Engine · WAID Fleet</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {['generator','history'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: view === v ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', color: view === v ? '#a5b4fc' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
              {v === 'generator' ? <><Calculator size={13} style={{ marginRight: 5, verticalAlign: 'middle' }}/>Generator</> : <><History size={13} style={{ marginRight: 5, verticalAlign: 'middle' }}/>History</>}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ═══════════════ GENERATOR VIEW ═══════════════ */}
        {view === 'generator' && (<>

          {/* ── Driver Search ── */}
          <div style={{ background: C.panel, borderRadius: 20, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '1.5rem', position: 'relative', zIndex: 100 }}>
            <h3 style={{ margin: '0 0 0.4rem', fontWeight: 800, color: C.dark }}>
              <Search size={16} style={{ verticalAlign: 'middle', marginRight: 6 }}/>
              Find Driver
            </h3>
            <p style={{ color: C.muted, fontSize: '0.85rem', margin: '0 0 1.25rem' }}>Type the driver name, serial number (DRV-XXXX) or phone number.</p>

            <div style={{ position: 'relative' }}>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setDriver(null); setGenerated(null) }}
                placeholder="e.g. Ravi Kumar, DRV-1043, +91 98765..."
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `2px solid ${driver ? C.green : C.border}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }}
              />
              {searching && <RefreshCw size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, animation: 'spin 1s linear infinite' }}/>}
              {query && !searching && <button onClick={() => { setQuery(''); setDriver(null); setSuggestions([]) }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16}/></button>}

              {/* Dropdown */}
              {suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.panel, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${C.border}`, marginTop: 6, overflow: 'hidden', zIndex: 99 }}>
                  {suggestions.map(d => (
                    <div key={d._id} onClick={() => selectDriver(d)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: C.primary }}>{d.name?.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.dark }}>{d.name}</div>
                          <div style={{ fontSize: '0.78rem', color: C.muted }}>{d.driverSerial} · {d.phone}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: d.isActive ? '#dcfce7' : '#fee2e2', color: d.isActive ? '#166534' : '#991b1b' }}>{d.isActive ? 'Active' : 'Inactive'}</span>
                        <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2 }}>Rent: {fmt(d.weeklyRent)}/wk</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <div style={{ marginTop: '0.75rem', color: C.red, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}><AlertCircle size={14}/>{error}</div>}
          </div>

          {/* ── Driver + Calculation Panel ── */}
          {driver ? (<>
            {/* Driver Card */}
            <div style={{ background: `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`, color: '#fff', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', border: '2px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900 }}>
                  {driver.name?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{driver.name}</h2>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={12}/>{driver.serial}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12}/>{driver.phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Car size={12}/>{driver.rentType} · {fmt(driver.weeklyRent)}/wk</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/>{fetchedTrips} unbilled trips</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Fetched Trip Revenue</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{fmt(fields.totalEarnings)}</div>
              </div>
            </div>

            {/* Two-col: Inputs | Live Calc */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

              {/* ── Fields ── */}
              <div style={{ background: C.panel, borderRadius: 20, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 1.5rem', fontWeight: 800, color: C.dark, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} color={C.primary}/>Invoice Parameters</h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    { label: '💰 Total Earnings (₹)',      key: 'totalEarnings',  hint: 'Auto-fetched from trip records' },
                    { label: '📊 Driver Payout Ratio (%)', key: 'payoutRatio',    hint: '80% = driver keeps 80, platform takes 20' },
                    { label: '💼 Wallet Adjustment (₹)',   key: 'personalWallet', hint: '+Bonus or −Fine (use negative for deduction)' },
                    { label: '🏠 Total Rent (₹)',          key: 'totalRent',      hint: 'Fetched from driver profile' },
                    { label: '📅 Billing Days',            key: 'numberOfDays',   hint: 'Length of billing period' },
                    { label: '🛣️ Toll Refund (₹)',         key: 'tollRefund',     hint: 'Fetched from trip toll fields' },
                    { label: '🚗 Vehicles in Period',      key: 'vehiclesCount',  hint: 'Active vehicles for this period' },
                  ].map(({ label, key, hint }) => (
                    <div key={key}>
                      <label style={{ fontWeight: 700, fontSize: '0.82rem', color: C.dark, display: 'block', marginBottom: 4 }}>{label}</label>
                      <input
                        type="number" value={fields[key]} onChange={e => setF(key, e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: C.muted }}>{hint}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Live Calculation ── */}
              <div style={{ background: C.panel, borderRadius: 20, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 1.5rem', fontWeight: 800, color: C.dark, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={16} color={C.primary}/>Live Calculation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {[
                    { label: 'Gross Trip Earnings',     val: fmt(fields.totalEarnings), color: C.dark },
                    { label: `Platform Share (${100 - fields.payoutRatio}%)`, val: `− ${fmt(platformShare)}`, color: C.red },
                    { label: `Driver Net (${fields.payoutRatio}%)`, val: fmt(driverPayout), color: C.primary },
                    { label: 'Toll Refund',             val: `+ ${fmt(fields.tollRefund)}`, color: C.green },
                    { label: 'Wallet Adjustment',       val: `${+fields.personalWallet >= 0 ? '+' : '−'} ${fmt(Math.abs(fields.personalWallet))}`, color: +fields.personalWallet >= 0 ? C.green : C.red },
                    { label: 'Rent Deduction',          val: `− ${fmt(fields.totalRent)}`, color: C.amber },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.85rem', color: C.muted }}>{label}</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{val}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 'auto', background: weeklyPayout >= 0 ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#ef4444)', borderRadius: 16, padding: '1.5rem', color: '#fff' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: 6 }}>Weekly Net Payout</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{fmt(weeklyPayout)}</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 6 }}>
                      = Earnings×{fields.payoutRatio}% + Toll + Wallet Adj − Rent
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={commitInvoice} disabled={generating || !!generated}
                style={{ padding: '18px', background: generated ? C.green : C.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 20px ${generated ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.3)'}`, transition: 'all 0.2s' }}
              >
                {generating ? <><RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }}/> Generating...</>
                  : generated ? <><CheckCircle2 size={17}/> Invoice Locked!</>
                  : <><Receipt size={17}/> Lock & Generate</>}
              </button>

              <button onClick={() => sendWhatsApp()} style={{ padding: '18px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MessageCircle size={17}/> Send WhatsApp
              </button>

              <button onClick={() => printInvoice()} style={{ padding: '18px', background: C.panel, color: C.dark, border: `2px solid ${C.border}`, borderRadius: 14, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={17}/> Download PDF
              </button>
            </div>

            {/* Success Banner */}
            {generated && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 16, padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={24} color={C.green}/>
                <div>
                  <strong style={{ color: '#166534' }}>Invoice {generated.billNumber} committed!</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#15803d' }}>This bill is now visible in the driver's portal under "Payouts & Billing".</p>
                </div>
                <button onClick={() => sendWhatsApp()} style={{ marginLeft: 'auto', padding: '8px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageCircle size={14}/> WhatsApp Now
                </button>
              </div>
            )}
          </>) : (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: C.panel, borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}><User size={48} color="#cbd5e1"/></div>
              <h3 style={{ color: C.dark, fontWeight: 800, fontSize: '1.3rem', margin: '0 0 0.5rem' }}>Search for a Driver</h3>
              <p style={{ color: C.muted, margin: 0 }}>Type the driver's name, ID (DRV-XXXX) or phone number above to begin.</p>
            </div>
          )}
        </>)}

        {/* ═══════════════ HISTORY VIEW ═══════════════ */}
        {view === 'history' && (
          <div style={{ background: C.panel, borderRadius: 20, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem', color: C.dark }}>All Generated Invoices</h3>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '0.85rem' }}>{recentInvoices.length} statements on record</p>
              </div>
              <button onClick={fetchRecentInvoices} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: C.muted }}>
                <RefreshCw size={14}/> Refresh
              </button>
            </div>

            {histLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: C.muted }}>Loading invoices...</div>
            ) : recentInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: C.muted }}>No invoices generated yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {['Invoice #','Driver','Serial','Date','Trips','Net Payout','Status','Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map(inv => (
                      <tr key={inv._id} style={{ borderBottom: `1px solid #f8fafc`, transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fbfcfd'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px', fontWeight: 700, color: C.primary, fontSize: '0.88rem' }}>{inv.billNumber || '—'}</td>
                        <td style={{ padding: '12px', fontWeight: 600, color: C.dark }}>{inv.driverId?.name || '—'}</td>
                        <td style={{ padding: '12px', color: C.muted, fontSize: '0.85rem' }}>{inv.driverId?.driverSerial || '—'}</td>
                        <td style={{ padding: '12px', color: C.muted, fontSize: '0.85rem' }}>{fmtDate(inv.createdAt)}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{inv.completedTrips || 0}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: C.green }}>{fmt(inv.finalAmount)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', background: inv.billStatus === 'paid' ? '#dcfce7' : inv.billStatus === 'approved' ? '#dbeafe' : '#fef9c3', color: inv.billStatus === 'paid' ? '#166534' : inv.billStatus === 'approved' ? '#1e40af' : '#854d0e' }}>
                            {inv.billStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button title="Download PDF" onClick={() => printInvoice(inv, inv.driverId)} style={{ padding: '5px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.78rem', color: C.dark }}>
                              <Download size={12}/> PDF
                            </button>
                            <button title="Send on WhatsApp" onClick={() => sendWhatsApp(inv.driverId, inv.finalAmount, { payoutRatio: 80, tollRefund: inv.tollRefund || 0, personalWallet: 0, totalRent: inv.vehicleRent, totalEarnings: inv.grossEarnings, numberOfDays: 7, vehiclesCount: 1 })} style={{ padding: '5px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.78rem', color: '#166534' }}>
                              <MessageCircle size={12}/> WA
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Preview Modal */}
        {previewInvoice && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewInvoice(null)}>
            <div style={{ background: C.panel, borderRadius: 20, padding: '2rem', maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Invoice {previewInvoice.billNumber}</h3>
              <button onClick={() => setPreviewInvoice(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
