// Purpose: Encapsulate menu item business logic for create, read, update, delete, and availability toggling.
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const AppError = require('../utils/AppError');

async function getMenuByRestaurantId(restaurantId) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurant id', 400);
  }
  return MenuItem.find({ restaurantId }).sort({ createdAt: 1 });
}

async function getMenuByOwner(restaurantId) {
  return MenuItem.find({ restaurantId }).sort({ createdAt: 1 });
}

async function getTablesByOwner(restaurantId) {
  return Table.find({ restaurantId }).sort({ tableNumber: 1 });
}

async function createMenuItem(
  restaurantId,
  { name, category, dietaryType, description, price, image, isAvailable }
) {
  const item = await MenuItem.create({
    restaurantId,
    name,
    category,
    dietaryType,
    description,
    price,
    image,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });
  return item;
}

async function updateMenuItem(restaurantId, itemId, updates) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new AppError('Invalid item id', 400);
  }
  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  const allowed = ['name', 'category', 'dietaryType', 'description', 'price', 'image', 'isAvailable'];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) {
      item[key] = updates[key];
    }
  });
  await item.save();
  return item;
}

async function deleteMenuItem(restaurantId, itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new AppError('Invalid item id', 400);
  }
  const item = await MenuItem.findOneAndDelete({ _id: itemId, restaurantId });
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  return item;
}

async function setAvailability(restaurantId, itemId, isAvailable) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new AppError('Invalid item id', 400);
  }
  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  item.isAvailable = isAvailable;
  await item.save();
  return item;
}

module.exports = {
  getMenuByRestaurantId,
  getMenuByOwner,
  getTablesByOwner,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setAvailability,
};
