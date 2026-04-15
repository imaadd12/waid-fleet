import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../styles/Dashboard.css'

export function Earnings() {
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
          <li><a href="#earnings">Earnings</a></li>
          <li><a href="#payments" onClick={() => navigate('/payments')}>Payments</a></li>
        </ul>
        <button className="logout-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Earnings & Revenue</h2>
          <p>Track driver earnings and fleet revenue.</p>
        </div>

        <div className="placeholder-content">
          <div className="placeholder-card">
            <h3>💰 Weekly Earnings</h3>
            <p>View earnings reports for all drivers.</p>
            <div className="placeholder-actions">
              <button>Generate Report</button>
              <button>View Details</button>
            </div>
          </div>

          <div className="placeholder-card">
            <h3>📊 Revenue Analytics</h3>
            <p>Track overall fleet performance and revenue.</p>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">This Week</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$-</span>
                <span className="stat-label">Total Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
