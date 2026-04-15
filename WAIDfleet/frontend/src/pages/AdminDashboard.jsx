import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "/api/admin";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashRes = await fetch(`${API_BASE}/dashboard`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const dashData = await dashRes.json();
      setDashboardData(dashData.data);

      const chartsRes = await fetch(`${API_BASE}/dashboard/charts`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const chartsData_res = await chartsRes.json();
      setChartsData(chartsData_res.data);

      const alertsRes = await fetch(`${API_BASE}/dashboard/alerts`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const OverviewTab = () => (
    <div className="admin-overview">
      <div className="kpi-grid">
        {/* DRIVER KPIs */}
        <div className="kpi-card drivers">
          <h3>👥 Drivers</h3>
          <div className="kpi-stat">
            <span className="value">{dashboardData?.kpis?.drivers?.total}</span>
            <span className="label">Total Drivers</span>
          </div>
          <div className="kpi-breakdown">
            <p>Active: <strong>{dashboardData?.kpis?.drivers?.active}</strong></p>
            <p>Verified: <strong>{dashboardData?.kpis?.drivers?.verified}</strong></p>
            <p>Suspended: <strong>{dashboardData?.kpis?.drivers?.suspended}</strong></p>
            <p>Utilization: <strong>{dashboardData?.kpis?.drivers?.utilization}%</strong></p>
          </div>
        </div>

        {/* VEHICLE KPIs */}
        <div className="kpi-card vehicles">
          <h3>🚗 Vehicles</h3>
          <div className="kpi-stat">
            <span className="value">{dashboardData?.kpis?.vehicles?.total}</span>
            <span className="label">Total Vehicles</span>
          </div>
          <div className="kpi-breakdown">
            <p>Active: <strong>{dashboardData?.kpis?.vehicles?.active}</strong></p>
            <p>Utilization: <strong>{dashboardData?.kpis?.vehicles?.utilization}%</strong></p>
          </div>
        </div>

        {/* FINANCE KPIs */}
        <div className="kpi-card finance">
          <h3>💰 Finance</h3>
          <div className="kpi-stat">
            <span className="value">₹{dashboardData?.kpis?.finance?.todayRevenue}</span>
            <span className="label">Today Revenue</span>
          </div>
          <div className="kpi-breakdown">
            <p>Month: <strong>₹{dashboardData?.kpis?.finance?.monthRevenue}</strong></p>
            <p>Collected: <strong>₹{dashboardData?.kpis?.finance?.totalCollected}</strong></p>
            <p>Collection Rate: <strong>{dashboardData?.kpis?.finance?.collectionRate}%</strong></p>
          </div>
        </div>

        {/* OPERATIONS KPIs */}
        <div className="kpi-card operations">
          <h3>📊 Operations</h3>
          <div className="kpi-stat">
            <span className="value">{dashboardData?.kpis?.operations?.todayTrips}</span>
            <span className="label">Today Trips</span>
          </div>
          <div className="kpi-breakdown">
            <p>Month Trips: <strong>{dashboardData?.kpis?.operations?.totalTrips}</strong></p>
            <p>Completion: <strong>{dashboardData?.kpis?.operations?.completionRate}%</strong></p>
            <p>Avg Rating: <strong>⭐ {dashboardData?.kpis?.operations?.avgRating}</strong></p>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Important Alerts</h3>
          <div className="alerts-grid">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert alert-${alert.severity}`}>
                <div className="alert-icon">
                  {alert.severity === "critical" ? "🔴" : "🟡"}
                </div>
                <div className="alert-content">
                  <h4>{alert.message}</h4>
                  <p>Count: {alert.count}</p>
                  <button className="btn-small" onClick={() => navigate(alert.action)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ChartsTab = () => (
    <div className="admin-charts">
      {chartsData && (
        <>
          {/* REVENUE TREND */}
          <div className="chart-container">
            <h3>📈 Revenue Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartsData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2196F3" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* DRIVER DISTRIBUTION */}
          <div className="chart-container">
            <h3>👥 Driver Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartsData.driverDistribution}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  <Cell fill="#4CAF50" />
                  <Cell fill="#2196F3" />
                  <Cell fill="#FF9800" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* TRIP DISTRIBUTION */}
          <div className="chart-container">
            <h3>🚗 Trip Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartsData.tripDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2196F3" name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );

  const LinksTab = () => (
    <div className="admin-links">
      <div className="links-grid">
        <div className="link-card" onClick={() => navigate("/admin/users")}>
          <h3>👥 Admin Users</h3>
          <p>Manage admin accounts, roles & permissions</p>
        </div>
        <div className="link-card" onClick={() => navigate("/admin/tickets")}>
          <h3>🎫 Support Tickets</h3>
          <p>View & manage support tickets</p>
        </div>
        <div className="link-card" onClick={() => navigate("/admin/audit-logs")}>
          <h3>📋 Audit Logs</h3>
          <p>Track all system activities</p>
        </div>
        <div className="link-card" onClick={() => navigate("/admin/reports")}>
          <h3>📊 Reports</h3>
          <p>Generate and view reports</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h1>🔐 Admin Panel</h1>
        </div>
        <ul className="navbar-menu">
          <li><a href="#admin">Dashboard</a></li>
          <li><a href="#users" onClick={() => navigate("/admin/users")}>Users</a></li>
          <li><a href="#tickets" onClick={() => navigate("/admin/tickets")}>Tickets</a></li>
          <li><a href="#audit" onClick={() => navigate("/admin/audit-logs")}>Audit Logs</a></li>
          <li><a href="#reports" onClick={() => navigate("/admin/reports")}>Reports</a></li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "charts" ? "active" : ""}`}
            onClick={() => setActiveTab("charts")}
          >
            Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === "links" ? "active" : ""}`}
            onClick={() => setActiveTab("links")}
          >
            Quick Links
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "charts" && <ChartsTab />}
            {activeTab === "links" && <LinksTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
