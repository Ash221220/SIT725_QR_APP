const orderService = require('../services/orderService');

async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOrder,
};
