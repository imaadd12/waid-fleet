const mongoose = require('mongoose');

// Document Schema
const documentSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['aadhar', 'license', 'insurance', 'registration', 'pollution', 'fitness', 'passport', 'license_back', 'selfie_with_doc'],
    required: true
  },
  documentNumber: String,
  fileName: String,
  s3Url: {
    type: String,
    required: true
  },
  fileSize: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  issueDate: Date,
  issuingAuthority: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired', 'under_review'],
    default: 'pending',
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  verificationNotes: String,
  verificationDate: Date,
  autoVerified: Boolean,
  ocrData: {
    extractedText: String,
    confidence: Number,
    fields: mongoose.Schema.Types.Mixed
  },
  rejectionReason: String,
  resubmissionCount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Background Check Schema
const backgroundCheckSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true,
    index: true
  },
  checkType: {
    type: String,
    enum: ['criminal', 'driving_history', 'employment', 'comprehensive'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 're_check_needed'],
    default: 'pending',
    index: true
  },
  provider: String,
  providerReference: String,
  result: {
    type: String,
    enum: ['clear', 'flagged', 'review_required', 'pending'],
    default: 'pending'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  findings: String,
  detailedReport: mongoose.Schema.Types.Mixed,
  flags: [
    {
      type: String,
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      description: String
    }
  ],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  validUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Document Verification Task Schema
const documentVerificationTaskSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  requiredDocuments: [
    {
      documentType: String,
      status: {
        type: String,
        enum: ['pending', 'uploaded', 'verified', 'rejected'],
        default: 'pending'
      },
      uploadedDate: Date,
      verifiedDate: Date
    }
  ],
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  dueDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  notes: String
});

// Create indexes
documentSchema.index({ driverId: 1, documentType: 1 });
documentSchema.index({ verificationStatus: 1 });
backgroundCheckSchema.index({ status: 1, createdAt: -1 });
documentVerificationTaskSchema.index({ driverId: 1, isComplete: 1 });

module.exports = {
  Document: mongoose.model('Document', documentSchema),
  BackgroundCheck: mongoose.model('BackgroundCheck', backgroundCheckSchema),
  DocumentVerificationTask: mongoose.model('DocumentVerificationTask', documentVerificationTaskSchema)
};
