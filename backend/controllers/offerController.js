const Offer = require('../models/Offer');
const Artwork = require('../models/Artwork');

const generateOfferId = () => 'OFF-' + Date.now();

exports.createOffer = async (req, res) => {
  try {
    const { offeringPieceId, targetPieceId, offerType, cashAmount, topUp } = req.body;

    const offeringPiece = await Artwork.findById(offeringPieceId);
    const targetPiece = await Artwork.findById(targetPieceId);

    if (!offeringPiece || !targetPiece) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const offer = new Offer({
      offerId: generateOfferId(),
      offeringPiece: offeringPieceId,
      targetPiece: targetPieceId,
      offeringUser: req.userId,
      targetUser: targetPiece.owner,
      offerType,
      cashAmount: cashAmount || 0,
      topUp: topUp || false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await offer.save();

    // Notify via Socket.io
    req.app.locals.io.emit('offer_placed', {
      offer,
      targetUserId: targetPiece.owner
    });

    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const { targetUserId, status } = req.query;
    const query = {};

    if (targetUserId) query.targetUser = targetUserId;
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .populate('offeringPiece')
      .populate('targetPiece')
      .populate('offeringUser')
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.targetUser.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    offer.status = status;
    await offer.save();

    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.declineOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
