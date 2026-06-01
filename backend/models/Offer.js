const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerId: { type: String, unique: true },
  offeringPiece: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  targetPiece: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  offeringUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offerType: { type: String, enum: ['art-swap', 'cash-only', 'art-plus-cash'], required: true },
  cashAmount: { type: Number, default: 0 },
  topUp: Boolean,
  status: { type: String, enum: ['active', 'pending', 'accepted', 'rejected', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('Offer', offerSchema);
