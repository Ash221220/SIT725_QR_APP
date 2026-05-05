// Purpose: Handle admin authentication actions such as login (and registration if needed).
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

async function registerOwner(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      pendingRestaurantName,
      pendingRestaurantAddress,
      pendingRestaurantPhone,
      pendingRestaurantEmail,
    } = req.body;

    if (!name || !email || !password || !pendingRestaurantName || !pendingRestaurantAddress) {
      throw new AppError(
        'Name, email, password, restaurant name, and restaurant address are required',
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }

    const user = await authService.registerOwner({
      name,
      email,
      password,
      pendingRestaurantName,
      pendingRestaurantAddress,
      pendingRestaurantPhone,
      pendingRestaurantEmail,
    });

    return res.status(201).json({ success: true, user });
  } catch (err) {
    return next(err);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }
    const result = await authService.loginUser({ email, password });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { registerOwner, loginUser };
