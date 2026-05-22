const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const TableSession = require('../models/TableSession');
const AppError = require('../utils/AppError');

function formatCart(cart) {
  const obj = cart.toObject ? cart.toObject() : cart;
  const itemCount = (obj.items || []).reduce((sum, item) => sum + item.quantity, 0);
  return { ...obj, itemCount };
}

async function resolveSession(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError('Invalid session id', 400, 'INVALID_SESSION_ID');
  }
  const session = await TableSession.findById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }
  if (session.status !== 'active') {
    throw new AppError('Session is no longer active', 400, 'SESSION_CLOSED');
  }
  return session;
}

function recalcSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

async function addItem(sessionId, menuItemId, quantity = 1) {
  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    throw new AppError('Invalid menu item id', 400, 'INVALID_MENU_ITEM_ID');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError('Quantity must be a positive integer', 400, 'INVALID_QUANTITY');
  }

  const session = await resolveSession(sessionId);

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    throw new AppError('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
  }
  if (!menuItem.isAvailable) {
    throw new AppError('Menu item is not available', 400, 'ITEM_UNAVAILABLE');
  }
  if (String(menuItem.restaurantId) !== String(session.restaurantId)) {
    throw new AppError('Menu item does not belong to this restaurant', 400, 'ITEM_RESTAURANT_MISMATCH');
  }

  let cart = await Cart.findOne({ sessionId: session._id });
  if (!cart) {
    cart = await Cart.create({
      sessionId: session._id,
      restaurantId: session.restaurantId,
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      items: [],
      subtotal: 0,
    });
  }

  const existingIndex = cart.items.findIndex(
    (i) => String(i.menuItemId) === String(menuItemId)
  );

  if (existingIndex !== -1) {
    cart.items[existingIndex].quantity += quantity;
  } else {
    cart.items.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  cart.subtotal = recalcSubtotal(cart.items);
  await cart.save();

  return formatCart(cart);
}

async function updateQuantity(sessionId, menuItemId, quantity) {
  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    throw new AppError('Invalid menu item id', 400, 'INVALID_MENU_ITEM_ID');
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new AppError('Quantity must be a non-negative integer', 400, 'INVALID_QUANTITY');
  }

  const session = await resolveSession(sessionId);

  const cart = await Cart.findOne({ sessionId: session._id });
  if (!cart) {
    throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
  }

  const itemIndex = cart.items.findIndex(
    (i) => String(i.menuItemId) === String(menuItemId)
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404, 'CART_ITEM_NOT_FOUND');
  }

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  cart.subtotal = recalcSubtotal(cart.items);
  await cart.save();

  return formatCart(cart);
}

async function removeItem(sessionId, menuItemId) {
  return updateQuantity(sessionId, menuItemId, 0);
}

async function clearCart(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError('Invalid session id', 400, 'INVALID_SESSION_ID');
  }

  const cart = await Cart.findOne({ sessionId });
  if (!cart) {
    return { sessionId, items: [], subtotal: 0, itemCount: 0 };
  }

  cart.items = [];
  cart.subtotal = 0;
  await cart.save();

  return formatCart(cart);
}

module.exports = {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
};
