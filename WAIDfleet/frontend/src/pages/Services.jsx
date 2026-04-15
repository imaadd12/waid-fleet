import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../styles/Dashboard.css'

export function Services() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [notifications, setNotifications] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('view')
  const [editingService, setEditingService] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Service form
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    serviceType: 'routine',
    description: '',
    nextServiceDate: '',
    frequency: 'monthly',
    estimatedCost: 0,
    reminderDaysBefore: 7,
    serviceProvider: ''
  })

  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchServices()
    fetchNotifications()
    fetchVehicles()
    fetchDrivers()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/services?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setServices(data.data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      alert('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/notifications?limit=50&type=service_reminder`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(data.data || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vehicles?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setVehicles(data.data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/drivers?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDrivers(data.data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (res.ok) {
        alert('Service schedule created successfully!')
        setFormData({
          vehicleId: '', driverId: '', serviceType: 'routine', description: '',
          nextServiceDate: '', frequency: 'monthly', estimatedCost: 0,
          reminderDaysBefore: 7, serviceProvider: ''
        })
        fetchServices()
        setActiveTab('view')
      } else {
        alert(data.message || 'Failed to create service')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating service')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteService = async (serviceId) => {
    try {
      const token = localStorage.getItem('token')
      const completedDate = new Date().toISOString().split('T')[0]
      
      const res = await fetch(`/api/services/${serviceId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completedDate })
      })
      
      const data = await res.json()
      if (res.ok) {
        alert('Service marked as completed!')
        fetchServices()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error completing service')
    }
  }

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#007bff',
      overdue: '#dc3545',
      completed: '#28a745',
      cancelled: '#6c757d'
    }
    return colors[status] || '#6c757d'
  }

  const filteredServices = services.filter(s => {
    const statusMatch = filterStatus === 'all' || s.status === filterStatus
    const typeMatch = filterType === 'all' || s.serviceType === filterType
    return statusMatch && typeMatch
  })

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>WAID Fleet</h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#dashboard" onClick={() => navigate('/dashboard')}>Dashboard</a></li>
          <li><a href="#drivers" onClick={() => navigate('/drivers')}>Drivers</a></li>
          <li><a href="#vehicles" onClick={() => navigate('/vehicles')}>Vehicles</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#performance" onClick={() => navigate('/performance')}>Performance</a></li>
          <li><a href="#billing" onClick={() => navigate('/billing')}>Billing</a></li>
          <li><a href="#earnings" onClick={() => navigate('/earnings')}>Earnings</a></li>
          <li><a href="#payments" onClick={() => navigate('/payments')}>Payments</a></li>
        </ul>
        <button className="logout-btn" onClick={() => {
          logout()
          navigate('/login')
        }}>
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>🔧 Vehicle Service Management</h2>
          <p>Schedule and track vehicle maintenance and services</p>
        </div>

        {/* Notifications Alert */}
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>⚠️ {unreadCount} Service Reminders</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                You have pending service notifications
              </p>
            </div>
            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              View Alerts
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="driver-tabs">
          <button
            className={`driver-tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Services ({services.length})</span>
          </button>
          <button
            className={`driver-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setEditingService(null)
              setFormData({
                vehicleId: '', driverId: '', serviceType: 'routine', description: '',
                nextServiceDate: '', frequency: 'monthly', estimatedCost: 0,
                reminderDaysBefore: 7, serviceProvider: ''
              })
              setActiveTab('add')
            }}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-label">Schedule Service</span>
          </button>
          <button
            className={`driver-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="tab-icon">🔔</span>
            <span className="tab-label">Notifications ({unreadCount})</span>
          </button>
        </div>

        {/* View Services Tab */}
        {activeTab === 'view' && (
          <div className="tab-content">
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Types</option>
                <option value="routine">Routine</option>
                <option value="major">Major</option>
                <option value="oil_change">Oil Change</option>
                <option value="tire_rotation">Tire Rotation</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            {loading ? (
              <p>Loading services...</p>
            ) : filteredServices.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f5f5f5' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Vehicle</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Driver</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Next Service</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Frequency</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map(service => (
                      <tr key={service._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>
                          <strong>{service.vehicleId?.name}</strong>
                          <br/>
                          <small style={{ color: '#666' }}>{service.vehicleId?.plateNumber}</small>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {service.driverId?.name}
                          <br/>
                          <small style={{ color: '#666' }}>{service.driverId?.phone}</small>
                        </td>
                        <td style={{ padding: '12px' }}>{service.serviceType}</td>
                        <td style={{ padding: '12px' }}>
                          {new Date(service.nextServiceDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>{service.frequency}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: getStatusColor(service.status) + '20',
                            color: getStatusColor(service.status),
                            fontWeight: 'bold'
                          }}>
                            {service.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {service.status === 'scheduled' || service.status === 'overdue' ? (
                            <button
                              onClick={() => handleCompleteService(service._id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Mark Complete
                            </button>
                          ) : (
                            <span style={{ color: '#999' }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                No services found
              </p>
            )}
          </div>
        )}

        {/* Schedule Service Tab */}
        {activeTab === 'add' && (
          <div className="tab-content">
            <form onSubmit={handleAddService} style={{ maxWidth: '600px' }}>
              <h3>Schedule Vehicle Service</h3>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.name} ({vehicle.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Driver *</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="">Select a driver</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Type</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', cursor: 'pointer' }}
                  >
                    <option value="routine">Routine</option>
                    <option value="major">Major</option>
                    <option value="oil_change">Oil Change</option>
                    <option value="tire_rotation">Tire Rotation</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', cursor: 'pointer' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (3 months)</option>
                    <option value="biannual">Biannual (6 months)</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Next Service Date *</label>
                <input
                  type="date"
                  value={formData.nextServiceDate}
                  onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Estimated Cost</label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reminder Days Before</label>
                  <input
                    type="number"
                    value={formData.reminderDaysBefore}
                    onChange={(e) => setFormData({ ...formData, reminderDaysBefore: e.target.value })}
                    placeholder="7"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Provider</label>
                <input
                  type="text"
                  value={formData.serviceProvider}
                  onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                  placeholder="Service center name"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service details..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '80px' }}
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Scheduling...' : 'Schedule Service'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="tab-content">
            <h3>Service Notifications & Reminders</h3>

            {notifications.length > 0 ? (
              <div>
                {notifications.map(notification => (
                  <div
                    key={notification._id}
                    style={{
                      border: '1px solid #ddd',
                      padding: '15px',
                      marginBottom: '15px',
                      borderRadius: '4px',
                      backgroundColor: notification.isRead ? '#f9f9f9' : '#fffbea',
                      borderLeft: `4px solid ${
                        notification.priority === 'critical' ? '#dc3545' :
                        notification.priority === 'high' ? '#ffc107' : '#17a2b8'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{notification.title}</h4>
                        <p style={{ margin: '5px 0', color: '#666' }}>{notification.message}</p>
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
                          <span>Vehicle: {notification.vehicleId?.name} ({notification.vehicleId?.plateNumber})</span>
                          <span style={{ marginLeft: '15px' }}>Driver: {notification.driverId?.name}</span>
                          <span style={{ marginLeft: '15px' }}>
                            Due: {new Date(notification.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkNotificationAsRead(notification._id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginLeft: '15px'
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                No notifications
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
