const cartService = require('../services/cartService');

async function getCart(req, res, next) {
  try {
    const { sessionId } = req.params;
    const cart = await cartService.getCart(sessionId);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCart,
};
