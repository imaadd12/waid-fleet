const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/documents"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only documents and images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Placeholder controller functions - to be implemented
const documentController = {
  uploadDocument: (req, res) => res.json({ message: "Document uploaded" }),
  getMyDocuments: (req, res) => res.json({ message: "Get my documents" }),
  getDocumentById: (req, res) => res.json({ message: "Get document details" }),
  verifyDocument: (req, res) => res.json({ message: "Verify document" }),
  rejectDocument: (req, res) => res.json({ message: "Reject document" }),
  createBackgroundCheck: (req, res) => res.json({ message: "Background check created" }),
  getBackgroundCheckStatus: (req, res) => res.json({ message: "Get background check status" }),
};

// @route   POST /api/documents/upload
// @desc    Upload a document
// @access  Private
router.post("/upload", protect, upload.single("document"), documentController.uploadDocument);

// @route   GET /api/documents/my-documents
// @desc    Get my documents
// @access  Private
router.get("/my-documents", protect, documentController.getMyDocuments);

// @route   GET /api/documents/:documentId
// @desc    Get document by ID
// @access  Private
router.get("/:documentId", protect, documentController.getDocumentById);

// @route   POST /api/documents/:documentId/verify
// @desc    Verify document (Admin)
// @access  Private (Admin only)
router.post("/:documentId/verify", protect, adminOnly, documentController.verifyDocument);

// @route   POST /api/documents/:documentId/reject
// @desc    Reject document (Admin)
// @access  Private (Admin only)
router.post("/:documentId/reject", protect, adminOnly, documentController.rejectDocument);

// @route   POST /api/documents/background-check/create
// @desc    Create background check
// @access  Private (Admin only)
router.post("/background-check/create", protect, adminOnly, documentController.createBackgroundCheck);

// @route   GET /api/documents/background-check/:id
// @desc    Get background check status
// @access  Private
router.get("/background-check/:id", protect, documentController.getBackgroundCheckStatus);

module.exports = router;
