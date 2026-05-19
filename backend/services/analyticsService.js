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

async function getPeakHours(restaurantId, days = 30) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurant id', 400, 'INVALID_RESTAURANT_ID');
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: startDate },
  });

  if (!orders.length) {
    return {
      peakHoursByDay: {},
      message: 'Insufficient data for peak hours analysis',
    };
  }

  // Group orders by day of week (0-6) and hour (0-23)
  const hourlyData = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  dayNames.forEach((day) => {
    hourlyData[day] = Array(24).fill(0); // Initialize 24 hours
  });

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const dayOfWeek = dayNames[orderDate.getUTCDay()];
    const hour = orderDate.getUTCHours();
    hourlyData[dayOfWeek][hour] += 1;
  });

  // Calculate average for each hour and identify peak hours
  const peakHoursByDay = {};

  dayNames.forEach((day) => {
    const hourCounts = hourlyData[day];
    const avgPerHour = hourCounts.reduce((a, b) => a + b, 0) / 24;

    // Find top 3 busiest hours for this day
    const hoursWithCounts = hourCounts.map((count, hour) => ({
      hour,
      count,
      aboveAverage: count > avgPerHour,
    }));

    hoursWithCounts.sort((a, b) => b.count - a.count);
    const topHours = hoursWithCounts.slice(0, 3).map((h) => h.hour);

    // Calculate confidence based on variance
    const variance =
      hourCounts.reduce((sum, count) => sum + Math.pow(count - avgPerHour, 2), 0) / 24;
    const stdDev = Math.sqrt(variance);
    let confidence = 'Low';

    if (stdDev > avgPerHour * 0.5) {
      confidence = 'High';
    } else if (stdDev > avgPerHour * 0.25) {
      confidence = 'Medium';
    }

    peakHoursByDay[day] = {
      peakHours: topHours,
      confidence,
      avgOrdersPerHour: Math.round(avgPerHour * 100) / 100,
    };
  });

  return {
    peakHoursByDay,
    analysisWindow: `Last ${days} days`,
  };
}

async function getItemSalesForecast(restaurantId, days = 30) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurant id', 400, 'INVALID_RESTAURANT_ID');
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: startDate },
  });

  if (!orders.length) {
    return {
      forecastedItems: [],
      message: 'Insufficient data for item sales forecast',
    };
  }

  // Create daily item sales data
  const itemSalesTimeSeries = {};

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const dateKey = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD

    (order.items || []).forEach((item) => {
      const itemName = item.name || 'Unknown';
      if (!itemSalesTimeSeries[itemName]) {
        itemSalesTimeSeries[itemName] = {};
      }
      if (!itemSalesTimeSeries[itemName][dateKey]) {
        itemSalesTimeSeries[itemName][dateKey] = 0;
      }
      itemSalesTimeSeries[itemName][dateKey] += item.quantity || 1;
    });
  });

  // Calculate trend for each item
  const forecastedItems = [];

  Object.entries(itemSalesTimeSeries).forEach(([itemName, dateSales]) => {
    const salesArray = Object.values(dateSales).sort((a, b) => a - b);

    if (salesArray.length < 2) return; // Need at least 2 data points

    const total = salesArray.reduce((a, b) => a + b, 0);
    const average = total / salesArray.length;

    // Calculate simple moving average (last 7 days vs previous 7 days)
    const sortedDates = Object.keys(dateSales).sort();
    const midpoint = Math.floor(sortedDates.length / 2);

    const firstHalfSales = sortedDates
      .slice(0, midpoint)
      .reduce((sum, date) => sum + dateSales[date], 0);
    const secondHalfSales = sortedDates
      .slice(midpoint)
      .reduce((sum, date) => sum + dateSales[date], 0);

    const firstHalfAvg = firstHalfSales / midpoint;
    const secondHalfAvg = secondHalfSales / (sortedDates.length - midpoint);

    // Determine trend
    let trend = 'stable';
    let trendPercentage = 0;

    if (secondHalfAvg > firstHalfAvg * 1.15) {
      trend = 'up';
      trendPercentage = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
    } else if (secondHalfAvg < firstHalfAvg * 0.85) {
      trend = 'down';
      trendPercentage = Math.round(((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100);
    }

    forecastedItems.push({
      itemName,
      currentAverageSales: Math.round(average * 100) / 100,
      forecast: Math.round(secondHalfAvg * 100) / 100,
      trend,
      trendPercentage,
      totalSalesInPeriod: total,
    });
  });

  // Sort by forecast (highest predicted sales first)
  forecastedItems.sort((a, b) => b.forecast - a.forecast);

  return {
    forecastedItems: forecastedItems.slice(0, 10), // Top 10 items
    analysisWindow: `Last ${days} days`,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getSummaryForRestaurant,
  getPeakHours,
  getItemSalesForecast,
};
