const Joi = require("joi");

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object
 * @param {string} property - Which property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Validation failed",
        errors,
      });
    }

    req[property] = value;
    next();
  };
};

// Reusable validation schemas
const schemas = {
  // Driver schemas
  driverRegister: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
    licenseNumber: Joi.string().min(8).max(20).required(),
    vehicleId: Joi.string().required(),
  }),

  driverLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  // Ride schemas
  rideRequest: Joi.object({
    pickupLocation: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      address: Joi.string().required(),
    }).required(),
    dropoffLocation: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      address: Joi.string().required(),
    }).required(),
    rideType: Joi.string().valid("economy", "premium", "shared").required(),
    passengers: Joi.number().min(1).max(6).required(),
  }),

  // Payment schemas
  paymentRequest: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).required(),
    paymentMethod: Joi.string().valid("card", "wallet", "upi").required(),
    description: Joi.string(),
  }),

  // Card schemas
  cardDetails: Joi.object({
    cardNumber: Joi.string().creditCard().required(),
    cardholderName: Joi.string().required(),
    expiryMonth: Joi.number().min(1).max(12).required(),
    expiryYear: Joi.number().min(2026).required(),
    cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
  }),

  // Address schemas
  address: Joi.object({
    label: Joi.string().valid("home", "work", "other").required(),
    address: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }),

  // Rating schemas
  submitRating: Joi.object({
    rideId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    category: Joi.string().valid("cleanliness", "driving", "professionalism", "overall").required(),
    comment: Joi.string().max(500),
  }),

  // Filters
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { validate, schemas };
