const express = require("express");
const router = express.Router();
const { getActiveTrip, getMyTrips, simulateTrip, updateTripStatus } = require("../controllers/tripController");
const { protect } = require("../middleware/authMiddleware");

router.get("/active", protect, getActiveTrip);
router.get("/me", protect, getMyTrips);
router.post("/simulate", protect, simulateTrip);
router.put("/:id/status", protect, updateTripStatus);

module.exports = router;
