const express = require("express");
const router = express.Router();
const {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  verifyDriver,
  upload,
  getDriverPerformance,
  getActiveDrivers,
  searchDrivers,
  getMyPerformance,
  bulkRegisterDrivers,
  verifyDocuments,
  sendSafetyAlert
} = require("../controllers/driverController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Driver management APIs
 */

/**
 * @swagger
 * /api/drivers/register:
 *   post:
 *     summary: Register a new driver
 *     tags: [Drivers]
 *     description: Admin can register a new driver with documents
 *     responses:
 *       201:
 *         description: Driver registered successfully
 */
router.post(
  "/register",
  protect,
  adminOnly,
  upload.fields([
    { name: "aadharCard", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  registerDriver
);

/**
 * @swagger
 * /api/drivers/bulk-register:
 *   post:
 *     summary: Bulk register drivers
 *     tags: [Drivers]
 */
router.post("/bulk-register", protect, adminOnly, bulkRegisterDrivers);

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
 */
router.get("/", protect, adminOnly, getDrivers);

/**
 * @swagger
 * /api/drivers/active:
 *   get:
 *     summary: Get active drivers
 *     tags: [Drivers]
 */
router.get("/active", protect, adminOnly, getActiveDrivers);

/**
 * @swagger
 * /api/drivers/search:
 *   get:
 *     summary: Search drivers
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 */
router.get("/search", protect, adminOnly, searchDrivers);

/**
 * @swagger
 * /api/drivers/me/performance:
 *   get:
 *     summary: Get logged-in driver performance
 *     tags: [Drivers]
 */
router.get("/me/performance", protect, getMyPerformance);

/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
 */
router.get("/:id", protect, getDriverById);

/**
 * @swagger
 * /api/drivers/{id}/performance:
 *   get:
 *     summary: Get driver performance
 *     tags: [Drivers]
 */
router.get("/:id/performance", protect, getDriverPerformance);

/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update driver
 *     tags: [Drivers]
 */
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([
    { name: "aadharCard", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  updateDriver
);

/**
 * @swagger
 * /api/drivers/{id}/verify:
 *   put:
 *     summary: Verify driver documents
 *     tags: [Drivers]
 */
router.put("/:id/verify", protect, adminOnly, verifyDriver);

/**
 * @swagger
 * /api/drivers/{id}/kyc-status:
 *   put:
 *     summary: Update KYC status
 *     tags: [Drivers]
 */
router.put("/:id/kyc-status", protect, adminOnly, verifyDocuments);

/**
 * @swagger
 * /api/drivers/{id}/safety-alert:
 *   post:
 *     summary: Send safety alert
 *     tags: [Drivers]
 */
router.post("/:id/safety-alert", protect, adminOnly, sendSafetyAlert);

/**
 * @swagger
 * /api/drivers/{id}:
 *   delete:
 *     summary: Delete driver
 *     tags: [Drivers]
 */
router.delete("/:id", protect, adminOnly, deleteDriver);

module.exports = router;