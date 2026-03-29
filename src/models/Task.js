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

  // Email 
  recipient: String,
  subject: String,
  body: String,

  // Invoice 
  clientName: String,
  amount: Number,
  description: String,

  // AI context
  originalPrompt: String,
  rejectionReason: String,
  retryCount: { type: Number, default: 0 },
  ragContext: String,           

  
  // Timing
  approvedAt: Date,
  completedAt: Date

}, { timestamps: true }); 

module.exports = mongoose.model('Task', TaskSchema);