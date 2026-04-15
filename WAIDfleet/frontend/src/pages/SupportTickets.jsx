import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/SupportTickets.css";

const SupportTickets = () => {
  const { logout } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [messageText, setMessageText] = useState("");
  const [stats, setStats] = useState(null);

  const API_BASE = "/api/admin";
  const token = localStorage.getItem("token");

  const STATUS_OPTIONS = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting", label: "Waiting" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const PRIORITY_OPTIONS = [
    { value: "low", label: "Low", color: "#4CAF50" },
    { value: "medium", label: "Medium", color: "#FFC107" },
    { value: "high", label: "High", color: "#FF9800" },
    { value: "critical", label: "Critical", color: "#F44336" },
  ];

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/tickets`;
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      if (params.toString()) url += "?" + params.toString();

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets/stats/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticket._id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedTicket(data.data);
      setShowDetail(true);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    }
  };

  const handleAddMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedTicket._id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      });

      if (res.ok) {
        setMessageText("");
        fetchTickets();
        handleViewTicket(selectedTicket);
        alert("Message added!");
      }
    } catch (error) {
      console.error("Error adding message:", error);
    }
  };

  const handleResolveTicket = async () => {
    const resolution = prompt("Enter resolution description:");
    if (!resolution) return;

    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedTicket._id}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ resolution })
      });

      if (res.ok) {
        setShowDetail(false);
        fetchTickets();
        alert("Ticket resolved!");
      }
    } catch (error) {
      console.error("Error resolving ticket:", error);
    }
  };

  const handleCloseTicket = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedTicket._id}/close`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setShowDetail(false);
        fetchTickets();
        alert("Ticket closed!");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleRating = async (rating, feedback) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedTicket._id}/satisfaction`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, feedback })
      });

      if (res.ok) {
        alert("Rating submitted!");
        fetchTickets();
        handleViewTicket(selectedTicket);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <div className="support-tickets-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h1>🎫 Support Tickets</h1>
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
              <h4>Total Tickets</h4>
              <p className="stat-number">{stats.totalTickets}</p>
            </div>
            <div className="stat-box">
              <h4>Avg Response Time</h4>
              <p className="stat-number">{stats.avgResponseTime || "N/A"}</p>
            </div>
            <div className="stat-box">
              <h4>SLA Compliance</h4>
              <p className="stat-number">{stats.slaCompliance}%</p>
            </div>
            <div className="stat-box">
              <h4>Customer Satisfaction</h4>
              <p className="stat-number">⭐ {stats.avgSatisfaction || "N/A"}</p>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="filters-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* TICKETS LIST */}
        {loading ? (
          <div className="loading">Loading tickets...</div>
        ) : (
          <div className="tickets-list">
            {tickets.length === 0 ? (
              <p className="no-data">No tickets found</p>
            ) : (
              tickets.map(ticket => (
                <div key={ticket._id} className="ticket-card" onClick={() => handleViewTicket(ticket)}>
                  <div className="ticket-header">
                    <h3>{ticket.ticketNumber}</h3>
                    <span className={`priority-badge priority-${ticket.priority}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="ticket-subject">{ticket.subject}</p>
                  <div className="ticket-meta">
                    <span className={`status-badge status-${ticket.status}`}>
                      {ticket.status}
                    </span>
                    <span className="category-badge">{ticket.category}</span>
                    <span className="date">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {ticket.assignedTo && (
                    <p className="assigned-to">Assigned to: {ticket.assignedTo.name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* DETAIL MODAL */}
        {showDetail && selectedTicket && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal-content ticket-detail" onClick={(e) => e.stopPropagation()}>
              <div className="detail-header">
                <h2>{selectedTicket.ticketNumber}</h2>
                <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
              </div>

              <div className="detail-section">
                <h3>{selectedTicket.subject}</h3>
                <p>{selectedTicket.description}</p>
              </div>

              <div className="detail-metadata">
                <div className="meta-item">
                  <strong>Status:</strong> <span className={`status-badge status-${selectedTicket.status}`}>{selectedTicket.status}</span>
                </div>
                <div className="meta-item">
                  <strong>Priority:</strong> <span className={`priority-badge priority-${selectedTicket.priority}`}>{selectedTicket.priority}</span>
                </div>
                <div className="meta-item">
                  <strong>Category:</strong> {selectedTicket.category}
                </div>
                <div className="meta-item">
                  <strong>Reporter:</strong> {selectedTicket.reportedBy === "driver" ? "Driver" : "Admin"}
                </div>
                {selectedTicket.slaBreached !== undefined && (
                  <div className="meta-item">
                    <strong>SLA Status:</strong> 
                    <span className={selectedTicket.slaBreached ? "sla-breached" : "sla-ok"}>
                      {selectedTicket.slaBreached ? "BREACHED ⚠️" : "ON TRACK ✓"}
                    </span>
                  </div>
                )}
              </div>

              {/* MESSAGES */}
              <div className="messages-section">
                <h4>Messages ({selectedTicket.messages?.length || 0})</h4>
                <div className="messages-list">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.authorType || "admin"}`}>
                      <p className="message-author">
                        <strong>{msg.authorId?.name || "Unknown"}</strong>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </p>
                      <p className="message-text">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* ADD MESSAGE */}
                {selectedTicket.status !== "closed" && (
                  <div className="add-message">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Add a message..."
                      rows="3"
                    />
                    <button className="btn-primary" onClick={handleAddMessage}>
                      Send Message
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="detail-actions">
                {selectedTicket.status === "open" && (
                  <button className="btn-info" onClick={() => {
                    const res = fetch(`${API_BASE}/tickets/${selectedTicket._id}/assign`, {
                      method: "PUT",
                      headers: { "Authorization": `Bearer ${token}` }
                    });
                    alert("Ticket assigned to you!");
                    setShowDetail(false);
                    fetchTickets();
                  }}>
                    Assign to Me
                  </button>
                )}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <button className="btn-success" onClick={handleResolveTicket}>
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status === "resolved" && (
                  <button className="btn-secondary" onClick={handleCloseTicket}>
                    Close Ticket
                  </button>
                )}
              </div>

              {/* SATISFACTION RATING */}
              {selectedTicket.status === "closed" && !selectedTicket.customerSatisfaction?.rating && (
                <div className="satisfaction-section">
                  <h4>Customer Satisfaction</h4>
                  <div className="rating-input">
                    <select className="rating-select" id="ratingSelect">
                      <option value="1">1 - Very Dissatisfied</option>
                      <option value="2">2 - Dissatisfied</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Satisfied</option>
                      <option value="5">5 - Very Satisfied</option>
                    </select>
                    <textarea placeholder="Optional feedback..." id="feedbackText" rows="2" />
                    <button className="btn-primary" onClick={() => {
                      const rating = document.getElementById("ratingSelect").value;
                      const feedback = document.getElementById("feedbackText").value;
                      handleRating(rating, feedback);
                    }}>
                      Submit Rating
                    </button>
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

export default SupportTickets;
