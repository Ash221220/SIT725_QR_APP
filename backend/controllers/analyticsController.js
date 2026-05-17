const User = require('../models/User');
const analyticsService = require('../services/analyticsService');
const AppError = require('../utils/AppError');

async function getOwnerContext(userId) {
  const owner = await User.findById(userId).select('role status restaurantId');
  if (!owner || owner.role !== 'owner') {
    throw new AppError('Owner account not found', 404);
  }
  if (owner.status !== 'approved') {
    throw new AppError('Account is not approved', 403);
  }
  if (!owner.restaurantId) {
    throw new AppError('Owner has no linked restaurant', 404);
  }
  return owner;
}

async function getMySummary(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { from, to } = req.query;
    const summary = await analyticsService.getSummaryForRestaurant(
      owner.restaurantId,
      from,
      to
    );
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMySummary,
};
