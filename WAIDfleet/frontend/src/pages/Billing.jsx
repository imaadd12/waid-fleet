import React, { useState, useEffect } from "react";
import "../styles/Billing.css";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const Billing = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bills, setBills] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [overdueBills, setOverdueBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "all", page: 1, limit: 20 });
  const [formData, setFormData] = useState({
    amount: "",
    method: "online",
    referenceNumber: "",
    notes: ""
  });

  const API_BASE = "/api/billing";

  // Fetch all bills
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const statusParam = filters.status !== "all" ? `?status=${filters.status}` : "";
        const response = await fetch(`${API_BASE}/all${statusParam}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        setBills(data.data || []);
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
      setLoading(false);
    };

    if (activeTab === "paymentTracking" || activeTab === "overdue") {
      fetchBills();
    }
  }, [activeTab, filters]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/analytics`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        setAnalytics(data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
      setLoading(false);
    };

    if (activeTab === "dashboard" || activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Fetch trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch(`${API_BASE}/trends`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        setTrends(data.data || []);
      } catch (error) {
        console.error("Error fetching trends:", error);
      }
    };

    if (activeTab === "analytics") {
      fetchTrends();
    }
  }, [activeTab]);

  // Fetch overdue bills
  useEffect(() => {
    const fetchOverdueBills = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/overdue`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        setOverdueBills(data.data || []);
      } catch (error) {
        console.error("Error fetching overdue bills:", error);
      }
      setLoading(false);
    };

    if (activeTab === "overdue") {
      fetchOverdueBills();
    }
  }, [activeTab]);

  const generateBills = async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/generate/${type}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      alert(`✅ ${data.billsGenerated} ${type} bills generated successfully!`);
      setActiveTab("paymentTracking");
    } catch (error) {
      alert("❌ Error generating bills: " + error.message);
    }
    setLoading(false);
  };

  const recordPayment = async (billId) => {
    if (!formData.amount || !formData.method || !formData.referenceNumber) {
      alert("Please fill all payment details");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${billId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ Payment recorded successfully!");
        setFormData({ amount: "", method: "online", referenceNumber: "", notes: "" });
        // Refresh bills
        const billsResponse = await fetch(`${API_BASE}/all`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const billsData = await billsResponse.json();
        setBills(billsData.data || []);
      }
    } catch (error) {
      alert("❌ Error recording payment: " + error.message);
    }
  };

  const sendReminders = async () => {
    try {
      const response = await fetch(`${API_BASE}/send-reminders`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      alert(`✅ ${data.remindersSent} payment reminders sent!`);
    } catch (error) {
      alert("❌ Error sending reminders: " + error.message);
    }
  };

  // ==================== DASHBOARD TAB ====================
  const DashboardTab = () => (
    <div className="billing-dashboard">
      <h2>Billing Dashboard</h2>
      {analytics ? (
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">Total Billed</div>
            <div className="stat-value">₹{analytics.summary?.totalBilled?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value">₹{analytics.summary?.totalCollected?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding Amount</div>
            <div className="stat-value">₹{analytics.summary?.outstandingAmount?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Collection Rate</div>
            <div className="stat-value">{analytics.summary?.collectionRate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">₹{analytics.summary?.totalEarnings?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Deductions</div>
            <div className="stat-value">₹{analytics.summary?.totalDeductions?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Bonuses</div>
            <div className="stat-value">₹{analytics.summary?.totalBonuses?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Paid Bills</div>
            <div className="stat-value">{analytics.counts?.paidBills}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Bills</div>
            <div className="stat-value">{analytics.counts?.pendingBills}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue Bills</div>
            <div className="stat-value">{analytics.counts?.overdueBills}</div>
          </div>
        </div>
      ) : (
        <div className="loading">Loading analytics...</div>
      )}
    </div>
  );

  // ==================== GENERATE BILLS TAB ====================
  const GenerateBillsTab = () => (
    <div className="generate-bills-section">
      <h2>Generate Bills</h2>
      <div className="generate-buttons">
        <button
          className="btn btn-primary"
          onClick={() => generateBills("weekly")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Weekly Bills"}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => generateBills("monthly")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Monthly Bills"}
        </button>
      </div>
      <div className="schedule-info">
        <h3>📅 Automated Schedule</h3>
        <ul>
          <li>✅ Weekly Bills: Every Monday at 00:00 AM</li>
          <li>✅ Monthly Bills: Every 1st of month at 00:00 AM</li>
          <li>✅ Payment Reminders: Daily at 09:00 AM</li>
          <li>✅ Overdue Detection: Daily at 08:00 AM</li>
        </ul>
      </div>
    </div>
  );

  // ==================== PAYMENT TRACKING TAB ====================
  const PaymentTrackingTab = () => (
    <div className="payment-tracking-section">
      <h2>Payment Tracking</h2>
      <div className="filter-controls">
        <label>Filter by Status:</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="all">All Bills</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading bills...</div>
      ) : (
        <table className="bills-table">
          <thead>
            <tr>
              <th>Bill Number</th>
              <th>Driver</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill._id}>
                <td>{bill.billNumber}</td>
                <td>{bill.driverId?.name || "N/A"}</td>
                <td>{new Date(bill.periodStartDate).toDateString()}</td>
                <td>₹{bill.finalAmount?.toFixed(2)}</td>
                <td>₹{bill.totalPaid?.toFixed(2)}</td>
                <td>₹{bill.totalPending?.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${bill.paymentStatus}`}>
                    {bill.paymentStatus}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setSelectedBill(bill)}
                  >
                    Record Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedBill && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Record Payment for {selectedBill.billNumber}</h3>
            <div className="form-group">
              <label>Payment Amount</label>
              <input
                type="number"
                placeholder={`Max: ₹${selectedBill.totalPending}`}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="online">Online Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reference Number</label>
              <input
                type="text"
                placeholder="Transaction ID / Check No"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                placeholder="Additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-success"
                onClick={() => recordPayment(selectedBill._id)}
              >
                Record Payment
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => setSelectedBill(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== OVERDUE TAB ====================
  const OverdueTab = () => (
    <div className="overdue-section">
      <h2>Overdue Bills & Collection</h2>
      <button className="btn btn-warning" onClick={sendReminders}>
        Send Payment Reminders ({overdueBills.length})
      </button>

      {overdueBills.length === 0 ? (
        <div className="no-data">✅ No overdue bills</div>
      ) : (
        <table className="bills-table">
          <thead>
            <tr>
              <th>Bill Number</th>
              <th>Driver</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
              <th>Amount Due</th>
              <th>Late Fee</th>
              <th>Total Due</th>
            </tr>
          </thead>
          <tbody>
            {overdueBills.map((bill) => (
              <tr key={bill._id} className="overdue-row">
                <td>{bill.billNumber}</td>
                <td>{bill.driverId?.name}</td>
                <td>{new Date(bill.paymentTerms.dueDate).toDateString()}</td>
                <td className="overdue-days">{bill.daysSinceOverdue}</td>
                <td>₹{bill.totalPending?.toFixed(2)}</td>
                <td className="late-fee">₹{bill.lateFee?.toFixed(2)}</td>
                <td className="total-due">₹{(bill.totalPending + bill.lateFee)?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ==================== ANALYTICS TAB ====================
  const AnalyticsTab = () => (
    <div className="analytics-section">
      <h2>Billing Analytics</h2>

      {trends.length > 0 && (
        <div className="chart-container">
          <h3>Revenue Trends (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Line type="monotone" dataKey="earnings" stroke="#4CAF50" name="Earnings" />
              <Line type="monotone" dataKey="collected" stroke="#2196F3" name="Collected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Deduction Breakdown</h4>
            <p className="metric">
              {analytics.metrics?.averageDeductionPercent}% of earnings
            </p>
          </div>
          <div className="analytics-card">
            <h4>Bonus Distribution</h4>
            <p className="metric">
              {analytics.metrics?.averageBonusPercent}% of earnings
            </p>
          </div>
          <div className="analytics-card">
            <h4>Average Bill Value</h4>
            <p className="metric">
              ₹{analytics.metrics?.averageEarningsPerBill}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="billing-container">
      <div className="billing-header">
        <h1>💰 Billing Management</h1>
      </div>

      <div className="billing-tabs">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "generateBills" ? "active" : ""}`}
          onClick={() => setActiveTab("generateBills")}
        >
          Generate Bills
        </button>
        <button
          className={`tab-btn ${activeTab === "paymentTracking" ? "active" : ""}`}
          onClick={() => setActiveTab("paymentTracking")}
        >
          Payments
        </button>
        <button
          className={`tab-btn ${activeTab === "overdue" ? "active" : ""}`}
          onClick={() => setActiveTab("overdue")}
        >
          Overdue
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      <div className="billing-content">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "generateBills" && <GenerateBillsTab />}
        {activeTab === "paymentTracking" && <PaymentTrackingTab />}
        {activeTab === "overdue" && <OverdueTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default Billing;
