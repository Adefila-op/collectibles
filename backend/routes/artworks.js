const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const auth = require('../middleware/auth');

router.post('/', auth, artworkController.createArtwork);
router.get('/', artworkController.getArtworks);
router.get('/:id', artworkController.getArtwork);
router.put('/:id', auth, artworkController.updateArtwork);
router.delete('/:id', auth, artworkController.deleteArtwork);

module.exports = router;
