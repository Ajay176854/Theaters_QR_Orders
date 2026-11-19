const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { authenticate, authorize } = require('../middleware/auth');

// Summary report (today's stats) - accessible by staff and admin
router.get('/summary', authenticate, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const { inMemoryOrders } = require('../controllers/orderController');
      const memList = Array.from(inMemoryOrders.values()).filter((o) => o.paymentStatus === 'paid' || o.status === 'confirmed' || o.status === 'ready');
      const revenue = memList.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0);
      return res.json({
        today: {
          revenue,
          orderCount: memList.length,
          avgOrderValue: memList.length ? Math.round(revenue / memList.length) : 0,
        },
        statusBreakdown: {
          confirmed: memList.filter((o) => o.status === 'confirmed').length,
          preparing: memList.filter((o) => o.status === 'preparing').length,
          ready: memList.filter((o) => o.status === 'ready').length,
          delivered: memList.filter((o) => o.status === 'delivered').length,
        },
      });
    }

    let { theaterId } = req.query;
    theaterId = theaterId || req.user?.theaterId;

    if (!theaterId) {
      const Theater = require('../models/Theater');
      const firstTheater = await Theater.findOne();
      if (firstTheater) theaterId = firstTheater._id;
    }

    if (!theaterId) {
      return res.status(400).json({ error: 'theaterId is required.' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const match = {
      paymentStatus: 'paid',
      createdAt: { $gte: todayStart, $lte: todayEnd },
    };
    if (mongoose.Types.ObjectId.isValid(theaterId)) {
      match.theaterId = new mongoose.Types.ObjectId(theaterId);
    }

    const todayStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    const statusMatch = {
      createdAt: { $gte: todayStart, $lte: todayEnd },
    };
    if (mongoose.Types.ObjectId.isValid(theaterId)) {
      statusMatch.theaterId = new mongoose.Types.ObjectId(theaterId);
    }

    const statusCounts = await Order.aggregate([
      {
        $match: statusMatch,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = todayStats[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 };
    const statusMap = {};
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    // ── Real-time 7-Day Concession Sales Trend from MongoDB ──
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      past7Days.push({ date: dateStr, day: dayName });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyMatch = {
      paymentStatus: 'paid',
      createdAt: { $gte: sevenDaysAgo },
    };
    if (mongoose.Types.ObjectId.isValid(theaterId)) {
      weeklyMatch.theaterId = new mongoose.Types.ObjectId(theaterId);
    }

    const weeklyStats = await Order.aggregate([
      { $match: weeklyMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const weeklyMap = {};
    weeklyStats.forEach((w) => {
      weeklyMap[w._id] = { rev: w.totalRevenue, orders: w.orderCount };
    });

    const weeklyTrend = past7Days.map((d) => ({
      date: d.date,
      day: d.day,
      rev: Math.round((weeklyMap[d.date]?.rev || 0) * 100) / 100,
      orders: weeklyMap[d.date]?.orders || 0,
    }));

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    const yesterdayRevenue = weeklyMap[yesterdayStr]?.rev || 0;

    let vsYesterdayText = 'First day of sales';
    const currentTodayRevenue = stats.totalRevenue || 0;
    if (yesterdayRevenue > 0) {
      const diff = Math.round(((currentTodayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
      vsYesterdayText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff)}% vs yesterday`;
    } else if (currentTodayRevenue > 0) {
      vsYesterdayText = '↑ Active today';
    }

    res.json({
      today: {
        revenue: Math.round(stats.totalRevenue * 100) / 100,
        orderCount: stats.orderCount,
        avgOrderValue: Math.round((stats.avgOrderValue || 0) * 100) / 100,
        vsYesterday: vsYesterdayText,
      },
      statusBreakdown: statusMap,
      weeklyTrend,
    });
  } catch (error) {
    next(error);
  }
});

// All subsequent in-depth analytics reports require admin auth
router.use(authenticate, authorize('admin'));

/**
 * Revenue report by date range
 * GET /api/reports/revenue?theaterId=X&from=DATE&to=DATE
 */
router.get('/revenue', async (req, res, next) => {
  try {
    let { theaterId, from, to } = req.query;
    theaterId = theaterId || req.user?.theaterId;

    if (!theaterId) {
      const Theater = require('../models/Theater');
      const firstTheater = await Theater.findOne();
      if (firstTheater) theaterId = firstTheater._id;
    }

    if (!theaterId) {
      return res.status(400).json({ error: 'theaterId is required.' });
    }

    const match = {
      paymentStatus: 'paid',
    };
    if (mongoose.Types.ObjectId.isValid(theaterId)) {
      match.theaterId = new mongoose.Types.ObjectId(theaterId);
    }

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const result = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const grandTotal = result.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalOrders = result.reduce((sum, day) => sum + day.orderCount, 0);

    res.json({
      dailyBreakdown: result.map((r) => ({
        date: r._id,
        revenue: Math.round(r.totalRevenue * 100) / 100,
        orders: r.orderCount,
        avgOrderValue: Math.round(r.avgOrderValue * 100) / 100,
      })),
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalOrders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Popular items report
 * GET /api/reports/popular-items?theaterId=X&limit=10
 */
router.get('/popular-items', async (req, res, next) => {
  try {
    let { theaterId, limit = 10 } = req.query;
    theaterId = theaterId || req.user?.theaterId;

    if (!theaterId) {
      const Theater = require('../models/Theater');
      const firstTheater = await Theater.findOne();
      if (firstTheater) theaterId = firstTheater._id;
    }

    if (!theaterId) {
      return res.status(400).json({ error: 'theaterId is required.' });
    }

    const match = { paymentStatus: 'paid' };
    if (mongoose.Types.ObjectId.isValid(theaterId)) {
      match.theaterId = new mongoose.Types.ObjectId(theaterId);
    }

    const result = await Order.aggregate([
      {
        $match: match,
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit, 10) },
    ]);

    res.json({
      items: result.map((r) => ({
        menuItemId: r._id,
        name: r.name,
        totalQuantity: r.totalQuantity,
        totalRevenue: Math.round(r.totalRevenue * 100) / 100,
        orderCount: r.orderCount,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
