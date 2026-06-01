const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: String,
  description: String,
  images: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artistVerified: { type: Boolean, default: false },
  provenance: [{
    owner: String,
    date: Date,
    notes: String
  }],
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  estimatedValue: { type: Number, required: true },
  currentValue: { type: Number },
  medium: String,
  dimensions: {
    height: Number,
    width: Number,
    depth: Number
  },
  weight: Number,
  tokenId: String,
  onchain: { type: Boolean, default: false },
  lastSoldPrice: Number,
  auditPhotos: [String],
  listingStatus: { type: String, enum: ['not-listed', 'active', 'sold'], default: 'not-listed' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Artwork', artworkSchema);
