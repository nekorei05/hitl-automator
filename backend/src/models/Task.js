const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'invoice'],
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'REWRITING', 'STALE'],
    default: 'PENDING_APPROVAL'
  },

  // Email fields
  recipient:  String,
  subject:    String,
  body:       String,

  // Invoice fields
  clientName:  String,
  amount:      Number,
  description: String,

  // AI match analysis 
  matchLevel:   { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: null },
  matchReason:  { type: String, default: null },
  suggestions:  { type: [String], default: [] },

  // AI context
  originalPrompt:  String,
  rejectionReason: String,
  retryCount:      { type: Number, default: 0 },
  ragContext:      String,

  // Timing
  approvedAt:  Date,
  completedAt: Date,

}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);