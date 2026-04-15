import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/AuditLogs.css";

const AuditLogs = () => {
  const { logout } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [filters, setFilters] = useState({
    actionType: "",
    entityType: "",
    severity: "",
    dateFrom: "",
    dateTo: ""
  });

  const API_BASE = "/api/admin";
  const token = localStorage.getItem("token");

  const ACTION_TYPES = [
    "create", "read", "update", "delete", "login", "logout",
    "approve", "reject", "export", "import", "download", "upload", "suspend", "activate"
  ];

  const ENTITY_TYPES = [
    "Driver", "Vehicle", "Bill", "Payment", "Ticket", "AdminUser", "Settings", "Notification", "Report"
  ];

  const SEVERITY_LEVELS = ["info", "warning", "critical"];

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.actionType) params.append("actionType", filters.actionType);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      let url = `${API_BASE}/audit-logs`;
      if (params.toString()) url += "?" + params.toString();

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs/stats/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const handleExportLogs = async () => {
    try {
      const format = prompt("Export format? (csv or json)", "csv");
      if (!format) return;

      const params = new URLSearchParams();
      params.append("format", format);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const res = await fetch(`${API_BASE}/audit-logs/export?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("Logs exported successfully!");
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  return (
    <div className="audit-logs-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h1>📋 Audit Logs</h1>
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
              <h4>Total Actions</h4>
              <p className="stat-number">{stats.totalActions}</p>
            </div>
            <div className="stat-box">
              <h4>Critical Actions</h4>
              <p className="stat-number critical">{stats.criticalCount || 0}</p>
            </div>
            <div className="stat-box">
              <h4>Failures</h4>
              <p className="stat-number">{stats.failureCount || 0}</p>
            </div>
            <div className="stat-box">
              <h4>Top Action Type</h4>
              <p className="stat-number">{stats.topActionType || "N/A"}</p>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="filters-section">
          <div className="filter-row">
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({...filters, actionType: e.target.value})}
              className="filter-select"
            >
              <option value="">All Action Types</option>
              {ACTION_TYPES.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <select
              value={filters.entityType}
              onChange={(e) => setFilters({...filters, entityType: e.target.value})}
              className="filter-select"
            >
              <option value="">All Entity Types</option>
              {ENTITY_TYPES.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters({...filters, severity: e.target.value})}
              className="filter-select"
            >
              <option value="">All Severity Levels</option>
              {SEVERITY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="filter-input"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="filter-input"
            />
            <button className="btn-primary" onClick={handleExportLogs}>
              📥 Export Logs
            </button>
          </div>
        </div>

        {/* LOGS TABLE */}
        {loading ? (
          <div className="loading">Loading audit logs...</div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Performed By</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No audit logs found</td></tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={idx}>
                      <td className="timestamp">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="action-type">{log.actionType}</td>
                      <td className="entity-type">{log.entityType}</td>
                      <td className="performed-by">
                        {log.performedByName}
                        <span className="role">({log.performedByRole})</span>
                      </td>
                      <td>
                        <span className={`severity-badge severity-${log.severity}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="ip-address">{log.ipAddress}</td>
                      <td>
                        <button
                          className="btn-small view"
                          onClick={() => handleViewLog(log)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* DETAIL MODAL */}
        {showDetail && selectedLog && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal-content log-detail" onClick={(e) => e.stopPropagation()}>
              <div className="detail-header">
                <h2>Audit Log Details</h2>
                <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <strong>Action:</strong> <span>{selectedLog.actionType}</span>
                </div>
                <div className="info-row">
                  <strong>Entity:</strong> <span>{selectedLog.entityType}</span>
                </div>
                <div className="info-row">
                  <strong>Entity ID:</strong> <span>{selectedLog.entityId}</span>
                </div>
                <div className="info-row">
                  <strong>Performed By:</strong> <span>{selectedLog.performedByName} ({selectedLog.performedByRole})</span>
                </div>
                <div className="info-row">
                  <strong>Timestamp:</strong> <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>IP Address:</strong> <span>{selectedLog.ipAddress}</span>
                </div>
                <div className="info-row">
                  <strong>User Agent:</strong> <span className="truncate">{selectedLog.userAgent}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedLog.status}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Severity:</strong>
                  <span className={`severity-badge severity-${selectedLog.severity}`}>
                    {selectedLog.severity}
                  </span>
                </div>

                {selectedLog.description && (
                  <div className="info-row">
                    <strong>Description:</strong>
                    <span>{selectedLog.description}</span>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div className="info-row error">
                    <strong>Error:</strong>
                    <span>{selectedLog.errorMessage}</span>
                  </div>
                )}
              </div>

              {/* CHANGES */}
              {selectedLog.changes && (
                <div className="changes-section">
                  <h3>Changes Made</h3>
                  <div className="changes-display">
                    <div className="changes-column">
                      <h4>Before</h4>
                      <pre>{JSON.stringify(selectedLog.changes.before, null, 2)}</pre>
                    </div>
                    <div className="changes-column">
                      <h4>After</h4>
                      <pre>{JSON.stringify(selectedLog.changes.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* AFFECTED USERS */}
              {selectedLog.affectedUsers?.length > 0 && (
                <div className="affected-users-section">
                  <h3>Affected Users</h3>
                  <ul>
                    {selectedLog.affectedUsers.map((user, idx) => (
                      <li key={idx}>{user}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TAGS */}
              {selectedLog.tags?.length > 0 && (
                <div className="tags-section">
                  <h3>Tags</h3>
                  <div className="tags-display">
                    {selectedLog.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
