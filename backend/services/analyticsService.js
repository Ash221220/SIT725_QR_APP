const mongoose = require('mongoose');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

function parseDateRange(from, to) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end);
  if (from) {
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start.setUTCDate(start.getUTCDate() - 30);
    start.setUTCHours(0, 0, 0, 0);
  }
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

async function getSummaryForRestaurant(restaurantId, from, to) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurant id', 400, 'INVALID_RESTAURANT_ID');
  }

  const { start, end } = parseDateRange(from, to);

  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: start, $lte: end },
  });

  if (!orders.length) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      topItem: null,
      busiestTable: null,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }

  const itemCounts = {};
  const tableCounts = {};
  let totalRevenue = 0;

  orders.forEach((order) => {
    totalRevenue += order.totalAmount || 0;
    if (order.tableNumber != null) {
      tableCounts[order.tableNumber] = (tableCounts[order.tableNumber] || 0) + 1;
    }
    (order.items || []).forEach((item) => {
      const key = item.name || 'Unknown';
      itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 0);
    });
  });

  let topItem = null;
  let topCount = 0;
  Object.entries(itemCounts).forEach(([name, count]) => {
    if (count > topCount) {
      topCount = count;
      topItem = name;
    }
  });

  let busiestTable = null;
  let busiestCount = 0;
  Object.entries(tableCounts).forEach(([table, count]) => {
    if (count > busiestCount) {
      busiestCount = count;
      busiestTable = Number(table);
    }
  });

  return {
    totalOrders: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    topItem,
    busiestTable,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

module.exports = {
  getSummaryForRestaurant,
};
