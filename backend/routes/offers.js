const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const auth = require('../middleware/auth');

router.post('/', auth, offerController.createOffer);
router.get('/', offerController.getOffers);
router.put('/:id', auth, offerController.updateOfferStatus);
router.delete('/:id', auth, offerController.declineOffer);

module.exports = router;
