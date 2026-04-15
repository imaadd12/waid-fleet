import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  Shield, Users, Car, DollarSign, AlertOctagon, BarChart2,
  Settings, LogOut, Lock, Unlock, Search,
  ChevronRight, Activity, UserCheck, UserX, TrendingUp, Bell, 
  MapPin, Clock, FileText, LayoutDashboard, Globe, ShieldAlert,
  Navigation, CreditCard, Wrench, ShieldCheck, Database, 
  Fingerprint, Briefcase, Mail, Smartphone, Zap, Server,
  Fuel, Route, Layers, Plus, X, Download, Eye, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Edit, Trash2, Send
} from 'lucide-react'

// ─── Helper: download CSV in browser ───
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const SECTION = {
  OVERVIEW:   'overview',
  DRIVERS:    'drivers',
  VEHICLES:   'vehicles',
  TRIPS:      'trips',
  FUEL:       'fuel',
  ZONES:      'zones',
  FINANCIALS: 'financials',
  INCIDENTS:  'accidents',
  ACCESS:     'access',
  SUBADMINS:  'team',
  ANALYTICS:  'analytics',
  SERVICES:   'vehicle_services',
  PERFORMANCE: 'performance',
  SETTINGS:   'settings',
  TRACKING:   'live_tracking',
  BILLING:    'billing_system',
  AUDIT:      'audit_logs'
}

const SETTING_TAB = {
  PROFILE: 'profile',
  SECURITY: 'security',
  TEAM: 'team',
  NOTIFICATIONS: 'notifications',
  PRICING: 'pricing',
  SYSTEM: 'system',
  AUDIT: 'audit'
}

const NAV_ITEMS = [
  { id: SECTION.OVERVIEW,   icon: <LayoutDashboard size={20}/>, label: 'Dashboard', permission: 'dashboard' },
  { id: SECTION.DRIVERS,    icon: <Users size={20}/>,           label: 'Driver Management', permission: 'view_drivers' },
  { id: SECTION.TRACKING,   icon: <Navigation size={20}/>,      label: 'Live Tracking', permission: 'view_live_map' },
  { id: SECTION.VEHICLES,   icon: <Car size={20}/>,             label: 'Vehicles', permission: 'view_vehicles' },
  { id: SECTION.TRIPS,      icon: <Route size={20}/>,           label: 'Trip Management', permission: 'view_drivers' },
  { id: SECTION.FUEL,       icon: <Fuel size={20}/>,            label: 'Fuel Management', permission: 'view_maintenance' },
  { id: SECTION.ZONES,      icon: <Layers size={20}/>,          label: 'Zone Management', permission: 'manage_vehicles' },
  { id: SECTION.BILLING,    icon: <CreditCard size={20}/>,      label: 'Billing & Payouts', permission: 'manage_financials' },
  { id: SECTION.INCIDENTS,  icon: <ShieldAlert size={20}/>,     label: 'Accidents & Traffic', permission: 'view_incidents' },
  { id: SECTION.ACCESS,     icon: <Lock size={20}/>,            label: 'Access Terminal', permission: 'access_control' },
  { id: SECTION.SUBADMINS,  icon: <Shield size={20}/>,          label: 'Sub-Admins', permission: 'manage_subadmins' },
  { id: SECTION.SERVICES,   icon: <Wrench size={20}/>,          label: 'Vehicle Services', permission: 'view_maintenance' },
  { id: SECTION.PERFORMANCE,icon: <BarChart2 size={20}/>,       label: 'Performance Logic', permission: 'view_reports' },
  { id: SECTION.SETTINGS,   icon: <Settings size={20}/>,        label: 'Platform Settings', permission: 'settings_manage' },
]

