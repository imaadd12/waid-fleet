const FuelLog = require("../models/fuelLogModel");

// @desc    Add a fuel log entry
// @route   POST /api/fuel
// @access  Private (Admin)
const addFuelLog = async (req, res) => {
  try {
    const { vehicleId, driverId, date, fuelAmount, fuelCost, odometer, fuelType, station, notes } = req.body;

    if (!vehicleId || !fuelAmount || !fuelCost) {
      return res.status(400).json({ success: false, message: "vehicleId, fuelAmount, and fuelCost are required." });
    }

    const log = await FuelLog.create({
      vehicleId,
      driverId: driverId || null,
      date: date || undefined,
      fuelAmount,
      fuelCost,
      odometer: odometer || null,
      fuelType: fuelType || null,
      station: station || null,
      notes: notes || null,
      addedBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all fuel logs with filters and pagination
// @route   GET /api/fuel
// @access  Private (Admin)
const getFuelLogs = async (req, res) => {
  try {
    const { vehicleId, driverId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      FuelLog.find(query)
        .populate("vehicleId", "name plateNumber")
        .populate("driverId", "name phone")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FuelLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get fuel logs for a specific vehicle
// @route   GET /api/fuel/:vehicleId/logs
// @access  Private (Admin)
const getFuelLogsByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      FuelLog.find({ vehicleId })
        .populate("vehicleId", "name plateNumber")
        .populate("driverId", "name phone")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FuelLog.countDocuments({ vehicleId }),
    ]);

    return res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get fuel statistics
// @route   GET /api/fuel/stats
// @access  Private (Admin)
const getFuelStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const [overall, byVehicle, odometerLogs] = await Promise.all([
      // Overall aggregation
      FuelLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalFuelCost: { $sum: "$fuelCost" },
            totalLiters: { $sum: "$fuelAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Breakdown by vehicle
      FuelLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$vehicleId",
            totalFuelCost: { $sum: "$fuelCost" },
            totalLiters: { $sum: "$fuelAmount" },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "_id",
            foreignField: "_id",
            as: "vehicle",
          },
        },
        {
          $project: {
            totalFuelCost: 1,
            totalLiters: 1,
            count: 1,
            vehicle: { $arrayElemAt: ["$vehicle", 0] },
          },
        },
        {
          $project: {
            totalFuelCost: 1,
            totalLiters: 1,
            count: 1,
            vehicleName: "$vehicle.name",
            plateNumber: "$vehicle.plateNumber",
          },
        },
      ]),

      // Odometer-based efficiency: get sorted logs per vehicle that have odometer readings
      FuelLog.aggregate([
        { $match: { ...matchStage, odometer: { $ne: null, $exists: true } } },
        { $sort: { vehicleId: 1, date: 1 } },
        {
          $group: {
            _id: "$vehicleId",
            readings: { $push: { odometer: "$odometer", liters: "$fuelAmount" } },
          },
        },
      ]),
    ]);

    const stats = overall[0] || { totalFuelCost: 0, totalLiters: 0, count: 0 };
    const avgCostPerLiter = stats.totalLiters > 0 ? stats.totalFuelCost / stats.totalLiters : 0;

    // Calculate km/liter efficiency per vehicle using odometer deltas
    const efficiencyMap = {};
    for (const entry of odometerLogs) {
      const readings = entry.readings;
      if (readings.length < 2) continue;
      let totalKm = 0;
      let totalLitersForKm = 0;
      for (let i = 1; i < readings.length; i++) {
        const kmDiff = readings[i].odometer - readings[i - 1].odometer;
        if (kmDiff > 0) {
          totalKm += kmDiff;
          totalLitersForKm += readings[i].liters;
        }
      }
      if (totalLitersForKm > 0) {
        efficiencyMap[entry._id.toString()] = parseFloat((totalKm / totalLitersForKm).toFixed(2));
      }
    }

    // Attach efficiency to vehicle breakdown
    const vehicleBreakdown = byVehicle.map((v) => ({
      ...v,
      efficiencyKmPerLiter: efficiencyMap[v._id?.toString()] || null,
    }));

    return res.json({
      success: true,
      data: {
        totalFuelCost: stats.totalFuelCost,
        totalLiters: stats.totalLiters,
        avgCostPerLiter: parseFloat(avgCostPerLiter.toFixed(2)),
        totalEntries: stats.count,
        vehicleBreakdown,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a fuel log entry
// @route   DELETE /api/fuel/:id
// @access  Private (Admin)
const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({ success: false, message: "Fuel log not found." });
    }

    return res.json({ success: true, message: "Fuel log deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addFuelLog, getFuelLogs, getFuelLogsByVehicle, getFuelStats, deleteFuelLog };
