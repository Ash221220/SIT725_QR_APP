const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getMySummary } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/my/summary', protect, authorize('owner'), getMySummary);

module.exports = router;
