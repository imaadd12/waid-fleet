const asyncHandler = require('express-async-handler');
const { Document, BackgroundCheck, DocumentVerificationTask } = require('../models/documentModel');
const { generateUniqueId, sendSuccess, sendError } = require('../utils/helpers');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const { driverId, documentType, documentNumber, expiryDate, issueDate, issuingAuthority } = req.body;
  const s3Url = req.file?.key ? `https://s3.amazonaws.com/${req.file.key}` : req.body.s3Url;

  if (!driverId || !documentType || !s3Url) {
    return sendError(res, 400, 'Missing required fields');
  }

  const doc = await Document.create({
    driverId,
    documentType,
    documentNumber,
    fileName: req.file?.originalname,
    s3Url,
    fileSize: req.file?.size,
    uploadedAt: new Date(),
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    issueDate: issueDate ? new Date(issueDate) : null,
    issuingAuthority,
    verificationStatus: 'pending'
  });

  sendSuccess(res, 201, doc, 'Document uploaded successfully');
});

// @desc    Get driver documents
// @route   GET /api/documents/driver/:driverId
// @access  Private
const getDriverDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ driverId: req.params.driverId })
    .sort('-uploadedAt');

  sendSuccess(res, 200, documents, `Found ${documents.length} documents`);
});

// @desc    Get pending documents for verification
// @route   GET /api/documents/verify/pending
// @access  Private (Admin only)
const getPendingDocuments = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;

  const documents = await Document.find({ verificationStatus: 'pending' })
    .populate('driverId', 'firstName lastName phoneNumber')
    .sort('-uploadedAt')
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Document.countDocuments({ verificationStatus: 'pending' });

  res.status(200).json({
    success: true,
    data: documents,
    total,
    count: documents.length
  });
});

// @desc    Verify document
// @route   PUT /api/documents/:id/verify
// @access  Private (Admin only)
const verifyDocument = asyncHandler(async (req, res) => {
  const { verificationStatus, verificationNotes } = req.body;

  if (!['verified', 'rejected'].includes(verificationStatus)) {
    return sendError(res, 400, 'Invalid verification status');
  }

  const doc = await Document.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus,
      verificationNotes,
      verifiedBy: req.user.id,
      verificationDate: new Date(),
      autoVerified: false
    },
    { new: true }
  );

  if (!doc) {
    return sendError(res, 404, 'Document not found');
  }

  sendSuccess(res, 200, doc, `Document ${verificationStatus} successfully`);
});

// @desc    Get background check for driver
// @route   GET /api/background-check/:driverId
// @access  Private (Admin only)
const getBackgroundCheck = asyncHandler(async (req, res) => {
  const check = await BackgroundCheck.findOne({ driverId: req.params.driverId });

  if (!check) {
    return sendError(res, 404, 'No background check found');
  }

  sendSuccess(res, 200, check);
});

// @desc    Create background check request
// @route   POST /api/background-check
// @access  Private (Admin only)
const createBackgroundCheck = asyncHandler(async (req, res) => {
  const { driverId, checkType, provider } = req.body;

  const check = await BackgroundCheck.create({
    driverId,
    checkType,
    provider,
    status: 'pending'
  });

  sendSuccess(res, 201, check, 'Background check request created');
});

// @desc    Update background check status
// @route   PUT /api/background-check/:id
// @access  Private (Admin only)
const updateBackgroundCheck = asyncHandler(async (req, res) => {
  const { status, result, riskLevel, findings } = req.body;

  const check = await BackgroundCheck.findByIdAndUpdate(
    req.params.id,
    { status, result, riskLevel, findings, completedAt: new Date() },
    { new: true }
  );

  if (!check) {
    return sendError(res, 404, 'Background check not found');
  }

  sendSuccess(res, 200, check, 'Background check updated');
});

// @desc    Get document verification task
// @route   GET /api/documents/verification-task/:driverId
// @access  Private
const getVerificationTask = asyncHandler(async (req, res) => {
  let task = await DocumentVerificationTask.findOne({ driverId: req.params.driverId });

  if (!task) {
    task = await DocumentVerificationTask.create({
      driverId: req.params.driverId,
      requiredDocuments: [
        { documentType: 'aadhar', status: 'pending' },
        { documentType: 'license', status: 'pending' },
        { documentType: 'insurance', status: 'pending' }
      ],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });
  }

  sendSuccess(res, 200, task);
});

module.exports = {
  uploadDocument,
  getDriverDocuments,
  getPendingDocuments,
  verifyDocument,
  getBackgroundCheck,
  createBackgroundCheck,
  updateBackgroundCheck,
  getVerificationTask
};
