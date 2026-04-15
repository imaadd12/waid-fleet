const AdminUser = require("../models/adminUserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Create new admin user
 * @route   POST /api/admin/users
 * @access  Private/Super Admin
 */
exports.createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, permissions, phone, designation } = req.body;

  // Check if admin already exists
  let adminUser = await AdminUser.findOne({ email });
  if (adminUser) {
    return res.status(400).json({ success: false, message: "Admin already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  adminUser = await AdminUser.create({
    name,
    email,
    password: hashedPassword,
    role,
    permissions,
    phone,
    designation,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: "Admin user created successfully",
    data: adminUser
  });
});

/**
 * @desc    Get all admin users
 * @route   GET /api/admin/users
 * @access  Private/Super Admin
 */
exports.getAllAdminUsers = asyncHandler(async (req, res) => {
  const { role, isActive, sortBy = "createdAt", page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const total = await AdminUser.countDocuments(filter);
  const users = await AdminUser.find(filter)
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select("-password");

  res.json({
    success: true,
    data: users,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get admin user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Super Admin
 */
exports.getAdminUserById = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id)
    .select("-password")
    .populate("reportingTo", "name email role");

  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  res.json({ success: true, data: user });
});

/**
 * @desc    Update admin user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Super Admin
 */
exports.updateAdminUser = asyncHandler(async (req, res) => {
  const { name, email, role, permissions, phone, designation, reportingTo, isActive } = req.body;

  let user = await AdminUser.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  // Check email uniqueness if changing
  if (email && email !== user.email) {
    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
  }

  // Update fields
  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  user.permissions = permissions || user.permissions;
  user.phone = phone || user.phone;
  user.designation = designation || user.designation;
  user.reportingTo = reportingTo || user.reportingTo;
  if (isActive !== undefined) user.isActive = isActive;

  user.updatedBy = req.user.id;

  await user.save();

  res.json({
    success: true,
    message: "Admin user updated successfully",
    data: user
  });
});

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/users/:id/password
 * @access  Private
 */
exports.changeAdminPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await AdminUser.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  // Check old password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ success: false, message: "Old password is incorrect" });
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);
  user.updatedBy = req.user.id;

  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully"
  });
});

/**
 * @desc    Suspend/Activate admin user
 * @route   PUT /api/admin/users/:id/toggle-status
 * @access  Private/Super Admin
 */
exports.toggleAdminStatus = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  user.isActive = !user.isActive;
  user.updatedBy = req.user.id;

  await user.save();

  res.json({
    success: true,
    message: `Admin user ${user.isActive ? "activated" : "suspended"}`,
    data: user
  });
});

/**
 * @desc    Reset admin login attempts
 * @route   PUT /api/admin/users/:id/reset-attempts
 * @access  Private/Super Admin
 */
exports.resetLoginAttempts = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  user.loginAttempts = 0;
  user.isLocked = false;
  user.lockedUntil = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Login attempts reset",
    data: user
  });
});

/**
 * @desc    Delete admin user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Super Admin
 */
exports.deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  // Prevent deleting super admin if only one exists
  const superAdminCount = await AdminUser.countDocuments({ role: "super_admin" });
  if (user.role === "super_admin" && superAdminCount === 1) {
    return res.status(400).json({ success: false, message: "Cannot delete the only super admin" });
  }

  await AdminUser.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Admin user deleted successfully"
  });
});

/**
 * @desc    Get admin activity log
 * @route   GET /api/admin/users/:id/activity
 * @access  Private/Super Admin
 */
exports.getAdminActivityLog = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "Admin user not found" });
  }

  const recentActivity = user.activityLog.slice(-50);

  res.json({
    success: true,
    data: {
      userId: user._id,
      userName: user.name,
      totalLogins: user.activityLog.filter(a => a.action === "login").length,
      lastLogin: user.lastLogin,
      recentActivity: recentActivity
    }
  });
});

// ────────────────────────────────────────────────
//  SUB-ADMIN MANAGEMENT
// ────────────────────────────────────────────────

/**
 * @desc  Create a sub-admin with specific permissions
 * @route POST /api/admin/subadmins
 * @access Super Admin only
 */
exports.createSubAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, designation, permissions, accessExpiresAt } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const subAdmin = await AdminUser.create({
    name,
    email,
    password: hashedPassword,
    phone,
    designation: designation || "Sub Admin",
    role: "sub_admin",
    isSubAdmin: true,
    isTemporary: req.body.isTemporary || false,
    accessStartsAt: req.body.accessStartsAt || null,
    accessExpiresAt: accessExpiresAt || null,
    permissions: permissions || ["dashboard", "view_drivers", "view_vehicles"],
    createdBy: req.user.id,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: `Sub-admin "${name}" created successfully`,
    data: subAdmin
  });
});

/**
 * @desc  Get all sub-admins created by this admin
 * @route GET /api/admin/subadmins
 * @access Super Admin only
 */
exports.getSubAdmins = asyncHandler(async (req, res) => {
  const subAdmins = await AdminUser.find({ isSubAdmin: true })
    .select("-password")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: subAdmins });
});

/**
 * @desc  Update sub-admin permissions
 * @route PUT /api/admin/subadmins/:id/permissions
 * @access Super Admin only
 */
exports.updateSubAdminPermissions = asyncHandler(async (req, res) => {
  const { permissions, isActive, accessExpiresAt } = req.body;

  const subAdmin = await AdminUser.findById(req.params.id);
  if (!subAdmin || !subAdmin.isSubAdmin) {
    return res.status(404).json({ success: false, message: "Sub-admin not found" });
  }

  if (permissions !== undefined) subAdmin.permissions = permissions;
  if (isActive !== undefined) subAdmin.isActive = isActive;
  if (req.body.isTemporary !== undefined) subAdmin.isTemporary = req.body.isTemporary;
  if (req.body.accessStartsAt !== undefined) subAdmin.accessStartsAt = req.body.accessStartsAt;
  if (accessExpiresAt !== undefined) subAdmin.accessExpiresAt = accessExpiresAt;
  subAdmin.updatedBy = req.user.id;

  await subAdmin.save();

  res.json({
    success: true,
    message: "Sub-admin permissions updated",
    data: subAdmin
  });
});

/**
 * @desc  Delete / revoke a sub-admin
 * @route DELETE /api/admin/subadmins/:id
 * @access Super Admin only
 */
exports.deleteSubAdmin = asyncHandler(async (req, res) => {
  const subAdmin = await AdminUser.findById(req.params.id);
  if (!subAdmin || !subAdmin.isSubAdmin) {
    return res.status(404).json({ success: false, message: "Sub-admin not found" });
  }

  await AdminUser.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: `Sub-admin "${subAdmin.name}" has been removed` });
});

