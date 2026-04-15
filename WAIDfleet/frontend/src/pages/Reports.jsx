import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/Reports.css";

const Reports = () => {
  const { logout } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    reportName: "",
    reportType: "daily",
    reportCategory: "financial",
    startDate: "",
    endDate: "",
    filters: {
      driverId: [],
      vehicleId: [],
      region: [],
      status: []
    }
  });

  const API_BASE = "/api/admin";
  const token = localStorage.getItem("token");

  const REPORT_TYPES = ["daily", "weekly", "monthly", "custom", "automated"];
  const REPORT_CATEGORIES = ["financial", "operational", "driver_performance", "vehicle", "compliance"];

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowCreate(false);
        setFormData({
          reportName: "",
          reportType: "daily",
          reportCategory: "financial",
          startDate: "",
          endDate: "",
          filters: { driverId: [], vehicleId: [], region: [], status: [] }
        });
        fetchReports();
        alert("Report created! Generating...");
      }
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  const handleGenerateDaily = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/daily`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchReports();
        alert("Daily report generated!");
      }
    } catch (error) {
      console.error("Error generating daily report:", error);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/monthly`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchReports();
        alert("Monthly report generated!");
      }
    } catch (error) {
      console.error("Error generating monthly report:", error);
    }
  };

  const handleViewReport = async (report) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${report._id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedReport(data.data);
      setShowDetail(true);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  const handleDownloadReport = (report) => {
    if (report.reportDetails?.fileUrl) {
      window.open(report.reportDetails.fileUrl, "_blank");
    } else {
      alert("Report file not available");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Delete this report?")) {
      try {
        const res = await fetch(`${API_BASE}/reports/${reportId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          fetchReports();
          alert("Report deleted!");
        }
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  const handleShareReport = async (reportId) => {
    const accessLevel = prompt("Access level? (private/team/public)", "team");
    if (!accessLevel) return;

    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/share`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ accessLevel })
      });

      if (res.ok) {
        fetchReports();
        alert("Report access level updated!");
      }
    } catch (error) {
      console.error("Error sharing report:", error);
    }
  };

  return (
    <div className="reports-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h1>📊 Reports</h1>
        </div>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
        <button className="logout-btn" onClick={() => logout()}>
          Logout
        </button>
      </nav>

      <div className="admin-content">
        {/* STATS */}
        {stats && (
          <div className="stats-row">
            <div className="stat-box">
              <h4>Total Reports</h4>
              <p className="stat-number">{stats.totalReports}</p>
            </div>
            <div className="stat-box">
              <h4>Generated</h4>
              <p className="stat-number">{stats.generatedCount || 0}</p>
            </div>
            <div className="stat-box">
              <h4>Sent</h4>
              <p className="stat-number">{stats.sentCount || 0}</p>
            </div>
            <div className="stat-box">
              <h4>Archived</h4>
              <p className="stat-number">{stats.archivedCount || 0}</p>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <button className="btn-primary" onClick={handleGenerateDaily}>
            📅 Generate Daily Report
          </button>
          <button className="btn-primary" onClick={handleGenerateMonthly}>
            📆 Generate Monthly Report
          </button>
          <button className="btn-secondary" onClick={() => setShowCreate(true)}>
            ➕ Create Custom Report
          </button>
        </div>

        {/* REPORTS LIST */}
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : (
          <div className="reports-grid">
            {reports.length === 0 ? (
              <p className="no-data">No reports found</p>
            ) : (
              reports.map(report => (
                <div key={report._id} className="report-card">
                  <div className="report-header">
                    <h3>{report.reportName || report.reportType}</h3>
                    <span className={`status-badge status-${report.status || "draft"}`}>
                      {report.status || "draft"}
                    </span>
                  </div>

                  <div className="report-meta">
                    <p><strong>Type:</strong> {report.reportType}</p>
                    <p><strong>Category:</strong> {report.reportCategory}</p>
                    <p><strong>Generated:</strong> {report.reportDetails?.generatedDate ? new Date(report.reportDetails.generatedDate).toLocaleDateString() : "N/A"}</p>
                    <p><strong>Format:</strong> {report.reportDetails?.format || "pdf"}</p>
                  </div>

                  {report.dataPoints && (
                    <div className="data-preview">
                      <h4>Key Metrics</h4>
                      <div className="metrics-grid">
                        {report.dataPoints.totalRevenue && (
                          <div className="metric">
                            <span className="label">Revenue</span>
                            <span className="value">₹{report.dataPoints.totalRevenue}</span>
                          </div>
                        )}
                        {report.dataPoints.totalTrips && (
                          <div className="metric">
                            <span className="label">Trips</span>
                            <span className="value">{report.dataPoints.totalTrips}</span>
                          </div>
                        )}
                        {report.dataPoints.averageRating && (
                          <div className="metric">
                            <span className="label">Avg Rating</span>
                            <span className="value">⭐ {report.dataPoints.averageRating}</span>
                          </div>
                        )}
                        {report.dataPoints.completionRate && (
                          <div className="metric">
                            <span className="label">Completion</span>
                            <span className="value">{report.dataPoints.completionRate}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="report-actions">
                    <button className="btn-small view" onClick={() => handleViewReport(report)}>
                      View
                    </button>
                    {report.reportDetails?.fileUrl && (
                      <button className="btn-small download" onClick={() => handleDownloadReport(report)}>
                        Download
                      </button>
                    )}
                    <button className="btn-small share" onClick={() => handleShareReport(report._id)}>
                      Share
                    </button>
                    <button className="btn-small delete" onClick={() => handleDeleteReport(report._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CREATE REPORT MODAL */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-content report-form" onClick={(e) => e.stopPropagation()}>
              <h2>Create Custom Report</h2>
              <form onSubmit={handleCreateReport}>
                <div className="form-group">
                  <label>Report Name *</label>
                  <input
                    type="text"
                    value={formData.reportName}
                    onChange={(e) => setFormData({...formData, reportName: e.target.value})}
                    placeholder="e.g., Q4 Financial Summary"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Report Type *</label>
                    <select
                      value={formData.reportType}
                      onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                    >
                      {REPORT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.reportCategory}
                      onChange={(e) => setFormData({...formData, reportCategory: e.target.value})}
                    >
                      {REPORT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    Generate Report
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAIL MODAL */}
        {showDetail && selectedReport && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal-content report-detail" onClick={(e) => e.stopPropagation()}>
              <div className="detail-header">
                <h2>{selectedReport.reportName || selectedReport.reportType}</h2>
                <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedReport.status}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Type:</strong> {selectedReport.reportType}
                </div>
                <div className="info-row">
                  <strong>Category:</strong> {selectedReport.reportCategory}
                </div>
                <div className="info-row">
                  <strong>Generated:</strong> {new Date(selectedReport.reportDetails?.generatedDate).toLocaleString()}
                </div>
                <div className="info-row">
                  <strong>Generated By:</strong> {selectedReport.reportDetails?.generatedBy?.name || "System"}
                </div>
                {selectedReport.schedule && (
                  <div className="info-row">
                    <strong>Frequency:</strong> {selectedReport.schedule.frequency}
                  </div>
                )}
              </div>

              {/* DATA POINTS */}
              {selectedReport.dataPoints && (
                <div className="data-section">
                  <h3>Financial Data</h3>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="label">Total Revenue</span>
                      <span className="value">₹{selectedReport.dataPoints.totalRevenue || 0}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Total Earnings</span>
                      <span className="value">₹{selectedReport.dataPoints.totalEarnings || 0}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Total Deductions</span>
                      <span className="value">₹{selectedReport.dataPoints.totalDeductions || 0}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Net Profit</span>
                      <span className="value">₹{selectedReport.dataPoints.netProfit || 0}</span>
                    </div>
                  </div>

                  <h3 style={{marginTop: "20px"}}>Operational Data</h3>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="label">Total Trips</span>
                      <span className="value">{selectedReport.dataPoints.totalTrips || 0}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Completion Rate</span>
                      <span className="value">{selectedReport.dataPoints.completionRate || 0}%</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Avg Rating</span>
                      <span className="value">⭐ {selectedReport.dataPoints.averageRating || 0}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Total Distance</span>
                      <span className="value">{selectedReport.dataPoints.totalDistance || 0} km</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TOP PERFORMERS */}
              {selectedReport.dataPoints?.topPerformers?.length > 0 && (
                <div className="performers-section">
                  <h3>Top Performers</h3>
                  <ul className="performers-list">
                    {selectedReport.dataPoints.topPerformers.map((p, idx) => (
                      <li key={idx}>
                        {p.name} - Rating: ⭐{p.rating} | Earnings: ₹{p.earnings}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ACTIONS */}
              <div className="detail-actions">
                {selectedReport.reportDetails?.fileUrl && (
                  <button className="btn-primary" onClick={() => handleDownloadReport(selectedReport)}>
                    📥 Download Report
                  </button>
                )}
                <button className="btn-secondary" onClick={() => handleShareReport(selectedReport._id)}>
                  📤 Share Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
