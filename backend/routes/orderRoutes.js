const express = require('express');
const { getOrder } = require('../controllers/orderController');

const router = express.Router();

// Guest: get order by id (no auth)
router.get('/:orderId', getOrder);

module.exports = router;
