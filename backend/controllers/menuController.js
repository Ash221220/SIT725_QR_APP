// Purpose: Implement menu item business logic (create, read, update, delete, availability).
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const User = require('../models/User');
const menuService = require('../services/menuService');
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

async function getOwnerMenu(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const menu = await MenuItem.find({ restaurantId: owner.restaurantId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, menu });
  } catch (error) {
    return next(error);
  }
}

async function getOwnerTables(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const tables = await Table.find({ restaurantId: owner.restaurantId }).sort({ tableNumber: 1 });
    return res.status(200).json({ success: true, tables });
  } catch (error) {
    return next(error);
  }
}

async function getMenuByRestaurant(req, res, next) {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError('Invalid restaurant id', 400);
    }
    const menu = await MenuItem.find({ restaurantId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, menu });
  } catch (error) {
    return next(error);
  }
}

async function createMenuItem(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { name, category, dietaryType, description, price, image, isAvailable } = req.body;
    if (!name || price === undefined) {
      throw new AppError('Name and price are required', 400);
    }
    const item = await menuService.createMenuItem(owner.restaurantId, {
      name,
      category,
      dietaryType,
      description,
      price,
      image,
      isAvailable,
    });
    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    const item = await menuService.updateMenuItem(owner.restaurantId, itemId, req.body);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    await menuService.deleteMenuItem(owner.restaurantId, itemId);
    return res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    return next(error);
  }
}

async function toggleAvailability(req, res, next) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      throw new AppError('isAvailable must be a boolean', 400);
    }
    const item = await menuService.setAvailability(owner.restaurantId, itemId, isAvailable);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOwnerMenu,
  getOwnerTables,
  getMenuByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};
