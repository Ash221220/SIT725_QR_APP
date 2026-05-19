const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const TableSession = require('../models/TableSession');
const AppError = require('../utils/AppError');

function formatCart(cart) {
  const obj = cart.toObject ? cart.toObject() : cart;
  const itemCount = (obj.items || []).reduce((sum, item) => sum + item.quantity, 0);
  return { ...obj, itemCount };
}

async function getCart(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError('Invalid session id', 400, 'INVALID_SESSION_ID');
  }

  const session = await TableSession.findById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  const cart = await Cart.findOne({ sessionId: session._id });
  if (!cart) {
    return {
      sessionId: session._id,
      restaurantId: session.restaurantId,
      tableNumber: session.tableNumber,
      items: [],
      subtotal: 0,
      itemCount: 0,
    };
  }

  return formatCart(cart);
}

module.exports = {
  getCart,
};
