const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');

function stripPassword(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.password;
  return o;
}

async function registerOwner({
  name,
  email,
  password,
  pendingRestaurantName,
  pendingRestaurantAddress,
  pendingRestaurantPhone,
  pendingRestaurantEmail,
}) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_ALREADY_REGISTERED');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'owner',
    status: 'pending',
    pendingRestaurantName,
    pendingRestaurantAddress,
    pendingRestaurantPhone,
    pendingRestaurantEmail,
  });
  return stripPassword(user);
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  if (user.role === 'owner' && user.status !== 'approved') {
    throw new AppError('Account is not approved', 403, 'OWNER_NOT_APPROVED');
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  const token = generateToken(user._id);
  return { token, user: stripPassword(user) };
}

module.exports = { registerOwner, loginUser };
