import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../styles/Dashboard.css'

export function Payments() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

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
          <li><a href="#services" onClick={() => navigate('/services')}>Services</a></li>
          <li><a href="#performance" onClick={() => navigate('/performance')}>Performance</a></li>
          <li><a href="#billing" onClick={() => navigate('/billing')}>Billing</a></li>
          <li><a href="#earnings" onClick={() => navigate('/earnings')}>Earnings</a></li>
          <li><a href="#payments">Payments</a></li>
        </ul>
        <button className="logout-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Payment Management</h2>
          <p>Manage driver payments and transactions.</p>
        </div>

        <div className="placeholder-content">
          <div className="placeholder-card">
            <h3>💳 Payment Processing</h3>
            <p>Process and track driver payments.</p>
            <div className="placeholder-actions">
              <button>Process Payments</button>
              <button>Payment History</button>
            </div>
          </div>

          <div className="placeholder-card">
            <h3>📈 Payment Analytics</h3>
            <p>Monitor payment trends and outstanding balances.</p>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">Pending Payments</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">Processed This Week</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">Total Paid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
