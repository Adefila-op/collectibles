const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const auth = require('../middleware/auth');

router.post('/', auth, swapController.acceptOffer);
router.get('/', swapController.getSwaps);
router.put('/:id', auth, swapController.updateSwapStatus);
router.post('/:id/approve', auth, swapController.approveAudit);

module.exports = router;
