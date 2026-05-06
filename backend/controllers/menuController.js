// Purpose: Implement menu item business logic (create, read, update, delete, availability).
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const User = require('../models/User');
const menuService = require('../services/menuService');

async function getOwnerContext(userId) {
  const owner = await User.findById(userId).select('role status restaurantId');
  if (!owner || owner.role !== 'owner') {
    throw new Error('Owner account not found');
  }
  if (owner.status !== 'approved') {
    throw new Error('Account is not approved');
  }
  if (!owner.restaurantId) {
    throw new Error('Owner has no linked restaurant');
  }
  return owner;
}

async function getOwnerMenu(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const menu = await MenuItem.find({ restaurantId: owner.restaurantId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, menu });
  } catch (error) {
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getOwnerTables(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const tables = await Table.find({ restaurantId: owner.restaurantId }).sort({ tableNumber: 1 });
    return res.status(200).json({ success: true, tables });
  } catch (error) {
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getMenuByRestaurant(req, res) {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Invalid restaurant id' });
    }
    const menu = await MenuItem.find({ restaurantId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, menu });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createMenuItem(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { name, category, dietaryType, description, price, image, isAvailable } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
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
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateMenuItem(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    const item = await menuService.updateMenuItem(owner.restaurantId, itemId, req.body);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === 'Invalid item id') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant' ||
      error.message === 'Menu item not found'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteMenuItem(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    await menuService.deleteMenuItem(owner.restaurantId, itemId);
    return res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === 'Invalid item id') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant' ||
      error.message === 'Menu item not found'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function toggleAvailability(req, res) {
  try {
    const owner = await getOwnerContext(req.user.id);
    const { itemId } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isAvailable must be a boolean' });
    }
    const item = await menuService.setAvailability(owner.restaurantId, itemId, isAvailable);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    if (error.message === 'Account is not approved') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === 'Invalid item id') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (
      error.message === 'Owner account not found' ||
      error.message === 'Owner has no linked restaurant' ||
      error.message === 'Menu item not found'
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
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
