const rateLimit = require("express-rate-limit");

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
        skip: (req) => process.env.NODE_ENV === "development",
});

// Strict rate limiter for authentication - 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => process.env.NODE_ENV === "development",
});

// Payment limiter - 20 requests per hour
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many payment attempts, please try again later.",
});

// Ride request limiter - 50 requests per hour
const rideLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: "Too many ride requests, please try again later.",
});

// Admin operations limiter - 200 requests per hour
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: "Admin rate limit exceeded, please try again later.",
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  rideLimiter,
  adminLimiter,
};