export function AdminPanel() {
  const { user, logout } = useContext(AuthContext)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [section, setSection] = useState(SECTION.OVERVIEW)
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [accessMap, setAccessMap] = useState({})
  
  // Sub-admin state
  const [subAdmins, setSubAdmins] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saForm, setSaForm] = useState({ 
    name: '', email: '', password: '', phone: '', designation: '', 
    permissions: [], isTemporary: false, accessStartsAt: '', accessExpiresAt: '' 
  })
  const [saLoading, setSaLoading] = useState(false)
  // UI State
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  
  // Bulk Driver Enrollment
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showVehicleAddModal, setShowVehicleAddModal] = useState(false)
  const [showAccidentModal, setShowAccidentModal] = useState(false)
  const [bulkData, setBulkData] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)

  // Trip Management
  const [trips, setTrips] = useState([])
  const [tripStats, setTripStats] = useState(null)
  const [showTripModal, setShowTripModal] = useState(false)
  const [tripFilter, setTripFilter] = useState('all')
  const [tripForm, setTripForm] = useState({ driverId: '', vehicleId: '', pickupAddress: '', dropAddress: '', passengerName: '', passengerPhone: '', fare: '' })

  // Fuel Management
  const [fuelLogs, setFuelLogs] = useState([])
  const [fuelStats, setFuelStats] = useState(null)
  const [showFuelModal, setShowFuelModal] = useState(false)
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', driverId: '', fuelAmount: '', fuelCost: '', odometer: '', fuelType: 'petrol', station: '', notes: '' })

  // Zone Management
  const [zones, setZones] = useState([])
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showZoneDetailModal, setShowZoneDetailModal] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [zoneForm, setZoneForm] = useState({ name: '', city: '', state: '', description: '', color: '#6366f1' })
  const [zoneAssignDriver, setZoneAssignDriver] = useState('')
  const [zoneAssignVehicle, setZoneAssignVehicle] = useState('')

  // Sub-admin edit
  const [editingSubAdmin, setEditingSubAdmin] = useState(null)

  // Security settings
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' })
  const [show2FAModal, setShow2FAModal] = useState(false)

  // Profile edit
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [profileEditForm, setProfileEditForm] = useState({ name: '', phone: '' })

  // Vehicle detail extras
  const [reassigningDriver, setReassigningDriver] = useState(false)
  const [newAssignedDriver, setNewAssignedDriver] = useState('')
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // Bill detail modal
  const [selectedBill, setSelectedBill] = useState(null)
  const [showBillDetailModal, setShowBillDetailModal] = useState(false)

  // Service section search
  const [serviceSearch, setServiceSearch] = useState('')

  // Notifications bell
  const [notifications, setNotifications] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const notifRef = useRef(null)

  // Registration Forms
  const [driverForm, setDriverForm] = useState({ 
    name: '', email: '', password: '', phone: '', age: '', experience: '',
    aadharNumber: '', panNumber: '', licenseNumber: '', licenseExpiry: '',
    address: { street: '', city: '', state: '', pincode: '' },
    emergencyContact: { name: '', phone: '', relationship: '' },
    rentType: 'weekly', weeklyRent: 0, monthlyRent: 0,
    maritalStatus: 'single'
  })
  const [vehicleForm, setVehicleForm] = useState({
    name: '', plateNumber: '', type: 'utility', color: '',
    registrationNumber: '', registrationExpiry: '', insuranceExpiry: '',
    fuelType: 'petrol', assignedDriver: ''
  })
  const [accidentForm, setAccidentForm] = useState({
    driverId: '', vehicleId: '', type: 'accident', severity: 'medium', description: '', evidence: null
  })

  const [bills, setBills] = useState([])
  const [config, setConfig] = useState({ 
    adminAbsent: false, defaultWeeklyRent: 5000, lateFeePercentage: 5, accidentPushAlerts: true,
    baseFare: 50, perKmRate: 15, surgeMultiplier: 1.0, driverCommissionPercentage: 20,
    currency: 'INR', timezone: 'Asia/Kolkata', language: 'en',
    notificationToggles: { push: true, sms: false, email: true }
  })

  // Settings Hub State
  const [activeSettingTab, setActiveSettingTab] = useState(SETTING_TAB.PROFILE)
  const [auditLogs, setAuditLogs] = useState([])
  const [fleetHealth, setFleetHealth] = useState(null)
  
  // Tab States
  const [billTab, setBillTab] = useState('active')
  const [serviceTab, setServiceTab] = useState('history')
  const [auditSearch, setAuditSearch] = useState('')

  const ALL_PERMISSIONS = [
    { key: 'dashboard',          label: 'System Dashboard' },
    { key: 'view_drivers',       label: 'View Drivers' },
    { key: 'manage_drivers',     label: 'Full Driver Command' },
    { key: 'view_vehicles',      label: 'View Vehicles' },
    { key: 'manage_vehicles',    label: 'Vehicle Control' },
    { key: 'view_incidents',     label: 'Accident Reports' },
    { key: 'manage_incidents',   label: 'Incident Management' },
    { key: 'view_earnings',      label: 'Revenue Analytics' },
    { key: 'manage_earnings',    label: 'Financial Auditing' },
    { key: 'view_reports',       label: 'System Reports' },
    { key: 'view_live_map',      label: 'Live GPS Tracking' },
    { key: 'view_maintenance',   label: 'Vehicle Services' },
    { key: 'view_dispatch',      label: 'Pilot Dispatch' },
    { key: 'view_compliance',    label: 'Compliance Hub' },
    { key: 'access_control',     label: 'Security Terminal' },
  ]

  const token = () => localStorage.getItem('token')

  useEffect(() => { fetchAll() }, [])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch('/api/billing', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setBills(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setConfig(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=50', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setAuditLogs(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchFleetHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/performance/admin/fleet-health', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setFleetHealth(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchTrips = useCallback(async () => {
    try {
      const statusQ = tripFilter !== 'all' ? `&status=${tripFilter}` : ''
      const res = await fetch(`/api/trips/admin/all?limit=100${statusQ}`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setTrips(data.data || [])
    } catch (e) { console.error(e) }
  }, [tripFilter])

  const fetchTripStats = useCallback(async () => {
    try {
      const res = await fetch('/api/trips/admin/stats', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setTripStats(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchFuelLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/fuel?limit=100', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setFuelLogs(data.data || [])
    } catch (e) { console.error(e) }
  }, [])

  const fetchFuelStats = useCallback(async () => {
    try {
      const res = await fetch('/api/fuel/stats', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setFuelStats(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setZones(data.data || [])
    } catch (e) { console.error(e) }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) setNotifications(data.data || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    if (section === SECTION.TRIPS) { fetchTrips(); fetchTripStats() }
    if (section === SECTION.FUEL) { fetchFuelLogs(); fetchFuelStats() }
    if (section === SECTION.ZONES) fetchZones()
  }, [section, tripFilter])

  const updateSystemConfig = async (update) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(update)
      })
      const data = await res.json()
      if (data.success) { setConfig(data.data); toast.success('Settings updated') }
      else toast.error(data.message || 'Failed to update settings')
    } catch (e) { toast.error('Network error') }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token()}` }
      const [dRes, vRes, iRes, saRes] = await Promise.all([
        fetch('/api/drivers?limit=100', { headers }),
        fetch('/api/vehicles?limit=100', { headers }),
        fetch('/api/incidents/admin/all?limit=50', { headers }),
        fetch('/api/admin/subadmins', { headers }),
      ])
      const [dData, vData, iData, saData] = await Promise.all([dRes.json(), vRes.json(), iRes.json(), saRes.json()])
      setDrivers(dData.data || [])
      setVehicles(vData.data || [])
      setIncidents(iData.data || [])
      setSubAdmins(saData.data || [])
      await Promise.all([fetchBills(), fetchConfig()])
      fetchNotifications()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [fetchBills, fetchConfig])

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault()
    setSaLoading(true)
    try {
      const url = editingSubAdmin ? `/api/admin/subadmins/${editingSubAdmin._id}/permissions` : '/api/admin/subadmins'
      const method = editingSubAdmin ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(saForm)
      })
      const data = await res.json()
      if (data.success) {
        if (editingSubAdmin) {
          setSubAdmins(prev => prev.map(sa => sa._id === editingSubAdmin._id ? data.data : sa))
          toast.success('Sub-admin updated')
        } else {
          setSubAdmins(prev => [...prev, data.data])
          toast.success('Sub-admin created successfully')
        }
        setShowCreateModal(false)
        setEditingSubAdmin(null)
        setSaForm({ name: '', email: '', password: '', phone: '', designation: '', permissions: [], isTemporary: false, accessStartsAt: '', accessExpiresAt: '' })
      } else {
        toast.error(data.message || 'Failed to save sub-admin')
      }
    } catch (e) { toast.error('Network error') }
    setSaLoading(false)
  }

  const handleRevokeSubAdmin = async (id) => {
    if (!window.confirm('Permanently revoke this sub-admin account?')) return
    try {
      const res = await fetch(`/api/admin/subadmins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) { setSubAdmins(prev => prev.filter(sa => sa._id !== id)); toast.success('Sub-admin revoked') }
      else toast.error(data.message || 'Failed to revoke')
    } catch (e) { toast.error('Network error') }
  }

  const handleCreateTrip = async (e) => {
    e.preventDefault()
    try {
      const body = {
        driverId: tripForm.driverId || undefined,
        vehicleId: tripForm.vehicleId || undefined,
        pickupLocation: { address: tripForm.pickupAddress },
        dropLocation: { address: tripForm.dropAddress },
        passengerDetails: { name: tripForm.passengerName, phone: tripForm.passengerPhone },
        fare: parseFloat(tripForm.fare) || 0
      }
      const res = await fetch('/api/trips/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setTrips(prev => [data.data, ...prev])
        setShowTripModal(false)
        setTripForm({ driverId: '', vehicleId: '', pickupAddress: '', dropAddress: '', passengerName: '', passengerPhone: '', fare: '' })
        toast.success('Trip created successfully')
        fetchTripStats()
      } else toast.error(data.message || 'Failed to create trip')
    } catch (e) { toast.error('Network error') }
  }

  const handleUpdateTripStatus = async (tripId, status) => {
    try {
      const res = await fetch(`/api/trips/admin/${tripId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        setTrips(prev => prev.map(t => t._id === tripId ? { ...t, status } : t))
        toast.success('Trip status updated')
      } else toast.error(data.message || 'Failed to update')
    } catch (e) { toast.error('Network error') }
  }

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Delete this trip record?')) return
    try {
      const res = await fetch(`/api/trips/admin/${tripId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) { setTrips(prev => prev.filter(t => t._id !== tripId)); toast.success('Trip deleted') }
      else toast.error(data.message || 'Failed to delete')
    } catch (e) { toast.error('Network error') }
  }

  const handleAddFuelLog = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...fuelForm, fuelAmount: parseFloat(fuelForm.fuelAmount), fuelCost: parseFloat(fuelForm.fuelCost), odometer: fuelForm.odometer ? parseFloat(fuelForm.odometer) : undefined })
      })
      const data = await res.json()
      if (data.success) {
        setFuelLogs(prev => [data.data, ...prev])
        setShowFuelModal(false)
        setFuelForm({ vehicleId: '', driverId: '', fuelAmount: '', fuelCost: '', odometer: '', fuelType: 'petrol', station: '', notes: '' })
        toast.success('Fuel log added')
        fetchFuelStats()
      } else toast.error(data.message || 'Failed to add fuel log')
    } catch (e) { toast.error('Network error') }
  }

  const handleCreateZone = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(zoneForm)
      })
      const data = await res.json()
      if (data.success) {
        setZones(prev => [...prev, data.data])
        setShowZoneModal(false)
        setZoneForm({ name: '', city: '', state: '', description: '', color: '#6366f1' })
        toast.success('Zone created')
      } else toast.error(data.message || 'Failed to create zone')
    } catch (e) { toast.error('Network error') }
  }

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Delete this zone?')) return
    try {
      const res = await fetch(`/api/zones/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) { setZones(prev => prev.filter(z => z._id !== id)); toast.success('Zone deleted') }
      else toast.error(data.message || 'Failed to delete')
    } catch (e) { toast.error('Network error') }
  }

  const handleZoneAssignDriver = async (zoneId) => {
    if (!zoneAssignDriver) return
    try {
      const res = await fetch(`/api/zones/${zoneId}/assign-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ driverId: zoneAssignDriver })
      })
      const data = await res.json()
      if (data.success) { setSelectedZone(data.data); setZones(prev => prev.map(z => z._id === zoneId ? data.data : z)); setZoneAssignDriver(''); toast.success('Driver assigned to zone') }
      else toast.error(data.message || 'Failed')
    } catch (e) { toast.error('Network error') }
  }

  const handleZoneRemoveDriver = async (zoneId, driverId) => {
    try {
      const res = await fetch(`/api/zones/${zoneId}/remove-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ driverId })
      })
      const data = await res.json()
      if (data.success) { setSelectedZone(data.data); setZones(prev => prev.map(z => z._id === zoneId ? data.data : z)); toast.success('Driver removed from zone') }
      else toast.error(data.message || 'Failed')
    } catch (e) { toast.error('Network error') }
  }

  const handleZoneAssignVehicle = async (zoneId) => {
    if (!zoneAssignVehicle) return
    try {
      const res = await fetch(`/api/zones/${zoneId}/assign-vehicle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ vehicleId: zoneAssignVehicle })
      })
      const data = await res.json()
      if (data.success) { setSelectedZone(data.data); setZones(prev => prev.map(z => z._id === zoneId ? data.data : z)); setZoneAssignVehicle(''); toast.success('Vehicle assigned to zone') }
      else toast.error(data.message || 'Failed')
    } catch (e) { toast.error('Network error') }
  }

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPass) { toast.error('Please fill all password fields'); return }
    if (pwForm.newPass !== pwForm.confirm) { toast.error('New passwords do not match'); return }
    if (pwForm.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    try {
      const res = await fetch(`/api/admin/users/${user?._id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPass })
      })
      const data = await res.json()
      if (data.success) { toast.success('Password updated successfully'); setPwForm({ current: '', newPass: '', confirm: '' }) }
      else toast.error(data.message || 'Failed to change password')
    } catch (e) { toast.error('Network error') }
  }

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(profileEditForm)
      })
      const data = await res.json()
      if (data.success || res.ok) { toast.success('Profile updated'); setShowProfileEditModal(false) }
      else toast.error(data.message || 'Failed to update profile')
    } catch (e) { toast.error('Network error') }
  }

  const handleBulkEnroll = async () => {
    if (!bulkData.trim()) { toast.error('No data entered'); return }
    setBulkLoading(true)
    setBulkResult(null)
    try {
      const lines = bulkData.trim().split('\n').filter(l => l.trim())
      const drivers = lines.map(line => {
        const [name, phone, email, password] = line.split(',').map(s => s.trim())
        return { name, phone, email, password: password || 'WaidFleet@123' }
      }).filter(d => d.name && d.phone)
      
      let enrolled = 0, failed = 0
      for (const d of drivers) {
        try {
          const res = await fetch('/api/drivers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify(d)
          })
          const data = await res.json()
          if (data.success) enrolled++; else failed++
        } catch { failed++ }
      }
      setBulkResult({ enrolled, failed, total: drivers.length })
      if (enrolled > 0) { fetchAll(); toast.success(`${enrolled} drivers enrolled successfully`) }
      if (failed > 0) toast.warning(`${failed} entries failed`)
    } catch (e) { toast.error('Bulk enrollment failed') }
    setBulkLoading(false)
  }

  const handleAssignDriverToVehicle = async () => {
    if (!newAssignedDriver) { toast.error('Select a driver'); return }
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ assignedDriver: newAssignedDriver })
      })
      const data = await res.json()
      if (data.success || res.ok) {
        const driver = drivers.find(d => d._id === newAssignedDriver)
        setSelectedVehicle(prev => ({ ...prev, assignedDriver: driver }))
        setVehicles(prev => prev.map(v => v._id === selectedVehicle._id ? { ...v, assignedDriver: driver } : v))
        setReassigningDriver(false); setNewAssignedDriver('')
        toast.success('Driver assigned to vehicle')
      } else toast.error(data.message || 'Failed to assign driver')
    } catch (e) { toast.error('Network error') }
  }

  const handleSendDriverAlert = async () => {
    if (!alertMessage.trim()) { toast.error('Enter a message'); return }
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ driverId: selectedVehicle?.assignedDriver?._id, message: alertMessage, type: 'alert' })
      })
      const data = await res.json()
      if (data.success || res.ok) { toast.success('Alert sent to driver'); setShowAlertForm(false); setAlertMessage('') }
      else toast.error(data.message || 'Failed to send alert')
    } catch (e) { toast.error('Network error') }
  }

  const exportDriversCSV = () => {
    const rows = [
      ['Name', 'Phone', 'Email', 'Status', 'License', 'Joined'],
      ...drivers.map(d => [d.name, d.phone, d.email, d.isActive ? 'Active' : 'Inactive', d.licenseNumber || '', new Date(d.createdAt).toLocaleDateString()])
    ]
    downloadCSV('drivers_export.csv', rows)
    toast.success('Driver list exported')
  }

  const exportBillsCSV = () => {
    const rows = [
      ['Bill #', 'Driver', 'Phone', 'Period Start', 'Period End', 'Amount', 'Status'],
      ...bills.map(b => [b.billNumber, b.driverId?.name, b.driverId?.phone, new Date(b.periodStartDate).toLocaleDateString(), new Date(b.periodEndDate).toLocaleDateString(), b.finalAmount, b.billStatus])
    ]
    downloadCSV('payouts_export.csv', rows)
    toast.success('Payout data exported')
  }

  const exportAuditCSV = () => {
    const rows = [
      ['Event', 'Module', 'Admin', 'Role', 'Date'],
      ...auditLogs.map(l => [l.description, l.module, l.performedByName, l.performedByRole, new Date(l.createdAt).toLocaleDateString()])
    ]
    downloadCSV('audit_logs_export.csv', rows)
    toast.success('Audit logs exported')
  }

  // Polling for live telemetry when tracking section is active
  useEffect(() => {
    if (section !== SECTION.TRACKING) return;
    const interval = setInterval(async () => {
      const headers = { Authorization: `Bearer ${token()}` }
      const res = await fetch('/api/drivers?status=active&onDuty=true', { headers })
      const data = await res.json()
      if (data.success) {
        setDrivers(prev => {
           const updated = [...prev];
           data.data.forEach(newD => {
              const idx = updated.findIndex(d => d._id === newD._id);
              if (idx !== -1) updated[idx] = newD;
           })
           return updated;
        })
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [section, token])

  const toggleDriverActive = async (driverId, currentStatus) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (res.ok) {
        setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, isActive: !currentStatus } : d))
      }
    } catch (e) { console.error(e) }
  }

  const toggleAccess = (driverId, key) => {
    setAccessMap(prev => ({
      ...prev,
      [driverId]: { ...(prev[driverId] || {}), [key]: !(prev[driverId]?.[key] ?? true) }
    }))
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleRegisterDriver = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      Object.keys(driverForm).forEach(key => {
        if (['address', 'emergencyContact'].includes(key)) {
          formData.append(key, JSON.stringify(driverForm[key]))
        } else {
          formData.append(key, driverForm[key])
        }
      })
      
      const res = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Driver registered successfully')
        fetchAll(); setShowDriverModal(false)
      } else { toast.error(data.message || 'Failed to register driver') }
    } catch (e) { toast.error('Network error'); console.error(e) }
    finally { setLoading(false) }
  }

  const handleCreateVehicle = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(vehicleForm)
      })
      const data = await res.json()
      if (data.success) {
         fetchAll(); setShowVehicleAddModal(false); toast.success('Vehicle added successfully')
      } else { toast.error(data.message || 'Failed to add vehicle') }
    } catch (e) { toast.error('Network error'); console.error(e) }
  }

  const handleReportAccident = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(accidentForm)
      })
      const data = await res.json()
      if (data.success) {
        fetchAll(); setShowAccidentModal(false); setSection(SECTION.INCIDENTS); toast.success('Incident reported')
      } else { toast.error(data.message || 'Failed to report incident') }
    } catch (e) { toast.error('Network error'); console.error(e) }
  }

  const filteredDrivers = drivers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.driverSerial?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredVehicles = vehicles.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.assignedDriver?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  )

  const openIncidents = incidents.filter(i => !i.repairCompleted).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'white' }}>
      
      {/* ─── Premium Sidebar ─── */}
      <aside className="premium-sidebar glass-pane" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <img src="/logo.png" alt="Waid Fleet" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
          <div>
            <h1 className="outfit" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>WAID Fleet</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Operations OS</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.filter(item => {
            if (user?.role === 'super_admin' || user?.role === 'superadmin' || user?.role === 'admin') return true;
            if (item.permission && user?.permissions?.includes(item.permission)) return true;
            return false;
          }).map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={section === item.id ? '' : 'secondary'}
              style={{
                justifyContent: 'flex-start',
                background: section === item.id ? 'var(--primary-accent)' : 'transparent',
                borderColor: 'transparent',
                color: section === item.id ? 'white' : 'var(--text-secondary)',
                padding: '12px 16px',
                borderRadius: '12px',
                width: '100%',
                fontWeight: section === item.id ? 700 : 500,
                fontSize: '0.9rem'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={handleLogout} className="secondary" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main View ─── */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }} className="premium-gradient-bg">
        
        {/* Header Bar */}
        <header style={{ height: '80px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem', position: 'sticky', top: 0, background: 'rgba(10, 12, 16, 0.8)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Command search..." 
              style={{ paddingLeft: '48px', height: '44px', background: 'var(--bg-elevated)', borderRadius: '100px', border: '1px solid var(--border-subtle)' }} 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
               <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user?.name || 'Administrator'}</span>
               <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>System Online</span>
             </div>
             <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Shield size={20} color="var(--primary-accent)" />
             </div>
          </div>
        </header>

        <div style={{ padding: '3rem' }} className="animate-fade-in">
          
          {/* ════ SECTION: DASHBOARD ════ */}
          {section === SECTION.OVERVIEW && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
              <div style={{ gridColumn: 'span 12' }}>
                <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Fleet Command Center</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome back. Systems operational. Global fleet summary follows.</p>
              </div>
              {/* Summary Cards */}
              <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Active Pilots', value: drivers.filter(d => d.onDuty).length, trend: '+4%', icon: <Navigation size={20}/>, id: SECTION.TRACKING },
                  { label: 'Total Fleet Assets', value: vehicles.length, trend: '+2%', icon: <Car size={20}/>, id: SECTION.VEHICLES },
                  { label: 'Revenue Yield', value: `₹${(bills.reduce((s, b) => s + (b.finalAmount || 0), 0) / 1000).toFixed(1)}K`, trend: '+12%', icon: <DollarSign size={20}/>, id: SECTION.BILLING },
                  { label: 'Safety Events', value: openIncidents, trend: '-8%', icon: <ShieldAlert size={20}/>, id: SECTION.INCIDENTS },
                ].map((stat, i) => (
                  <div key={i} className="glass-card clickable" onClick={() => setSection(stat.id)} style={{ padding: '2rem', border: '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary-accent)' }}>
                        {stat.icon}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 800 }}>{stat.trend}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{stat.label}</p>
                    <h3 className="outfit" style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{stat.value}</h3>
                  </div>
                ))}
              </div>
              {/* Fleet Health Chart */}
              <div className="glass-card" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <h3 className="outfit">Fleet Readiness Matrix</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Utilization</button>
                    <button className="secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Health</button>
                  </div>
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                   {Array.from({ length: 24 }).map((_, i) => {
                     const h = 40 + Math.random() * 50;
                     return (
                       <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary-accent)', borderRadius: '2px', opacity: 0.1 + (i/24)*0.9 }}></div>
                     )
                   })}
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="glass-card" style={{ gridColumn: 'span 4', padding: '2rem' }}>
                 <h3 className="outfit" style={{ marginBottom: '1.5rem' }}>System Pulse</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      { icon: <Shield size={16}/>, msg: 'Audit: 12 Expiring Documents', type: 'warn' },
                      { icon: <DollarSign size={16}/>, msg: 'Threshold: Fuel costs +12%', type: 'info' },
                      { icon: <Bell size={16}/>, msg: 'Log: Scheduled maintenance due', type: 'success' },
                    ].map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
                         <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.msg}</p>
                      </div>
                    ))}
                 </div>
                 <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0' }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Database Latency</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>24ms (Optimal)</span>
                 </div>
              </div>
            </div>
          )}

          {/* ════ SECTION: DRIVER MANAGEMENT ════ */}
          {section === SECTION.DRIVERS && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Driver Management</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Workforce lifecycle management and KYC verification.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowBulkModal(true)} className="secondary"><FileText size={18}/> Bulk Ops</button>
                  <button onClick={() => setShowDriverModal(true)}>+ Add Driver</button>
                   <button className="secondary" onClick={exportDriversCSV}><Download size={18}/> Export</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredDrivers.map((d, i) => (
                  <div key={i} className="glass-card animate-fade-in" style={{ padding: '1.5rem', animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                           {d.name?.charAt(0)}
                         </div>
                         <div>
                           <h4 style={{ margin: 0, fontSize: '1rem' }}>{d.name}</h4>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.phone}</span>
                         </div>
                      </div>
                      <div style={{ padding: '4px 8px', borderRadius: '6px', background: d.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: d.isActive ? 'var(--success)' : 'var(--danger)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', height: 'fit-content' }}>
                        {d.isActive ? 'Active' : 'Halted'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         LICENCE
                         <span style={{ color: 'white', display: 'block', fontWeight: 800, marginTop: '4px' }}>{d.licenseNumber || 'PENDING'}</span>
                       </div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         PERFORMANCE
                         <span style={{ color: 'var(--primary-accent)', display: 'block', fontWeight: 800, marginTop: '4px' }}>{d.performanceScore || '88'} <small style={{ fontWeight: 400 }}>PTS</small></span>
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                       {[
                         { label: 'AADHAAR', status: d.aadharCard },
                         { label: 'PAN', status: d.panCard },
                         { label: 'LICENCE', status: d.drivingLicense }
                       ].map(kb => (
                         <div key={kb.label} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: kb.status ? 'var(--success)' : 'var(--text-muted)', background: kb.status ? 'rgba(16, 185, 129, 0.05)' : 'transparent', position: 'relative' }}>
                            {kb.label}
                            {kb.status && <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px', background: 'var(--success)', borderRadius: '50%', color: 'white', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
                         </div>
                       ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => toggleDriverActive(d._id, d.isActive)} className="secondary" style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}>
                        {d.isActive ? <><UserX size={14}/> DEACTIVATE</> : <><UserCheck size={14}/> ACTIVATE</>}
                      </button>
                      <button className="secondary" style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }} onClick={() => navigate(`/performance?driverId=${d._id}`)}><BarChart2 size={14}/> LOGIC</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SECTION: VEHICLES ════ */}
          {section === SECTION.VEHICLES && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vehicles</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Physical asset tracking, assigned drivers, and health monitoring.</p>
                </div>
                <button onClick={() => setShowVehicleAddModal(true)}>+ Add Vehicle</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {filteredVehicles.map((v, i) => (
                   <div key={i} className="glass-card animate-fade-in" style={{ gridColumn: 'span 4', padding: '1.5rem', border: v.status === 'maintenance' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-accent)' }}>{v.plateNumber}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: v.status === 'active' ? 'var(--success)' : 'var(--warning)' }}>{v.status}</span>
                           <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.status === 'active' ? 'var(--success)' : 'var(--warning)' }}></div>
                        </div>
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{v.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>{v.type} Class Utility Vehicle</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                           <span style={{ color: 'var(--text-muted)' }}>Assigned to:</span>
                           <span style={{ fontWeight: 600 }}>{v.assignedDriver?.name || 'Unassigned'}</span>
                        </div>
                        {v.assignedDriver && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                             <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                             <span style={{ fontWeight: 600 }}>{v.assignedDriver.phone}</span>
                          </div>
                        )}
                        <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                           <div style={{ width: v.status === 'active' ? '100%' : '40%', height: '100%', background: v.status === 'active' ? 'var(--success)' : 'var(--warning)' }}></div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setSelectedVehicle(v); setShowVehicleModal(true); }} className="secondary" style={{ flex: 1, padding: '8px' }}><Car size={14}/> View Details</button>
                        <button className="secondary" style={{ flex: 1, padding: '8px' }} onClick={() => { setSection(SECTION.TRACKING) }}><MapPin size={14}/> Track</button>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SECTION: PERMISSIONS & GUARD ════ */}
          {section === SECTION.ACCESS && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Permissions & Guard</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>System security, administrative access, and activity monitoring.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="secondary" onClick={() => { setSection(SECTION.SETTINGS); setActiveSettingTab(SETTING_TAB.AUDIT); fetchAuditLogs(); }}><Activity size={18}/> Activity Log</button>
                  <button className="secondary" onClick={() => toast.info('Session management is available under Platform Settings.')}><Clock size={18}/> Active Sessions</button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '2rem' }}>
                 <h3 className="outfit" style={{ marginBottom: '1.5rem' }}>Administrative Permission Matrix</h3>
                 <div style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Account</th>
                          <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Core Data</th>
                          <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Financial</th>
                          <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Security</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subAdmins.map((sa, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1.2rem' }}>
                               <div style={{ fontWeight: 700 }}>{sa.name}</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sa.email}</div>
                            </td>
                            {['dashboard', 'view_drivers', 'access_control'].map(perm => (
                               <td key={perm} style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    width: '12px', height: '12px', borderRadius: '50%', margin: '0 auto',
                                    background: sa.permissions?.includes(perm) ? 'var(--success)' : 'rgba(255,255,255,0.05)',
                                    boxShadow: sa.permissions?.includes(perm) ? '0 0 10px var(--success)' : 'none'
                                  }}></div>
                               </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
              </div>

               <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem', background: config.adminAbsent ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderColor: config.adminAbsent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="outfit" style={{ margin: 0, color: config.adminAbsent ? 'var(--warning)' : 'var(--success)' }}>
                        {config.adminAbsent ? '⚠️ ADMIN ABSENCE MODE: ACTIVE' : '✅ ADMIN PRESENCE: VERIFIED'}
                      </h3>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {config.adminAbsent 
                          ? 'Sub-admin accounts are currently restricted from sensitive operations (Financials, Deletion, Permissions).' 
                          : 'Full access is currently available for all authorized sub-admin accounts.'}
                      </p>
                    </div>
                    {(user?.role === 'super_admin' || user?.role === 'superadmin') && (
                      <button 
                        onClick={() => updateSystemConfig({ adminAbsent: !config.adminAbsent })}
                        className="animate-pulse"
                        style={{ background: config.adminAbsent ? 'var(--success)' : 'var(--warning)', color: 'white', fontWeight: 900 }}
                      >
                        {config.adminAbsent ? 'VERIFY PRESENCE' : 'ACTIVATE ABSENCE LOCK'}
                      </button>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* ════ SECTION: OPERATIONS ANALYTICS ════ */}
          {section === SECTION.ANALYTICS && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                <div style={{ gridColumn: 'span 12' }}>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Operations Analytics</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Data-driven driver performance and safety auditing.</p>
                </div>

                <div className="glass-card" style={{ gridColumn: 'span 7', padding: '2rem' }}>
                   <h3 className="outfit" style={{ marginBottom: '2rem' }}>Driver performance Distribution</h3>
                   <div style={{ display: 'flex', alignItems: 'flex-end', height: '240px', gap: '20px', padding: '0 20px' }}>
                      {[85, 92, 78, 95, 88, 70, 91].map((v, i) => (
                        <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary-accent)', borderRadius: '8px', position: 'relative' }}>
                           <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: 800 }}>{v}%</span>
                        </div>
                      ))}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                   </div>
                </div>

                <div className="glass-card" style={{ gridColumn: 'span 5', padding: '2rem' }}>
                   <h3 className="outfit" style={{ marginBottom: '2rem' }}>Safety Metrics</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {[
                        { label: 'Harsh Braking', value: '4.2', unit: 'per 100km', color: 'var(--warning)' },
                        { label: 'Speeding Incidents', value: '0.8', unit: 'per shift', color: 'var(--success)' },
                        { label: 'Route Compliance', value: '98.5%', unit: 'accuracy', color: 'var(--info)' },
                        { label: 'Idle Rate', value: '12.4%', unit: 'total time', color: 'var(--primary-accent)' },
                      ].map((m, i) => (
                        <div key={i}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.label}</span>
                              <span style={{ fontWeight: 800 }}>{m.value} <small style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem' }}>{m.unit}</small></span>
                           </div>
                           <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                              <div style={{ width: '70%', height: '100%', background: m.color, borderRadius: '10px' }}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="glass-card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
                   <h3 className="outfit" style={{ marginBottom: '1.5rem' }}>Active Driver Leaderboard</h3>
                   <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>RANK</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>DRIVER</th>
                            <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>TRIPS</th>
                            <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>RATING</th>
                            <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>SAFETY SCORE</th>
                            <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>EARNINGS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drivers.slice(0, 5).map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '1.2rem', fontWeight: 800, color: i === 0 ? 'var(--warning)' : 'white' }}>#0{i+1}</td>
                              <td style={{ padding: '1.2rem' }}>
                                <div style={{ fontWeight: 600 }}>{d.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.level?.toUpperCase() || 'BRONZE'} TIER</div>
                              </td>
                              <td style={{ padding: '1.2rem', textAlign: 'center' }}>124</td>
                              <td style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--warning)' }}>★ 4.{9-i}</td>
                              <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                <span style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>9{8-i}</span>
                              </td>
                              <td style={{ padding: '1.2rem', textAlign: 'right', fontWeight: 700 }}>₹{48000 - (i*5000)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {/* ════ SECTION: FINANCIALS (Permission Restricted) ════ */}
          {section === SECTION.FINANCIALS && (
            <div>
               <div style={{ marginBottom: '3rem' }}>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Financial Performance</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Live revenue, yield analytics, and payout management.</p>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Total Revenue', value: '₹42.8L', trend: '+18%', color: 'var(--success)' },
                    { label: 'Unpaid Bills', value: '₹2.4L', trend: '-5%', color: 'var(--warning)' },
                    { label: 'Net Profit (Est)', value: '₹12.1L', trend: '+8%', color: 'var(--info)' },
                    { label: 'Wallet Balance', value: '₹4.2L', trend: 'Global', color: 'var(--primary-accent)' },
                  ].map((f, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.label}</span>
                       <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: f.color }}>{f.value}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>{f.trend} vs last month</div>
                    </div>
                  ))}
               </div>

               <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="outfit" style={{ margin: 0 }}>Transaction History</h3>
                    <button className="secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setSection(SECTION.BILLING)}><FileText size={14}/> Full Report</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}><tr>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>BILL</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DRIVER</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AMOUNT</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                    </tr></thead>
                    <tbody>
                      {bills.slice(0,10).map(b => (
                        <tr key={b._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>#{b.billNumber}</td>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{b.driverId?.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.driverId?.phone}</div></td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800 }}>₹{(b.finalAmount || 0).toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}><span className={`badge ${b.billStatus === 'paid' ? 'success' : b.isOverdue ? 'danger' : 'warning'}`}>{b.isOverdue ? 'OVERDUE' : (b.billStatus || '').toUpperCase()}</span></td>
                        </tr>
                      ))}
                      {bills.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td></tr>}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* ════ SECTION: LIVE TRACKING ════ */}
          {section === SECTION.TRACKING && (
            <div className="animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="outfit">Live Pilot Telemetry</h2>
                <div className="badge success">System Pulse: Online</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', height: '600px' }}>
                <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--primary-accent) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  <div style={{ position: 'relative', p: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {drivers.filter(d => d.onDuty).length > 0 ? (
                       <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                          {drivers.filter(d => d.onDuty).map((p, i) => {
                             const left = p.currentLocation?.lng ? ((p.currentLocation.lng % 1) * 100).toFixed(1) : (i * 15 + 10);
                             const top = p.currentLocation?.lat ? ((p.currentLocation.lat % 1) * 100).toFixed(1) : (i * 20 + 15);
                             return (
                               <div key={p._id} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, textAlign: 'center', transition: 'all 2000ms ease-in-out' }}>
                                 <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 15px var(--success)', margin: '0 auto' }} />
                                 <div className="glass-pane" style={{ padding: '4px 8px', fontSize: '0.7rem', marginTop: '5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{p.name}</div>
                               </div>
                             );
                           })}
                       </div>
                     ) : (
                       <div style={{ textAlign: 'center' }}>
                         <Navigation size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }}/>
                         <p style={{ color: 'var(--text-muted)' }}>No pilots currently on-duty.</p>
                       </div>
                     )}
                  </div>
                </div>
                <div className="glass-card" style={{ overflowY: 'auto' }}>
                  <h4 className="outfit" style={{ marginBottom: '1rem' }}>Active Signals</h4>
                  {drivers.filter(d => d.onDuty).map(p => (
                    <div key={p._id} style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.currentLocation?.address || 'Locating...'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ SECTION: BILLING ════ */}
          {section === SECTION.BILLING && (
            <div className="animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="outfit">Financial Command Center</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Automated weekly settlements, payroll extraction, and credit auditing.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="secondary" onClick={async () => {
                    try {
                      const res = await fetch('/api/billing/generate-weekly', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
                      const data = await res.json()
                      if (data.success) { toast.success(data.message || 'Bills generated'); fetchBills() }
                      else toast.error(data.message || 'Failed to generate bills')
                    } catch (e) { toast.error('Network error') }
                  }}>
                    <Zap size={16}/> Auto-Generate Bills
                  </button>
                  <button onClick={exportBillsCSV}>
                    <Download size={16}/> Extract Payouts
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                 <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>PENDING DISBURSEMENT</p>
                    <h2 className="outfit" style={{ fontSize: '2.5rem' }}>₹{bills.filter(b => b.billStatus === 'pending').reduce((s,b)=>s+b.finalAmount, 0).toLocaleString()}</h2>
                 </div>
                 <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>COLLECTIONS OVERDUE</p>
                    <h2 className="outfit" style={{ color: 'var(--danger)', fontSize: '2.5rem' }}>₹{bills.filter(b => b.isOverdue).reduce((s,b)=>s+b.finalAmount, 0).toLocaleString()}</h2>
                 </div>
                 <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>WEEKLY VELOCITY</p>
                    <h2 className="outfit" style={{ color: 'var(--success)', fontSize: '2.5rem' }}>+ ₹{bills.filter(b => b.billStatus === 'paid').reduce((s,b)=>s+b.finalAmount, 0).toLocaleString()}</h2>
                 </div>
              </div>

              {/* 📊 Billing Tabs */}
              <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                {['active', 'payouts', 'overdue'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setBillTab(t)}
                    style={{ 
                      background: 'none', border: 'none', padding: '1rem 0', 
                      color: billTab === t ? 'var(--primary-accent)' : 'var(--text-muted)',
                      borderBottom: billTab === t ? '2px solid var(--primary-accent)' : 'none',
                      fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'
                    }}
                  >
                    {t === 'active' ? 'Active Invoices' : t === 'payouts' ? 'Pilot Payouts' : 'Arrears & Overdue'}
                  </button>
                ))}
              </div>

              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '1.2rem' }}>Audit ID</th>
                      <th style={{ textAlign: 'left', padding: '1.2rem' }}>Pilot Account</th>
                      <th style={{ textAlign: 'left', padding: '1.2rem' }}>Statement Window</th>
                      <th style={{ textAlign: 'left', padding: '1.2rem' }}>Fiscal Amount</th>
                      <th style={{ textAlign: 'center', padding: '1.2rem' }}>Operational Status</th>
                      <th style={{ textAlign: 'right', padding: '1.2rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.filter(b => {
                      if (billTab === 'active') return b.billStatus === 'pending' && !b.isOverdue;
                      if (billTab === 'payouts') return b.billStatus === 'paid';
                      if (billTab === 'overdue') return b.isOverdue;
                      return true;
                    }).map(b => (
                      <tr key={b._id} style={{ borderTop: '1px solid var(--border-subtle)', transition: '0.2s' }} className="hover-row">
                        <td style={{ padding: '1.2rem', fontWeight: 700, fontFamily: 'monospace' }}>#{b.billNumber}</td>
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <div style={{ width: '32px', height: '32px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
                                {b.driverId?.name?.substring(0,2).toUpperCase() || '??'}
                             </div>
                             <div>
                               <div style={{ fontWeight: 700 }}>{b.driverId?.name}</div>
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.driverId?.phone}</div>
                             </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12}/> {new Date(b.periodStartDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(b.periodEndDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem', color: b.finalAmount < 0 ? 'var(--danger)' : 'white', fontWeight: 800 }}>
                          ₹{Math.abs(b.finalAmount).toLocaleString()}
                        </td>
                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                          <span className={`badge ${b.billStatus === 'paid' ? 'success' : b.isOverdue ? 'danger' : 'warning'}`}>
                            {b.isOverdue ? 'OVERDUE' : b.billStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="glass-btn icon" title="View Statement" onClick={() => { setSelectedBill(b); setShowBillDetailModal(true) }}><FileText size={14}/></button>
                            {b.billStatus !== 'paid' && (
                              <button className="primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={async () => {
                                await fetch(`/api/billing/${b._id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } })
                                fetchBills()
                              }}>COLLECT</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                           <Database size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                           <p>No financial records matched the current filter.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ SECTION: VEHICLE SERVICES ════ */}
          {section === SECTION.SERVICES && (
            <div className="animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Maintenance Command</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Lifecycle management, safety audits, and proactive asset care.</p>
                </div>
                <button className="primary" onClick={() => setShowVehicleAddModal(true)}><Wrench size={18}/> Schedule Inspection</button>
              </div>

              {/* 📊 Service Tabs */}
              <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '3rem' }}>
                {['history', 'metrics', 'shop'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setServiceTab(t)}
                    style={{ 
                      background: 'none', border: 'none', padding: '1rem 0', 
                      color: serviceTab === t ? 'var(--primary-accent)' : 'var(--text-muted)',
                      borderBottom: serviceTab === t ? '3px solid var(--primary-accent)' : 'none',
                      fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '2px'
                    }}
                  >
                    {t === 'history' ? 'Asset Lifecycle' : t === 'metrics' ? 'Fleet Diagnostics' : 'Vehicle Shop Status'}
                  </button>
                ))}
              </div>

              {serviceTab === 'history' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                  <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 className="outfit" style={{ margin: 0 }}>Service Records</h4>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input className="secondary" placeholder="Search plates..." value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} style={{ paddingLeft: '35px', width: '200px', fontSize: '0.8rem' }} />
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Vehicle</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Type</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Last Service</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Next Due</th>
                          <th style={{ textAlign: 'right', padding: '1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.filter(v => !serviceSearch || v.plateNumber?.toLowerCase().includes(serviceSearch.toLowerCase()) || v.name?.toLowerCase().includes(serviceSearch.toLowerCase())).slice(0, 10).map(v => (
                          <tr key={v._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1.2rem' }}>
                              <div style={{ fontWeight: 800 }}>{v.plateNumber}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.name}</div>
                            </td>
                            <td style={{ padding: '1.2rem' }}><span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{v.type}</span></td>
                            <td style={{ padding: '1.2rem', fontSize: '0.8rem' }}>{v.lastService ? new Date(v.lastService).toLocaleDateString() : 'Initial Load'}</td>
                            <td style={{ padding: '1.2rem', fontSize: '0.8rem', color: 'var(--warning)' }}>{v.nextService ? new Date(v.nextService).toLocaleDateString() : 'Pending Audit'}</td>
                            <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                              <span className={`badge ${v.status === 'active' ? 'success' : 'warning'}`}>{v.status.toUpperCase()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.02) 100%)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                          <ShieldCheck size={20} color="var(--primary-accent)" />
                          <h4 className="outfit" style={{ margin: 0 }}>Safety Score</h4>
                       </div>
                       <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>94.2<span style={{ fontSize: '1rem', opacity: 0.5 }}>/100</span></div>
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on last 30 daily inspections and road safety audits.</p>
                       <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginTop: '1.5rem', overflow: 'hidden' }}>
                          <div style={{ width: '94%', height: '100%', background: 'var(--primary-accent)' }}></div>
                       </div>
                    </div>

                    <div className="glass-card">
                       <h4 className="outfit" style={{ marginBottom: '1.5rem' }}>Asset Heatmap</h4>
                       <div style={{ height: '150px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-subtle)' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Diagnostic Data Synchronizing...</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {serviceTab === 'metrics' && (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                   <Activity size={48} color="var(--primary-accent)" style={{ marginBottom: '1.5rem' }} />
                   <h2 className="outfit">Fleet Diagnostic Engine</h2>
                   <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem' }}>Integrating with OBD-II telematics for real-time engine health and fuel mapping.</p>
                   <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                      <div className="glass-card" style={{ width: '200px' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800 }}>FUEL EFFICIENCY</p>
                        <h3 className="outfit">18.4 <span style={{ fontSize: '0.8rem' }}>KM/L</span></h3>
                      </div>
                      <div className="glass-card" style={{ width: '200px' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800 }}>IDLE TIME</p>
                        <h3 className="outfit">12.2 <span style={{ fontSize: '0.8rem' }}>MIN</span></h3>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* ════ SECTION: PERFORMANCE ════ */}
          {section === SECTION.PERFORMANCE && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Intelligence & Logic</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>AI-driven pilot performance metrics and safety trends.</p>
                </div>
                <button onClick={() => navigate('/performance')}>Open Performance OS</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                <div className="glass-card" style={{ gridColumn: 'span 4', padding: '2rem' }}>
                   <h4 style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Global Fleet Score</h4>
                   <div style={{ fontSize: '3.5rem', fontWeight: 900 }} className="outfit">84.2</div>
                   <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700 }}>+2.4% vs last week</div>
                </div>
                <div className="glass-card" style={{ gridColumn: 'span 8', padding: '2rem' }}>
                   <h4 style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Top Logic Insights</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--primary-accent)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Fuel efficiency decreased by 12% in night-shift operations.</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Pilot "S. Kumar" reached Platinum Tier achievement.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ SECTION: SETTINGS ════ */}
          {section === SECTION.SETTINGS && (
            <div className="animate-slide-up" style={{ height: 'calc(100vh - 200px)', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
              
              {/* Settings Sub-Sidebar */}
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="outfit" style={{ padding: '0 1rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Configuration</h4>
                {[
                  { id: SETTING_TAB.PROFILE, label: 'Admin Profile', icon: <Users size={16}/> },
                  { id: SETTING_TAB.SECURITY, label: 'Security & 2FA', icon: <Fingerprint size={16}/> },
                  { id: SETTING_TAB.TEAM, label: 'Sub-Admins', icon: <Shield size={16}/> },
                  { id: SETTING_TAB.NOTIFICATIONS, label: 'Notifications', icon: <Bell size={16}/> },
                  { id: SETTING_TAB.PRICING, label: 'Pricing Console', icon: <DollarSign size={16}/> },
                  { id: SETTING_TAB.SYSTEM, label: 'System Logic', icon: <Zap size={16}/> },
                  { id: SETTING_TAB.AUDIT, label: 'Audit Logs', icon: <FileText size={16}/>, action: fetchAuditLogs },
                ].map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setActiveSettingTab(item.id); if (item.action) item.action(); }}
                    style={{ 
                      padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9rem',
                      background: activeSettingTab === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      color: activeSettingTab === item.id ? 'var(--primary-accent)' : 'var(--text-secondary)',
                      border: activeSettingTab === item.id ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                      transition: '0.2s ease'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Settings Content Area */}
              <div className="custom-scrollbar" style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                
                {/* 1. PROFILE */}
                {activeSettingTab === SETTING_TAB.PROFILE && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>Admin Profile</h2>
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3rem' }}>
                        <div style={{ 
                          width: '120px', height: '120px', borderRadius: '32px', 
                          background: 'linear-gradient(135deg, var(--primary-accent), #818cf8)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '3rem', fontWeight: 900, color: 'white' 
                        }}>
                          {user?.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{user?.name}</h3>
                              <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-accent)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>{user?.role?.toUpperCase()}</span>
                           </div>
                           <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                           <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                              <button className="secondary small" onClick={() => toast.info('Avatar upload will be available in the next update.')}>Update Avatar</button>
                              <button className="secondary small" onClick={() => { setProfileEditForm({ name: user?.name || '', phone: user?.phone || '' }); setShowProfileEditModal(true); }}>Edit Basic Info</button>
                           </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</label>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>+91 {user?.phone || 'Not linked'}</div>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Designation</label>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>{user?.designation || 'Master Administrator'}</div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SECURITY */}
                {activeSettingTab === SETTING_TAB.SECURITY && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>Security Center</h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                      <div className="glass-card">
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                               <h4 style={{ margin: '0 0 0.5rem 0' }}>Two-Factor Authentication (2FA)</h4>
                               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Protect your account with an additional security layer using TOTP.</p>
                            </div>
                            <button className="secondary small" onClick={() => setShow2FAModal(true)}>Enable 2FA</button>
                         </div>
                      </div>
                      <div className="glass-card">
                         <h4 style={{ margin: '0 0 1.5rem 0' }}>Password Management</h4>
                         <div style={{ display: 'grid', gap: '1rem' }}>
                             <input type="password" placeholder="Current Password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="password" placeholder="New Password" value={pwForm.newPass} onChange={e => setPwForm({...pwForm, newPass: e.target.value})} />
                                <input type="password" placeholder="Confirm New Password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} />
                            </div>
                             <button onClick={handleChangePassword} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>Update Password</button>
                         </div>
                      </div>
                      <div className="glass-card" style={{ border: '1px solid var(--danger-subtle)' }}>
                         <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>Session Management</h4>
                         <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Logout from all other active devices and kill persistent cookies.</p>
                         <button className="secondary small" style={{ color: 'var(--danger)', borderColor: 'var(--danger-subtle)' }}>Kill All Other Sessions</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TEAM / SUB-ADMINS */}
                {activeSettingTab === SETTING_TAB.TEAM && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 className="outfit" style={{ margin: 0 }}>Sub-Admin Matrix</h2>
                      <button onClick={() => setShowCreateModal(true)}>+ Invite Sub-Admin</button>
                    </div>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                             <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>USER</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>PERMISSIONS</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>STATUS</th>
                                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem' }}>ACTIONS</th>
                             </tr>
                          </thead>
                          <tbody>
                             {subAdmins.map(admin => (
                               <tr key={admin._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '1rem' }}>
                                     <div style={{ fontWeight: 700 }}>{admin.name}</div>
                                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{admin.email}</div>
                                     {admin.isTemporary && (
                                       <div style={{ fontSize: '0.65rem', color: 'var(--warning)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <Clock size={10}/> Expires: {new Date(admin.accessExpiresAt).toLocaleDateString()}
                                       </div>
                                     )}
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {admin.permissions?.slice(0, 3).map(p => (
                                          <span key={p} style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{p}</span>
                                        ))}
                                        {admin.permissions?.length > 3 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+{admin.permissions.length - 3} more</span>}
                                     </div>
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: admin.isActive ? 'var(--success)' : 'var(--danger)' }} />
                                        {admin.isActive ? 'Active' : 'Suspended'}
                                     </div>
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                                     <button className="secondary small" style={{ marginRight: '8px' }} onClick={() => { setEditingSubAdmin(admin); setSaForm({ name: admin.name, email: admin.email, password: '', phone: admin.phone || '', designation: admin.designation || '', permissions: admin.permissions || [], isTemporary: admin.isTemporary || false, accessStartsAt: admin.accessStartsAt || '', accessExpiresAt: admin.accessExpiresAt || '' }); setShowCreateModal(true); }}>Edit</button>
                                     <button className="secondary small" style={{ color: 'var(--danger)' }} onClick={() => handleRevokeSubAdmin(admin._id)}>Revoke</button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}

                {/* 4. NOTIFICATIONS */}
                {activeSettingTab === SETTING_TAB.NOTIFICATIONS && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>Global Notifications</h2>
                    <div className="glass-card" style={{ display: 'grid', gap: '2rem' }}>
                       {[
                         { id: 'push', label: 'Push Notifications', desc: 'Real-time desktop alerts for system events.', icon: <Smartphone size={20}/> },
                         { id: 'email', label: 'Email Alerts', desc: 'Weekly summaries and critical system reports.', icon: <Mail size={20}/> },
                         { id: 'sms', label: 'SMS Crisis Alerts', desc: 'Direct mobile texts for major fleet incidents.', icon: <Smartphone size={20}/> },
                       ].map(channel => (
                         <div key={channel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>
                                  {channel.icon}
                               </div>
                               <div>
                                  <div style={{ fontWeight: 700 }}>{channel.label}</div>
                                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{channel.desc}</p>
                               </div>
                            </div>
                            <div 
                              onClick={() => updateSystemConfig({ notificationToggles: { ...config.notificationToggles, [channel.id]: !config.notificationToggles?.[channel.id] } })}
                              style={{ 
                                width: '44px', height: '22px', 
                                background: config.notificationToggles?.[channel.id] ? 'var(--success)' : 'rgba(255,255,255,0.1)', 
                                borderRadius: '11px', cursor: 'pointer', position: 'relative', transition: '0.3s'
                              }}
                            >
                              <div style={{ 
                                width: '18px', height: '18px', background: 'white', borderRadius: '50%', 
                                position: 'absolute', top: '2px', left: config.notificationToggles?.[channel.id] ? '24px' : '2px',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }} />
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* 5. PRICING CONSOLE */}
                {activeSettingTab === SETTING_TAB.PRICING && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>Pricing Console</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                       <div className="glass-card">
                          <h4 style={{ margin: '0 0 1.5rem 0' }}>Base Fares</h4>
                          <div style={{ display: 'grid', gap: '1rem' }}>
                             <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base Unlock Fee (₹)</label>
                                <input 
                                  type="number" 
                                  value={config.baseFare} 
                                  onChange={e => setConfig({...config, baseFare: e.target.value})}
                                />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate Per KM (₹)</label>
                                <input 
                                  type="number" 
                                  value={config.perKmRate} 
                                  onChange={e => setConfig({...config, perKmRate: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>
                       <div className="glass-card">
                          <h4 style={{ margin: '0 0 1.5rem 0' }}>Fleet Commission</h4>
                          <div style={{ display: 'grid', gap: '1rem' }}>
                             <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Commission (%)</label>
                                <input 
                                  type="number" 
                                  value={config.driverCommissionPercentage} 
                                  onChange={e => setConfig({...config, driverCommissionPercentage: e.target.value})}
                                />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dynamic Surge Multiplier</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={config.surgeMultiplier} 
                                  onChange={e => setConfig({...config, surgeMultiplier: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>
                       <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                          <button 
                            onClick={() => updateSystemConfig({ 
                              baseFare: config.baseFare, perKmRate: config.perKmRate, 
                              driverCommissionPercentage: config.driverCommissionPercentage, surgeMultiplier: config.surgeMultiplier 
                            })}
                            style={{ width: '100%' }}
                          >
                            Sync Pricing To Fleet
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {/* 6. SYSTEM LOGIC */}
                {activeSettingTab === SETTING_TAB.SYSTEM && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>System Logic</h2>
                    <div className="glass-card" style={{ display: 'grid', gap: '2rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                             <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={18} color="var(--warning)"/> Admin Absence Mode
                             </h4>
                             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Restrict all sensitive sub-admin actions while the primary admin is away.</p>
                          </div>
                          <div 
                            onClick={() => updateSystemConfig({ adminAbsent: !config.adminAbsent })}
                            style={{ 
                              width: '44px', height: '22px', 
                              background: config.adminAbsent ? 'var(--warning)' : 'rgba(255,255,255,0.1)', 
                              borderRadius: '11px', cursor: 'pointer', position: 'relative'
                            }}
                          >
                            <div style={{ 
                              width: '18px', height: '18px', background: 'white', borderRadius: '50%', 
                              position: 'absolute', top: '2px', left: config.adminAbsent ? '24px' : '2px',
                              transition: '0.3s ease'
                            }} />
                          </div>
                       </div>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div>
                             <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default Timezone</label>
                             <select style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                                <option>Asia/Kolkata (GMT+5:30)</option>
                                <option>UTC (GMT+0:00)</option>
                             </select>
                          </div>
                          <div>
                             <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default Currency</label>
                             <select style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                                <option>INR (₹) - Indian Rupee</option>
                                <option>USD ($) - US Dollar</option>
                             </select>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* 7. AUDIT LOGS */}
                {activeSettingTab === SETTING_TAB.AUDIT && (
                  <div className="animate-fade-in">
                    <h2 className="outfit" style={{ margin: '0 0 2rem 0' }}>Security Audit Log</h2>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                       <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                             <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                             <input placeholder="Search audit trail..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }} />
                          </div>
                          <button className="secondary small" onClick={exportAuditCSV}><Download size={14}/> Export CSV</button>
                       </div>
                       <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                             <thead style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0 }}>
                                <tr>
                                   <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>EVENT</th>
                                   <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>MODULE</th>
                                   <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem' }}>ADMIN</th>
                                   <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem' }}>DATE</th>
                                </tr>
                             </thead>
                             <tbody>
                                {auditLogs.filter(l => !auditSearch || l.description?.toLowerCase().includes(auditSearch.toLowerCase()) || l.module?.toLowerCase().includes(auditSearch.toLowerCase()) || l.performedByName?.toLowerCase().includes(auditSearch.toLowerCase())).map((log, i) => (
                                  <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                     <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.description}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Action: {log.actionType} | Ref: {log.entityId}</div>
                                     </td>
                                     <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'capitalize' }}>{log.module}</span>
                                     </td>
                                     <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{log.performedByName}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.performedByRole}</div>
                                     </td>
                                     <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'top' }}>
                                        <div style={{ fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                     </td>
                                  </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                  <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td></tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ════ SECTION: ACCIDENTS & TRAFFIC ════ */}
          {section === SECTION.INCIDENTS && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Accidents & Traffic</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Log and monitor vehicle incidents, traffic violations, and safety scores.</p>
                </div>
                <button onClick={() => setShowAccidentModal(true)}>+ Report Incident</button>
              </div>

              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>INCIDENT</th>
                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>ENTITY</th>
                        <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>SEVERITY</th>
                        <th style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>STATUS</th>
                        <th style={{ textAlign: 'right', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map((inc, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1.2rem' }}>
                             <div style={{ fontWeight: 700, color: 'var(--primary-accent)' }}>{inc.type?.toUpperCase()}</div>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>{inc.description}</div>
                          </td>
                          <td style={{ padding: '1.2rem' }}>
                             <div style={{ fontWeight: 600 }}>{inc.driverId?.name || 'Unknown'}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.vehicleId?.plateNumber || 'No Vehicle'}</div>
                          </td>
                          <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                             <span style={{ 
                               padding: '4px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                               background: inc.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                               color: inc.severity === 'high' ? 'var(--danger)' : 'var(--warning)'
                             }}>
                               {inc.severity?.toUpperCase()}
                             </span>
                          </td>
                          <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                             <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inc.status?.replace('_', ' ')}</div>
                          </td>
                          <td style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                             {new Date(inc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* ════ SECTION: VEHICLE SERVICES ════ */}
          {section === SECTION.SERVICES && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vehicle Services</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Asset maintenance, periodic overhauls, and technician scheduling.</p>
                </div>
                <button className="secondary" onClick={() => setSection(SECTION.VEHICLES)}>Manage Assets</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                <div className="glass-card" style={{ gridColumn: 'span 8', padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="outfit" style={{ margin: 0 }}>Active Service Queue</h3>
                    <span className="badge warning">{vehicles.filter(v => v.status === 'maintenance').length} Assets Grounded</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asset ID</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condition</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Technician</th>
                        <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.filter(v => v.status === 'maintenance').map(v => (
                        <tr key={v._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1.2rem' }}>
                            <div style={{ fontWeight: 700 }}>{v.plateNumber}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.name}</div>
                          </td>
                          <td style={{ padding: '1.2rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>Periodic Engine Check</span>
                          </td>
                          <td style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-accent)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>CH</div>
                               <span style={{ fontSize: '0.85rem' }}>Central Hub A</span>
                            </div>
                          </td>
                          <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                             <div style={{ fontWeight: 600, color: 'var(--warning)' }}>Today, 05:30 PM</div>
                          </td>
                        </tr>
                      ))}
                      {vehicles.filter(v => v.status === 'maintenance').length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Wrench size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No vehicles currently in service queue.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h4 className="outfit" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Predictive Alerts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', borderLeft: '3px solid var(--danger)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Brake Pad Wear: Asset TX-92</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Critical threshold reached (80%).</p>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', borderLeft: '3px solid var(--warning)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Oil Change Due: 4 Assets</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scheduled window opens in 48 hours.</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h4 className="outfit" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>System Health</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>Service Uptime</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>98.4%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '100px', overflow: 'hidden' }}>
                       <div style={{ width: '98.4%', height: '100%', background: 'var(--success)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ════ SECTION: TRIP MANAGEMENT ════ */}
          {section === SECTION.TRIPS && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Trip Management</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Create, assign, and track all fleet trips in real time.</p>
                </div>
                <button onClick={() => setShowTripModal(true)}><Plus size={18}/> Create Trip</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Trips', value: tripStats?.totalTrips ?? trips.length, color: 'var(--primary-accent)' },
                  { label: 'In Progress', value: tripStats?.byStatus?.in_progress ?? trips.filter(t => t.status === 'in_progress').length, color: 'var(--warning)' },
                  { label: 'Completed', value: tripStats?.byStatus?.completed ?? trips.filter(t => t.status === 'completed').length, color: 'var(--success)' },
                  { label: 'Total Revenue', value: `₹${((tripStats?.totalRevenue || 0)).toLocaleString()}`, color: 'var(--info)' },
                ].map((s, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
                    <h3 className="outfit" style={{ margin: 0, fontSize: '2rem', color: s.color }}>{s.value}</h3>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                {['all', 'requested', 'assigned', 'in_progress', 'completed', 'cancelled'].map(f => (
                  <button key={f} onClick={() => setTripFilter(f)} style={{ border: 'none', padding: '6px 14px', borderRadius: '100px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize', background: tripFilter === f ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)', color: tripFilter === f ? 'white' : 'var(--text-muted)', transition: '0.2s' }}>
                    {f === 'all' ? 'All' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TRIP ID</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DRIVER</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PICKUP</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DROP</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>FARE</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => {
                      const statusColor = { requested: '#3b82f6', assigned: '#8b5cf6', in_progress: '#f59e0b', completed: '#10b981', cancelled: '#ef4444' }[t.status] || 'var(--text-muted)'
                      return (
                        <tr key={t._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-accent)' }}>{String(t._id).slice(-6).toUpperCase()}</td>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{t.driverId?.name || 'Unassigned'}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.driverId?.phone}</div></td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.pickupLocation?.address || '-'}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.dropLocation?.address || '-'}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <select value={t.status} onChange={e => handleUpdateTripStatus(t._id, e.target.value)} style={{ padding: '4px 8px', background: 'var(--bg-elevated)', border: `1px solid ${statusColor}`, borderRadius: '6px', color: statusColor, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>
                              {['requested','assigned','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800 }}>₹{(t.fare || 0).toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button className="secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDeleteTrip(t._id)}><Trash2 size={12}/></button>
                          </td>
                        </tr>
                      )
                    })}
                    {trips.length === 0 && <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}><Route size={40} style={{ marginBottom: '1rem', opacity: 0.2 }}/><p>No trips found for this filter.</p></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ SECTION: FUEL MANAGEMENT ════ */}
          {section === SECTION.FUEL && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Fuel Management</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Track fuel consumption, costs, and fleet efficiency.</p>
                </div>
                <button onClick={() => setShowFuelModal(true)}><Plus size={18}/> Add Fuel Log</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Fuel Cost', value: `₹${((fuelStats?.totalCost || 0)).toLocaleString()}`, color: 'var(--danger)' },
                  { label: 'Total Liters', value: `${(fuelStats?.totalLiters || 0).toFixed(1)} L`, color: 'var(--info)' },
                  { label: 'Avg Efficiency', value: `${(fuelStats?.avgEfficiency || 0).toFixed(1)} km/L`, color: 'var(--success)' },
                  { label: 'Log Entries', value: fuelLogs.length, color: 'var(--primary-accent)' },
                ].map((s, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
                    <h3 className="outfit" style={{ margin: 0, fontSize: '2rem', color: s.color }}>{s.value}</h3>
                  </div>
                ))}
              </div>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>VEHICLE</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DRIVER</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE</th>
                      <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATION</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AMOUNT (L)</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>COST (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map(fl => (
                      <tr key={fl._id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem' }}><div style={{ fontWeight: 700 }}>{fl.vehicleId?.plateNumber || '-'}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fl.vehicleId?.name}</div></td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{fl.driverId?.name || '-'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(fl.date).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{fl.station || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{fl.fuelAmount} L</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>₹{(fl.fuelCost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {fuelLogs.length === 0 && <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}><Fuel size={40} style={{ marginBottom: '1rem', opacity: 0.2 }}/><p>No fuel logs found. Add your first entry.</p></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ SECTION: ZONE MANAGEMENT ════ */}
          {section === SECTION.ZONES && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Zone Management</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Create city-wise zones and assign fleet assets to regions.</p>
                </div>
                <button onClick={() => setShowZoneModal(true)}><Plus size={18}/> Create Zone</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {zones.map(z => (
                  <div key={z._id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderLeft: `4px solid ${z.color || '#6366f1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>{z.name}</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{z.city}{z.state ? `, ${z.state}` : ''}</p>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, background: z.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: z.isActive ? 'var(--success)' : 'var(--danger)' }}>
                        {z.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {z.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{z.description}</p>}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-accent)' }}>{z.assignedDrivers?.length || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drivers</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)' }}>{z.assignedVehicles?.length || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vehicles</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => { setSelectedZone(z); setShowZoneDetailModal(true); }}><Eye size={14}/> Details</button>
                      <button className="secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => handleDeleteZone(z._id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {zones.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Globe size={48} style={{ marginBottom: '1rem', opacity: 0.2 }}/>
                    <p>No zones created yet. Click "Create Zone" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback for other sections */}
          {![SECTION.OVERVIEW, SECTION.DRIVERS, SECTION.VEHICLES, SECTION.ACCESS, SECTION.ANALYTICS, SECTION.FINANCIALS, SECTION.SERVICES, SECTION.PERFORMANCE, SECTION.SETTINGS, SECTION.INCIDENTS, SECTION.TRACKING, SECTION.BILLING, SECTION.TRIPS, SECTION.FUEL, SECTION.ZONES].includes(section) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
               <div style={{ background: 'var(--bg-elevated)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                 <Settings size={48} className="animate-spin" style={{ animationDuration: '4s', color: 'var(--primary-accent)', marginBottom: '1.5rem' }} />
                 <h2 className="outfit">Section Under Maintenance</h2>
                 <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>Our engineers are currently upgrading the {NAV_ITEMS.find(n=>n.id===section)?.label} interface to meet the new premium standards.</p>
                 <button className="secondary" style={{ marginTop: '1rem' }} onClick={() => setSection(SECTION.OVERVIEW)}>Return to Dashboard</button>
               </div>
            </div>
          )}

        </div>

        {/* Modal: Vehicle Details */}
        {showVehicleModal && selectedVehicle && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '3rem', width: '95%', maxWidth: '800px', border: '1px solid var(--primary-accent)', borderRadius: '32px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                 <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                     <h2 className="outfit" style={{ margin: 0, fontSize: '2rem' }}>{selectedVehicle.name}</h2>
                     <span style={{ padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-accent)' }}>{selectedVehicle.plateNumber}</span>
                   </div>
                   <p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedVehicle.type} Utility • Registered: {selectedVehicle.registrationNumber}</p>
                 </div>
                 <button onClick={() => { setShowVehicleModal(false); setReassigningDriver(false); setNewAssignedDriver(''); setShowAlertForm(false); setAlertMessage(''); }} className="secondary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>X</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                 {/* Left: Driver Assignment */}
                 <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                    <h4 className="outfit" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="var(--primary-accent)"/> Assigned Personnel</h4>
                    
                    {selectedVehicle.assignedDriver ? (
                      <div>
                         <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                              {selectedVehicle.assignedDriver.name?.charAt(0)}
                            </div>
                            <div>
                               <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedVehicle.assignedDriver.name}</h3>
                               <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedVehicle.assignedDriver.phone}</p>
                               <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '4px', fontWeight: 800 }}>ON DUTY</span>
                            </div>
                         </div>
                         {reassigningDriver ? (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             <select style={{ padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', width: '100%' }} value={newAssignedDriver} onChange={e => setNewAssignedDriver(e.target.value)}>
                               <option value="">Select new driver...</option>
                               {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                             </select>
                             <div style={{ display: 'flex', gap: '8px' }}>
                               <button style={{ flex: 1, fontSize: '0.8rem' }} onClick={handleAssignDriverToVehicle}>Confirm</button>
                               <button className="secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => { setReassigningDriver(false); setNewAssignedDriver('') }}>Cancel</button>
                             </div>
                           </div>
                         ) : (
                           <div style={{ display: 'flex', gap: '8px' }}>
                             <button className="secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => { setShowVehicleModal(false); setSection(SECTION.DRIVERS); setSearch(selectedVehicle.assignedDriver?.name || ''); }}><FileText size={14}/> View Profile</button>
                             <button className="secondary" style={{ flex: 1, fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => setReassigningDriver(true)}>Reassign</button>
                           </div>
                         )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><UserX size={24} color="var(--text-muted)"/></div>
                         <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>No driver currently assigned to this vehicle.</p>
                           {reassigningDriver ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <select style={{ padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }} value={newAssignedDriver} onChange={e => setNewAssignedDriver(e.target.value)}>
                                <option value="">Select driver...</option>
                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                              </select>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{ flex: 1, fontSize: '0.8rem' }} onClick={handleAssignDriverToVehicle}>Confirm Assign</button>
                                <button className="secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => { setReassigningDriver(false); setNewAssignedDriver('') }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button style={{ width: '100%' }} onClick={() => setReassigningDriver(true)}>+ Assign Driver</button>
                          )}
                      </div>
                    )}
                 </div>

                 {/* Right: Technical Stats */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>98%</div>
                       </div>
                       <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fuel</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--info)' }}>74%</div>
                       </div>
                    </div>
                    
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                       <h5 className="outfit" style={{ margin: '0 0 1rem' }}>Upcoming Maintenance</h5>
                       <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16}/></div>
                          <div>
                             <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Periodic Service</p>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due in 14 days • Est. ₹4,500</span>
                          </div>
                       </div>
                    </div>

                      {showAlertForm ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea placeholder="Message to driver..." value={alertMessage} onChange={e => setAlertMessage(e.target.value)} style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', resize: 'vertical', minHeight: '80px', width: '100%', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ flex: 1, fontSize: '0.8rem' }} onClick={handleSendDriverAlert}><Send size={14}/> Send Alert</button>
                            <button className="secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => { setShowAlertForm(false); setAlertMessage('') }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="secondary" style={{ width: '100%' }} onClick={() => setShowAlertForm(true)} disabled={!selectedVehicle?.assignedDriver}><Bell size={16}/> Send Alert to Driver</button>
                      )}
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Add Driver */}
        {showDriverModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '3.5rem', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '40px', border: '1px solid var(--primary-accent)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                  <h2 className="outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Recruit New Pilot</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Initialize background verification and asset assignment sequence.</p>
                </div>
                <button onClick={() => setShowDriverModal(false)} className="secondary" style={{ borderRadius: '50%', width: '40px', height: '40px' }}>X</button>
              </div>

              <form onSubmit={handleRegisterDriver}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                  {/* Sector 1: Personal Profile */}
                  <div>
                    <h3 className="outfit" style={{ fontSize: '1rem', color: 'var(--primary-accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Fingerprint size={18}/> 01. Biological Profile
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div className="input-group">
                        <label>Full Legal Name</label>
                        <input required value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} placeholder="John Doe" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                          <label>Contact Phone</label>
                          <input required value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} placeholder="+91" />
                        </div>
                        <div className="input-group">
                          <label>Age</label>
                          <input required type="number" value={driverForm.age} onChange={e => setDriverForm({...driverForm, age: e.target.value})} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Marital Status</label>
                        <select value={driverForm.maritalStatus} onChange={e => setDriverForm({...driverForm, maritalStatus: e.target.value})} className="secondary" style={{ width: '100%', height: '48px' }}>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sector 2: Security & KYC */}
                  <div>
                    <h3 className="outfit" style={{ fontSize: '1rem', color: 'var(--warning)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18}/> 02. Credential Verification
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div className="input-group">
                        <label>Aadhar Number (UIDAI)</label>
                        <input required value={driverForm.aadharNumber} onChange={e => setDriverForm({...driverForm, aadharNumber: e.target.value})} placeholder="0000 0000 0000" />
                      </div>
                      <div className="input-group">
                        <label>PAN Identification</label>
                        <input value={driverForm.panNumber} onChange={e => setDriverForm({...driverForm, panNumber: e.target.value})} placeholder="ABCDE1234F" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                          <label>License No.</label>
                          <input required value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} placeholder="DL-..." />
                        </div>
                        <div className="input-group">
                          <label>License Expiry</label>
                          <input type="date" required value={driverForm.licenseExpiry} onChange={e => setDriverForm({...driverForm, licenseExpiry: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sector 3: Residential Data */}
                <div style={{ marginTop: '3rem' }}>
                  <h3 className="outfit" style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18}/> 03. Tactical Address
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
                     <div className="input-group">
                        <label>Street / Block</label>
                        <input value={driverForm.address.street} onChange={e => setDriverForm({...driverForm, address: {...driverForm.address, street: e.target.value}})} placeholder="123 Alpha St." />
                     </div>
                     <div className="input-group">
                        <label>City</label>
                        <input value={driverForm.address.city} onChange={e => setDriverForm({...driverForm, address: {...driverForm.address, city: e.target.value}})} />
                     </div>
                     <div className="input-group">
                        <label>State</label>
                        <input value={driverForm.address.state} onChange={e => setDriverForm({...driverForm, address: {...driverForm.address, state: e.target.value}})} />
                     </div>
                     <div className="input-group">
                        <label>Pincode</label>
                        <input value={driverForm.address.pincode} onChange={e => setDriverForm({...driverForm, address: {...driverForm.address, pincode: e.target.value}})} />
                     </div>
                  </div>
                </div>

                <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowDriverModal(false)} className="secondary">Abort Mission</button>
                  <button type="submit" disabled={loading} style={{ padding: '0 4rem', height: '60px' }}>
                    {loading ? 'Initializing...' : 'Authorize Recruitment'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Vehicle */}
        {showVehicleAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '95%', maxWidth: '600px', border: '1px solid var(--primary-accent)', borderRadius: '24px' }}>
              <h2 className="outfit" style={{ marginTop: 0 }}>Deploy New Asset</h2>
              <form onSubmit={handleCreateVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Vehicle Name / Model</label>
                  <input required value={vehicleForm.name} onChange={e => setVehicleForm({...vehicleForm, name: e.target.value})} placeholder="Toyota Camry 2024" />
                </div>
                <div>
                  <label>Plate Number</label>
                  <input required value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} placeholder="ABC-123" />
                </div>
                <div>
                  <label>Registration Number</label>
                  <input required value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})} placeholder="REG-456" />
                </div>
                <div>
                  <label>Fuel Type</label>
                  <select value={vehicleForm.fuelType} onChange={e => setVehicleForm({...vehicleForm, fuelType: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>
                <div>
                  <label>Vehicle Type</label>
                  <select value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                    <option value="utility">Utility</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  <button type="submit" style={{ flex: 1 }}>Initialize Asset</button>
                  <button type="button" onClick={() => setShowVehicleAddModal(false)} className="secondary" style={{ flex: 1 }}>Abort</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Report Accident */}
        {showAccidentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '95%', maxWidth: '600px', border: '1px solid var(--danger)', borderRadius: '24px' }}>
              <h2 className="outfit" style={{ marginTop: 0, color: 'var(--danger)' }}>Incident Protocol Alpha</h2>
              <form onSubmit={handleReportAccident} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label>Select Involved Pilot</label>
                  <select required value={accidentForm.driverId} onChange={e => setAccidentForm({...accidentForm, driverId: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                    <option value="">Choose Pilot...</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                  </select>
                </div>
                <div>
                  <label>Select Involved Asset</label>
                  <select required value={accidentForm.vehicleId} onChange={e => setAccidentForm({...accidentForm, vehicleId: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                    <option value="">Choose Vehicle...</option>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} - {v.plateNumber}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Incident Type</label>
                    <select value={accidentForm.type} onChange={e => setAccidentForm({...accidentForm, type: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                      <option value="accident">Accident</option>
                      <option value="violation">Traffic Violation</option>
                      <option value="speeding">Over Speeding</option>
                      <option value="rude_behavior">Misbehavior</option>
                    </select>
                  </div>
                  <div>
                    <label>Severity</label>
                    <select value={accidentForm.severity} onChange={e => setAccidentForm({...accidentForm, severity: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label>Incident Summary</label>
                  <textarea required value={accidentForm.description} onChange={e => setAccidentForm({...accidentForm, description: e.target.value})} placeholder="Detailed description of the event..." style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  <button type="submit" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }}>Dispatch Report</button>
                  <button type="button" onClick={() => setShowAccidentModal(false)} className="secondary" style={{ flex: 1 }}>Close</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Bulk Operations */}
        {showBulkModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '640px', border: '1px solid var(--border-subtle)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div><h2 className="outfit" style={{ margin: 0 }}>Bulk Driver Enrollment</h2><p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Paste CSV data: Name, Phone, Email, Password (one per line)</p></div>
                <button onClick={() => { setShowBulkModal(false); setBulkResult(null); setBulkData('') }} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Format:</strong> John Doe, 9999999999, john@email.com, Password123<br/>
                One driver per line. Password is optional (defaults to WaidFleet@123).
              </div>
              <textarea
                value={bulkData}
                onChange={e => setBulkData(e.target.value)}
                placeholder={"John Doe, 9999999999, john@example.com\nJane Smith, 8888888888, jane@example.com, SecurePass1"}
                style={{ width: '100%', minHeight: '180px', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white', fontSize: '0.85rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
              />
              {bulkResult && (
                <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: '12px', background: bulkResult.failed > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${bulkResult.failed > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{bulkResult.enrolled} of {bulkResult.total} drivers enrolled successfully{bulkResult.failed > 0 ? ` (${bulkResult.failed} failed)` : '.'}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={handleBulkEnroll} disabled={bulkLoading} style={{ flex: 1 }}>{bulkLoading ? 'Enrolling...' : 'Enroll Drivers'}</button>
                <button onClick={() => { setShowBulkModal(false); setBulkResult(null); setBulkData('') }} className="secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Sub-Admin Invitation */}
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '95%', maxWidth: '700px', border: '1px solid var(--primary-accent)', borderRadius: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
               <h2 className="outfit" style={{ marginTop: 0 }}>{editingSubAdmin ? 'Edit Sub-Admin' : 'Authorize Sub-Admin'}</h2>
               <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Grant specific permissions and define access timeframe for new administrative personnel.</p>
               
               <form onSubmit={handleCreateSubAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                     <label>Full Name</label>
                     <input required value={saForm.name} onChange={e => setSaForm({...saForm, name: e.target.value})} placeholder="Jane Smith" />
                  </div>
                  <div>
                     <label>Email Address</label>
                     <input required type="email" value={saForm.email} onChange={e => setSaForm({...saForm, email: e.target.value})} placeholder="jane@waidfleet.com" />
                  </div>
                  <div>
                     <label>Temporary Password</label>
                     <input required type="password" value={saForm.password} onChange={e => setSaForm({...saForm, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div>
                     <label>Mobile Number</label>
                     <input required value={saForm.phone} onChange={e => setSaForm({...saForm, phone: e.target.value})} placeholder="9900XXX000" />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                     <h4 className="outfit" style={{ margin: '1rem 0', color: 'var(--primary-accent)', fontSize: '0.9rem' }}>Temporal Access Control</h4>
                     <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <input 
                             type="checkbox" 
                             checked={saForm.isTemporary} 
                             onChange={e => setSaForm({...saForm, isTemporary: e.target.checked})} 
                             style={{ width: '18px', height: '18px' }}
                           />
                           <label style={{ margin: 0, cursor: 'pointer' }}>Time-Bound Access Only</label>
                        </div>
                        {saForm.isTemporary && (
                          <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                             <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem' }}>Starts At</label>
                                <input type="datetime-local" value={saForm.accessStartsAt} onChange={e => setSaForm({...saForm, accessStartsAt: e.target.value})} />
                             </div>
                             <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem' }}>Expires At</label>
                                <input type="datetime-local" value={saForm.accessExpiresAt} onChange={e => setSaForm({...saForm, accessExpiresAt: e.target.value})} />
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                     <h4 className="outfit" style={{ margin: '1rem 0', color: 'var(--primary-accent)', fontSize: '0.9rem' }}>Permission Matrix</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                        {ALL_PERMISSIONS.map(p => (
                          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <input 
                               type="checkbox" 
                               checked={saForm.permissions.includes(p.key)}
                               onChange={e => {
                                 const updated = e.target.checked 
                                   ? [...saForm.permissions, p.key]
                                   : saForm.permissions.filter(k => k !== p.key)
                                 setSaForm({...saForm, permissions: updated})
                               }}
                             />
                             <span style={{ fontSize: '0.8rem' }}>{p.label}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <button type="submit" disabled={saLoading} style={{ flex: 1 }}>
                        {saLoading ? 'Synchronizing Intelligence...' : 'Authorize Personnel'}
                     </button>
                     <button type="button" onClick={() => { setShowCreateModal(false); setEditingSubAdmin(null); }} className="secondary" style={{ flex: 1 }}>Cancel</button>
                  </div>
               </form>
            </div>
          </div>
        )}

        {/* Modal: Create Trip */}
        {showTripModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '600px', border: '1px solid var(--primary-accent)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="outfit" style={{ margin: 0 }}>Create Trip</h2>
                <button onClick={() => setShowTripModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <form onSubmit={handleCreateTrip} style={{ display: 'grid', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assign Driver</label>
                    <select value={tripForm.driverId} onChange={e => setTripForm({...tripForm, driverId: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}>
                      <option value="">Auto-assign</option>
                      {drivers.filter(d => d.isActive).map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assign Vehicle</label>
                    <select value={tripForm.vehicleId} onChange={e => setTripForm({...tripForm, vehicleId: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}>
                      <option value="">Select vehicle</option>
                      {vehicles.filter(v => v.status === 'active').map(v => <option key={v._id} value={v._id}>{v.plateNumber} - {v.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pickup Address</label><input required value={tripForm.pickupAddress} onChange={e => setTripForm({...tripForm, pickupAddress: e.target.value})} placeholder="Enter pickup location" /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drop Address</label><input required value={tripForm.dropAddress} onChange={e => setTripForm({...tripForm, dropAddress: e.target.value})} placeholder="Enter drop location" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger Name</label><input value={tripForm.passengerName} onChange={e => setTripForm({...tripForm, passengerName: e.target.value})} placeholder="Passenger" /></div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger Phone</label><input value={tripForm.passengerPhone} onChange={e => setTripForm({...tripForm, passengerPhone: e.target.value})} placeholder="Phone" /></div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fare (₹)</label><input type="number" value={tripForm.fare} onChange={e => setTripForm({...tripForm, fare: e.target.value})} placeholder="0" /></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ flex: 1 }}>Create Trip</button>
                  <button type="button" onClick={() => setShowTripModal(false)} className="secondary" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Fuel Log */}
        {showFuelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '560px', border: '1px solid var(--primary-accent)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="outfit" style={{ margin: 0 }}>Add Fuel Log</h2>
                <button onClick={() => setShowFuelModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <form onSubmit={handleAddFuelLog} style={{ display: 'grid', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicle *</label>
                    <select required value={fuelForm.vehicleId} onChange={e => setFuelForm({...fuelForm, vehicleId: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} - {v.name}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Driver</label>
                    <select value={fuelForm.driverId} onChange={e => setFuelForm({...fuelForm, driverId: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}>
                      <option value="">Select driver</option>
                      {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount (L) *</label><input required type="number" step="0.1" value={fuelForm.fuelAmount} onChange={e => setFuelForm({...fuelForm, fuelAmount: e.target.value})} placeholder="0.0" /></div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cost (₹) *</label><input required type="number" value={fuelForm.fuelCost} onChange={e => setFuelForm({...fuelForm, fuelCost: e.target.value})} placeholder="0" /></div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Odometer</label><input type="number" value={fuelForm.odometer} onChange={e => setFuelForm({...fuelForm, odometer: e.target.value})} placeholder="km" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fuel Type</label>
                    <select value={fuelForm.fuelType} onChange={e => setFuelForm({...fuelForm, fuelType: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}>
                      <option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="cng">CNG</option><option value="electric">Electric</option>
                    </select>
                  </div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Station Name</label><input value={fuelForm.station} onChange={e => setFuelForm({...fuelForm, station: e.target.value})} placeholder="Fuel station" /></div>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notes</label><input value={fuelForm.notes} onChange={e => setFuelForm({...fuelForm, notes: e.target.value})} placeholder="Optional notes" /></div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ flex: 1 }}>Save Fuel Log</button>
                  <button type="button" onClick={() => setShowFuelModal(false)} className="secondary" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Zone */}
        {showZoneModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '480px', border: '1px solid var(--primary-accent)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="outfit" style={{ margin: 0 }}>Create Zone</h2>
                <button onClick={() => setShowZoneModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <form onSubmit={handleCreateZone} style={{ display: 'grid', gap: '1.2rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zone Name *</label><input required value={zoneForm.name} onChange={e => setZoneForm({...zoneForm, name: e.target.value})} placeholder="e.g. North Mumbai" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>City *</label><input required value={zoneForm.city} onChange={e => setZoneForm({...zoneForm, city: e.target.value})} placeholder="Mumbai" /></div>
                  <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>State</label><input value={zoneForm.state} onChange={e => setZoneForm({...zoneForm, state: e.target.value})} placeholder="Maharashtra" /></div>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description</label><textarea value={zoneForm.description} onChange={e => setZoneForm({...zoneForm, description: e.target.value})} placeholder="Zone description..." style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zone Color</label>
                  <input type="color" value={zoneForm.color} onChange={e => setZoneForm({...zoneForm, color: e.target.value})} style={{ width: '48px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }} />
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: zoneForm.color, display: 'inline-block', border: '2px solid white' }}></span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ flex: 1 }}>Create Zone</button>
                  <button type="button" onClick={() => setShowZoneModal(false)} className="secondary" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Zone Details */}
        {showZoneDetailModal && selectedZone && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '720px', border: `1px solid ${selectedZone.color || 'var(--primary-accent)'}`, borderRadius: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div><h2 className="outfit" style={{ margin: '0 0 4px' }}>{selectedZone.name}</h2><p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedZone.city}{selectedZone.state ? `, ${selectedZone.state}` : ''}</p></div>
                <button onClick={() => setShowZoneDetailModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 className="outfit" style={{ marginBottom: '1rem', color: 'var(--primary-accent)' }}>Assigned Drivers ({selectedZone.assignedDrivers?.length || 0})</h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <select value={zoneAssignDriver} onChange={e => setZoneAssignDriver(e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                      <option value="">Select driver to add</option>
                      {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    <button style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleZoneAssignDriver(selectedZone._id)}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedZone.assignedDrivers?.map(d => (
                      <div key={d._id || d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.name || d}</span>
                        <button className="secondary" style={{ padding: '3px 8px', fontSize: '0.7rem', color: 'var(--danger)' }} onClick={() => handleZoneRemoveDriver(selectedZone._id, d._id || d)}>Remove</button>
                      </div>
                    ))}
                    {!selectedZone.assignedDrivers?.length && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No drivers assigned.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="outfit" style={{ marginBottom: '1rem', color: 'var(--info)' }}>Assigned Vehicles ({selectedZone.assignedVehicles?.length || 0})</h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <select value={zoneAssignVehicle} onChange={e => setZoneAssignVehicle(e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                      <option value="">Select vehicle to add</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} - {v.name}</option>)}
                    </select>
                    <button style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleZoneAssignVehicle(selectedZone._id)}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedZone.assignedVehicles?.map(v => (
                      <div key={v._id || v} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v.plateNumber || v}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.name}</span>
                      </div>
                    ))}
                    {!selectedZone.assignedVehicles?.length && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No vehicles assigned.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bill Statement Detail */}
        {showBillDetailModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '560px', border: '1px solid var(--border-subtle)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="outfit" style={{ margin: 0 }}>Bill #{selectedBill.billNumber}</h2>
                <button onClick={() => setShowBillDetailModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}><p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>DRIVER</p><p style={{ margin: 0, fontWeight: 700 }}>{selectedBill.driverId?.name}</p><p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedBill.driverId?.phone}</p></div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}><p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</p><span className={`badge ${selectedBill.billStatus === 'paid' ? 'success' : selectedBill.isOverdue ? 'danger' : 'warning'}`}>{selectedBill.isOverdue ? 'OVERDUE' : (selectedBill.billStatus || '').toUpperCase()}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}><p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PERIOD START</p><p style={{ margin: 0 }}>{selectedBill.periodStartDate ? new Date(selectedBill.periodStartDate).toLocaleDateString() : '-'}</p></div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}><p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PERIOD END</p><p style={{ margin: 0 }}>{selectedBill.periodEndDate ? new Date(selectedBill.periodEndDate).toLocaleDateString() : '-'}</p></div>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL AMOUNT</p>
                  <h2 className="outfit" style={{ margin: 0, fontSize: '2.5rem', color: selectedBill.finalAmount < 0 ? 'var(--danger)' : 'white' }}>₹{Math.abs(selectedBill.finalAmount || 0).toLocaleString()}</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1 }} onClick={() => { downloadCSV(`bill_${selectedBill.billNumber}.csv`, [['Bill','Driver','Phone','Period','Amount','Status'],[selectedBill.billNumber, selectedBill.driverId?.name, selectedBill.driverId?.phone, `${new Date(selectedBill.periodStartDate).toLocaleDateString()} - ${new Date(selectedBill.periodEndDate).toLocaleDateString()}`, selectedBill.finalAmount, selectedBill.billStatus]]); toast.success('Bill exported'); }}><Download size={14}/> Export</button>
                  {selectedBill.billStatus !== 'paid' && <button style={{ flex: 1 }} onClick={async () => { await fetch(`/api/billing/${selectedBill._id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } }); fetchBills(); setShowBillDetailModal(false); toast.success('Payment recorded'); }}>Mark Paid</button>}
                  <button onClick={() => setShowBillDetailModal(false)} className="secondary" style={{ flex: 1 }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: 2FA Setup */}
        {show2FAModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px', border: '1px solid var(--primary-accent)', borderRadius: '32px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={() => setShow2FAModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button></div>
              <Fingerprint size={48} color="var(--primary-accent)" style={{ marginBottom: '1.5rem' }}/>
              <h2 className="outfit" style={{ margin: '0 0 1rem' }}>Two-Factor Authentication</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>2FA via TOTP (Google Authenticator / Authy) will be enabled in a future security update. Your account is currently protected by JWT session tokens with configurable expiry.</p>
              <button onClick={() => { setShow2FAModal(false); toast.info('2FA will be available in the next release.'); }} style={{ width: '100%' }}>Understood</button>
            </div>
          </div>
        )}

        {/* Modal: Edit Profile */}
        {showProfileEditModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div className="glass-pane animate-scale-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px', border: '1px solid var(--primary-accent)', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="outfit" style={{ margin: 0 }}>Edit Profile</h2>
                <button onClick={() => setShowProfileEditModal(false)} className="secondary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>X</button>
              </div>
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</label><input value={profileEditForm.name} onChange={e => setProfileEditForm({...profileEditForm, name: e.target.value})} placeholder="Your name" /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</label><input value={profileEditForm.phone} onChange={e => setProfileEditForm({...profileEditForm, phone: e.target.value})} placeholder="+91 9999999999" /></div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button onClick={handleUpdateProfile} style={{ flex: 1 }}>Save Changes</button>
                  <button onClick={() => setShowProfileEditModal(false)} className="secondary" style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}


      </main>
    </div>
  )
}
