const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.put('/:id', auth, userController.updateUser);

module.exports = router;
