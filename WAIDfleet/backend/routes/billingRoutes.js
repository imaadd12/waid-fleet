const express = require("express");
const router = express.Router();
const {
  generateWeeklyBills,
  getBills,
  markAsPaid
} = require("../controllers/billingController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/billing:
 *   get:
 *     summary: Get all bills
 *     tags: [Billing]
 */
router.get("/", protect, adminOnly, getBills);

/**
 * @swagger
 * /api/billing/generate-weekly:
 *   post:
 *     summary: Generate weekly bills for all drivers
 *     tags: [Billing]
 */
router.post("/generate-weekly", protect, adminOnly, generateWeeklyBills);

/**
 * @swagger
 * /api/billing/{id}/pay:
 *   put:
 *     summary: Mark a bill as paid
 *     tags: [Billing]
 */
router.put("/:id/pay", protect, adminOnly, markAsPaid);

module.exports = router;