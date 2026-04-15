const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const http = require("http");
const path = require("path");
const { initSocket } = require("./sockets/socket");

const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const connectDB = require("./config/db");
const initAdmin = require("./utils/initAdmin");
const { generalLimiter, authLimiter, paymentLimiter, adminLimiter } = require("./middleware/rateLimitMiddleware");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// ✅ Connect DB then seed default admin if absent
connectDB().then(initAdmin);

const app = express();
const server = http.createServer(app);

// ============ MIDDLEWARE ============
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ============ RATE LIMIT ============
app.use("/api/auth", authLimiter);
app.use("/api/payments", paymentLimiter);
app.use("/api/admin", adminLimiter);
app.use(generalLimiter);

// ============ 🔥 SWAGGER FIX ============
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Waid Fleet API",
      version: "1.0.0",
      description: "API documentation for Waid Fleet",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: [path.join(__dirname, "routes/*.js")], // ✅ FIXED PATH
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============ SAFE ROUTE LOADER ============
const loadRoute = (routePath, routeUrl) => {
  try {
    const route = require(routePath);
    app.use(routeUrl, route);
    console.log(`✅ Loaded: ${routeUrl}`);
  } catch (err) {
    console.error(`❌ Failed to load ${routeUrl}:`, err.message);
  }
};

// ============ ROUTES ============
loadRoute("./routes/driverRoutes", "/api/drivers");
loadRoute("./routes/authRoutes", "/api/auth");
loadRoute("./routes/vehicleRoutes", "/api/vehicles");
loadRoute("./routes/earningsRoutes", "/api/earnings");
loadRoute("./routes/paymentRoutes", "/api/payments");
loadRoute("./routes/billingRoutes", "/api/billing");
loadRoute("./routes/analyticsRoutes", "/api/analytics");
loadRoute("./routes/shiftRoutes", "/api/shifts");
loadRoute("./routes/incidentRoutes", "/api/incidents");
loadRoute("./routes/performanceRoutes", "/api/performance");
loadRoute("./routes/notificationRoutes", "/api/notifications");
loadRoute("./routes/adminRoutes", "/api/admin");

loadRoute("./routes/locationRoutes", "/api/location");
loadRoute("./routes/walletRoutes", "/api/wallet");
loadRoute("./routes/documentRoutes", "/api/documents");
loadRoute("./routes/passengerRoutes", "/api/passengers");
loadRoute("./routes/operationsRoutes", "/api/operations");
loadRoute("./routes/tripRoutes", "/api/trips");
loadRoute("./routes/serviceRoutes", "/api/services");

loadRoute("./routes/gamificationRoutes", "/api/surge");
loadRoute("./routes/gamificationRoutes", "/api/referral");
loadRoute("./routes/gamificationRoutes", "/api/gamification");

// ============ TEST ============
app.get("/test", (req, res) => {
  res.send("Backend is working!");
});

// ============ HEALTH ============
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

// ============ ERROR HANDLERS ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ SOCKET ============
initSocket(server);

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Swagger: http://localhost:${PORT}/api-docs`);
});

module.exports = app;