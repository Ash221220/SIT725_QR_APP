const mongoose = require('mongoose');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

async function getOrderById(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400, 'INVALID_ORDER_ID');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  return order;
}

module.exports = {
  getOrderById,
};
