const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  swapId: { type: String, unique: true },
  piece1: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  piece2: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cashTopUp: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['accepted', 'in-vault', 'audit-pending', 'audit-passed', 'completed', 'failed'], 
    default: 'accepted' 
  },
  auditStatus: {
    piece1Audited: Boolean,
    piece2Audited: Boolean,
    piece1ApprovedByUser1: Boolean,
    piece2ApprovedByUser2: Boolean
  },
  timeline: [{
    step: String,
    status: { type: String, enum: ['completed', 'active', 'pending'] },
    timestamp: { type: Date, default: Date.now },
    description: String
  }],
  vaultLocation1: String,
  vaultLocation2: String,
  estimatedAuditDate: Date,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('Swap', swapSchema);
