// Generate unique IDs for various entities
const generateUniqueId = (prefix = 'ID') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Calculate pagination
const calculatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  });
  return formatter.format(amount);
};

// Calculate date difference
const daysDifference = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Hash password (placeholder - use bcrypt in actual implementation)
const hashPassword = async (password) => {
  // In real implementation, use bcrypt
  return password;
};

// Verify password
const verifyPassword = async (password, hash) => {
  // In real implementation, use bcrypt
  return password === hash;
};

// Remove sensitive fields from object
const removeSensitiveFields = (obj, fields = ['password', 'refreshToken', 'bankDetails']) => {
  const copy = { ...obj.toObject ? obj.toObject() : obj };
  fields.forEach(field => delete copy[field]);
  return copy;
};

// Validate required fields
const validateRequiredFields = (obj, fields) => {
  const missing = fields.filter(field => !obj[field]);
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
};

// Parse query parameters
const parseQueryParams = (query) => {
  const { page = 1, limit = 10, sort = '-createdAt', search = '', status = '' } = query;
  return { page, limit, sort, search, status };
};

// Build MongoDB filter object
const buildFilter = (query) => {
  const filter = {};
  
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phoneNumber: { $regex: query.search, $options: 'i' } }
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  return filter;
};

// Send successful response
const sendSuccess = (res, status, data, message = 'Success') => {
  res.status(status).json({
    success: true,
    message,
    data
  });
};

// Send error response
const sendError = (res, status, message = 'Error') => {
  res.status(status).json({
    success: false,
    message
  });
};

// Paginated response
const sendPaginatedResponse = (res, status, data, total, page, limit, message = 'Success') => {
  res.status(status).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    count: data.length
  });
};

module.exports = {
  generateUniqueId,
  isValidEmail,
  isValidPhone,
  calculatePagination,
  formatCurrency,
  daysDifference,
  hashPassword,
  verifyPassword,
  removeSensitiveFields,
  validateRequiredFields,
  parseQueryParams,
  buildFilter,
  sendSuccess,
  sendError,
  sendPaginatedResponse
};
