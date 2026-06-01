const Swap = require('../models/Swap');
const Offer = require('../models/Offer');

const generateSwapId = () => 'SWP-' + Math.random().toString(36).substr(2, 9).toUpperCase();

exports.acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.body;
    const offer = await Offer.findById(offerId)
      .populate('offeringPiece')
      .populate('targetPiece')
      .populate('offeringUser')
      .populate('targetUser');

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.targetUser._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create Swap
    const swap = new Swap({
      swapId: generateSwapId(),
      piece1: offer.targetPiece._id,
      piece2: offer.offeringPiece._id,
      user1: offer.targetUser._id,
      user2: offer.offeringUser._id,
      cashTopUp: offer.cashAmount,
      timeline: [
        {
          step: 'Swap accepted onchain',
          status: 'completed',
          description: 'Both parties locked in'
        },
        {
          step: 'Both pieces ship to vault',
          status: 'active',
          description: 'Lagos & Accra drop-off points'
        },
        {
          step: 'Dual audit',
          status: 'pending',
          description: 'Both artworks verified'
        },
        {
          step: 'Both parties approve',
          status: 'pending',
          description: 'Tokens swapped on approval'
        },
        {
          step: 'Art cross-shipped to new owners',
          status: 'pending',
          description: ''
        }
      ]
    });

    await swap.save();

    // Update offer status
    offer.status = 'accepted';
    await offer.save();

    // Notify via Socket.io
    req.app.locals.io.emit('swap_initiated', {
      swap,
      users: [offer.user1, offer.user2]
    });

    res.status(201).json(swap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSwaps = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { $or: [{ user1: userId }, { user2: userId }] } : {};

    const swaps = await Swap.find(query)
      .populate('piece1')
      .populate('piece2')
      .populate('user1')
      .populate('user2')
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSwapStatus = async (req, res) => {
  try {
    const { status, step } = req.body;
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    if (status) swap.status = status;

    if (step) {
      const timeline = swap.timeline.find(t => t.step === step);
      if (timeline) {
        timeline.status = req.body.stepStatus || 'completed';
        timeline.timestamp = new Date();
      }
    }

    await swap.save();

    // Notify via Socket.io
    req.app.locals.io.emit('swap_updated', swap);

    res.json(swap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveAudit = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    if (swap.user1.toString() === req.userId) {
      swap.auditStatus.piece1ApprovedByUser1 = true;
    } else if (swap.user2.toString() === req.userId) {
      swap.auditStatus.piece2ApprovedByUser2 = true;
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If both approved, complete swap
    if (swap.auditStatus.piece1ApprovedByUser1 && swap.auditStatus.piece2ApprovedByUser2) {
      swap.status = 'completed';
      swap.completedAt = new Date();
    }

    await swap.save();
    res.json(swap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
