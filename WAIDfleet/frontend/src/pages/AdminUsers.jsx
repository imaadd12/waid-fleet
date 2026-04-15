import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/AdminUsers.css";

const AdminUsers = () => {
  const { logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "support",
    permissions: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const API_BASE = "/api/admin";
  const token = localStorage.getItem("token");

  const ROLES = [
    { value: "super_admin", label: "Super Admin" },
    { value: "finance", label: "Finance" },
    { value: "operations", label: "Operations" },
    { value: "support", label: "Support" },
    { value: "manager", label: "Manager" },
  ];

  const PERMISSIONS = [
    "view_dashboard",
    "manage_users",
    "manage_tickets",
    "view_audit_logs",
    "generate_reports",
    "manage_finance",
    "manage_drivers",
    "manage_settings",
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "support",
      permissions: [],
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser
        ? `${API_BASE}/users/${editingUser._id}`
        : `${API_BASE}/users`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        alert(editingUser ? "User updated!" : "User created!");
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchUsers();
        alert(currentStatus ? "User suspended!" : "User activated!");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          fetchUsers();
          alert("User deleted!");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-users-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h1>👥 Admin Users</h1>
        </div>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
        <button className="logout-btn" onClick={() => logout()}>
          Logout
        </button>
      </nav>

      <div className="admin-content">
        <div className="controls-section">
          <button className="btn-primary" onClick={handleAddUser}>
            + Add New Admin
          </button>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td><span className="role-badge">{user.role}</span></td>
                    <td>
                      <span className={`status-badge ${user.isActive ? "active" : "inactive"}`}>
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td>
                      <div className="permissions-list">
                        {user.permissions?.slice(0, 2).map((perm, idx) => (
                          <span key={idx} className="permission-tag">{perm}</span>
                        ))}
                        {user.permissions?.length > 2 && (
                          <span className="permission-tag">+{user.permissions.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</td>
                    <td>
                      <button className="btn-small edit" onClick={() => handleEditUser(user)}>
                        Edit
                      </button>
                      <button
                        className={`btn-small ${user.isActive ? "suspend" : "activate"}`}
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? "Suspend" : "Activate"}
                      </button>
                      <button className="btn-small delete" onClick={() => handleDeleteUser(user._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingUser ? "Edit Admin User" : "Create New Admin User"}</h2>
              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-checkboxes">
                    {PERMISSIONS.map(perm => (
                      <label key={perm} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, perm]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== perm)
                              });
                            }
                          }}
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
