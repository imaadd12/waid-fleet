const logger = require("../config/logger");

/**
 * Centralized error handling middleware
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId;

  // Log error
  logger.error(`[${requestId}] ${err.message}`, {
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Validation error",
      errors: err.details,
      requestId,
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      status: 409,
      message: `${field} already exists`,
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Invalid token",
      requestId,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Token expired",
      requestId,
    });
  }

  // Handle custom API error
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.statusCode,
      message: err.message,
      details: err.details,
      requestId,
    });
  }

  // Handle generic errors
  res.status(err.statusCode || 500).json({
    success: false,
    status: err.statusCode || 500,
    message: err.message || "Internal Server Error",
    requestId,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: "Route not found",
    path: req.path,
  });
};

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
};
