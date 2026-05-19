const express = require('express');
const { getCart } = require('../controllers/cartController');

const router = express.Router();

// Guest: get cart for a session (no auth)
router.get('/:sessionId', getCart);

module.exports = router;
