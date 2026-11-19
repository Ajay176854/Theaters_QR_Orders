/**
 * 🚨 Grandé Muthuram Multiplex — Automated Order Escalation & Admin Call-Forward Service
 *
 * Configured Escalation Schedule:
 * - 1st Alert Call: at 5 minutes unread
 * - 2nd Alert Call: at 8 minutes unread
 * - 3rd Alert Call: at 10 minutes unread
 * - 4th Alert Call: at 12 minutes unread
 * - Subsequent Calls: every 2 minutes (14m, 16m...) until marked as READY or DELIVERED.
 *
 * Features:
 * 1. Physical Twilio Voice Outbound Call with Press-1-to-Repeat IVR
 * 2. High-Priority WhatsApp notification to Admin (+91 7092466027)
 * 3. Immediate call hang-up / cancellation when staff clicks "MARK AS READY"
 */

const mongoose = require('mongoose');
const { sendWhatsAppDirect } = require('./baileysBot');
const { initiateAutomatedVoiceCall } = require('./voiceCallService');

const ADMIN_PHONE = process.env.ADMIN_PHONE || '7092466027';

// Track the highest escalated stage triggered for each order (e.g. 5, 8, 10, 12, 14...)
const orderLastStageMap = new Map();

/**
 * Determine which alert stage an order has reached based on its age in minutes.
 * Schedule: 5 min -> 8 min -> 10 min -> 12 min -> every 2 min thereafter.
 */
function getDueEscalationStage(ageMinutes) {
  if (ageMinutes < 5) return 0;
  if (ageMinutes < 8) return 5;
  if (ageMinutes < 10) return 8;
  if (ageMinutes < 12) return 10;
  // 12m, 14m, 16m, etc.
  return 12 + Math.floor((ageMinutes - 12) / 2) * 2;
}

/**
 * Format speech & alert message for call forwarding
 */
const buildEscalationDetails = (order, stageMinutes) => {
  const shortId = order.orderId || order.shortId || (order._id ? String(order._id).slice(-6) : 'GMM');
  const screen = order.screenNumber || order.screen || 1;
  const seat = order.seatNumber || order.seat || 'A1';
  const customer = order.customerName || order.name || 'Patron';
  const customerPhone = order.customerPhone || order.phone || 'Not provided';
  const total = order.totalAmount || order.total || 0;
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const elapsedMin = stageMinutes || Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 60000));

  let itemsList = 'Concession Refreshments';
  if (Array.isArray(order.items) && order.items.length) {
    itemsList = order.items.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ');
  }

  // Alert Sequence Number (1st at 5m, 2nd at 8m, 3rd at 10m, 4th at 12m...)
  const alertNumber =
    elapsedMin === 5
      ? 1
      : elapsedMin === 8
      ? 2
      : elapsedMin === 10
      ? 3
      : elapsedMin === 12
      ? 4
      : Math.floor((elapsedMin - 12) / 2) + 4;

  const ordinalLabels = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth' };
  const ordinal = ordinalLabels[alertNumber] || `Alert #${alertNumber}`;

  // Spoken voice script for phone calls
  const spokenVoiceScript =
    `${ordinal} concession escalation alert from Grande Muthuram Multiplex. ` +
    `Order token ${shortId} for Customer ${customer} at Screen ${screen}, Seat ${seat} ` +
    `has not been marked ready for ${elapsedMin} minutes. ` +
    `Ordered items: ${itemsList}. Total: ${total} rupees. Please check kitchen console immediately. ` +
    `Press 1 on your phone dialpad to repeat these details, or hang up to disconnect.`;

  // WhatsApp text alert
  const whatsAppText =
    `🚨 *KITCHEN OVERDUE ESCALATION (${ordinal.toUpperCase()} ALERT — ${elapsedMin} MINS)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ *ATTENTION ADMIN:* Order has NOT been marked ready for *${elapsedMin} minutes*!\n\n` +
    `🎟️ *Order Token:* #${shortId}\n` +
    `📍 *Delivery Seat:* Screen ${screen} · Seat ${seat}\n` +
    `👤 *Customer:* ${customer}\n` +
    `📞 *Customer Phone:* +91 ${customerPhone}\n` +
    `📋 *Items:* ${itemsList}\n` +
    `💰 *Paid Total:* ₹${total}\n` +
    `🕒 *Delayed Duration:* ${elapsedMin} Minutes (Alert #${alertNumber})\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ *Action Required:* Automated call dispatched to Admin (+91 ${ADMIN_PHONE}). Please ensure kitchen prepares this order immediately!`;

  return {
    shortId,
    screen,
    seat,
    customer,
    customerPhone,
    total,
    itemsList,
    elapsedMin,
    alertNumber,
    ordinal,
    spokenVoiceScript,
    whatsAppText,
    adminPhone: ADMIN_PHONE,
  };
};

/**
 * Execute escalation: Voice call, WhatsApp alert, and WebSocket update
 */
async function triggerAdminEscalation(order, io, stageMinutes = 5, isManual = false) {
  if (!order) return { success: false, error: 'No order provided' };

  const details = buildEscalationDetails(order, stageMinutes);

  // Mark order stage
  const idStr = String(order._id || order.orderId || order.shortId);
  const tokenStr = String(order.orderId || order.shortId || idStr).toUpperCase();
  orderLastStageMap.set(idStr, stageMinutes);
  orderLastStageMap.set(tokenStr, stageMinutes);

  order.isEscalated = true;
  order.lastEscalatedStage = stageMinutes;
  order.escalatedAt = new Date().toISOString();

  console.log(`\n🚨🚨🚨 ==============================================================`);
  console.log(`📞 [ADMIN CALL-FORWARD ESCALATION — ALERT #${details.alertNumber} (${details.elapsedMin} MINS)]`);
  console.log(`🎯 Recipient: +91 ${details.adminPhone}`);
  console.log(`⚠️ Order: #${details.shortId} unready for ${details.elapsedMin} minutes!`);
  console.log(`📍 Destination: Screen ${details.screen} · Seat ${details.seat}`);
  console.log(`📋 Items: ${details.itemsList} | Total: ₹${details.total}`);
  console.log(`🎙️ Spoken IVR Text: "${details.spokenVoiceScript}"`);
  console.log(`🚨🚨🚨 ==============================================================\n`);

  // 1. Send High-Priority WhatsApp Alert to Admin
  try {
    await sendWhatsAppDirect(details.adminPhone, details.whatsAppText);
  } catch (waErr) {
    console.warn(`[Escalation WhatsApp Error]:`, waErr.message);
  }

  // 2. Dispatch Automated Outbound Voice Call to Admin with IVR
  let callResult = null;
  try {
    callResult = await initiateAutomatedVoiceCall(details, io);
  } catch (callErr) {
    console.warn(`[Voice Call Error]:`, callErr.message);
  }

  // 3. Broadcast Real-time Siren & Status to Kitchen Sockets
  if (io) {
    io.emit('admin-order-escalation', {
      orderId: order._id || order.orderId,
      shortId: details.shortId,
      screen: details.screen,
      seat: details.seat,
      customer: details.customer,
      customerPhone: details.customerPhone,
      items: details.itemsList,
      total: details.total,
      elapsedMin: details.elapsedMin,
      alertNumber: details.alertNumber,
      spokenVoiceScript: details.spokenVoiceScript,
      adminPhone: details.adminPhone,
      isManual,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  }

  return {
    success: true,
    escalated: true,
    alertNumber: details.alertNumber,
    stageMinutes: details.elapsedMin,
    adminPhone: details.adminPhone,
    details,
  };
}

/**
 * Background monitor: Scans orders every 15 seconds against the [5, 8, 10, 12, 14...] schedule
 */
function initEscalationMonitor(io) {
  console.log(`⏱️ [Escalation Monitor] Active. Schedule: Alert 1 (5m) ➔ Alert 2 (8m) ➔ Alert 3 (10m) ➔ Alert 4 (12m) ➔ Every 2m thereafter.`);
  console.log(`📞 [Escalation Monitor] Admin Phone configured: +91 ${ADMIN_PHONE}`);

  setInterval(async () => {
    try {
      const Order = mongoose.models.Order;

      // 1. Check MongoDB orders if connected
      if (mongoose.connection.readyState === 1 && Order) {
        const threshold5m = new Date(Date.now() - 5 * 60 * 1000);
        const candidateOrders = await Order.find({
          status: { $in: ['confirmed', 'preparing'] },
          createdAt: { $lte: threshold5m },
        }).lean();

        for (const order of candidateOrders) {
          const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
          const dueStage = getDueEscalationStage(ageMin);

          const idStr = String(order._id);
          const tokenStr = String(order.orderId || '').toUpperCase();
          const lastStage =
            orderLastStageMap.get(idStr) ||
            orderLastStageMap.get(tokenStr) ||
            order.lastEscalatedStage ||
            0;

          if (dueStage > 0 && dueStage > lastStage) {
            orderLastStageMap.set(idStr, dueStage);
            orderLastStageMap.set(tokenStr, dueStage);

            await triggerAdminEscalation(order, io, dueStage, false);

            await Order.updateOne(
              { _id: order._id },
              { $set: { isEscalated: true, lastEscalatedStage: dueStage, escalatedAt: new Date() } }
            );
          }
        }
      }

      // 2. Check In-Memory Orders Store
      const { inMemoryOrders } = require('../controllers/orderController');
      if (inMemoryOrders && inMemoryOrders.size > 0) {
        for (const [key, order] of inMemoryOrders.entries()) {
          // If already ready or delivered, cleanup tracking
          if (order.status === 'ready' || order.status === 'delivered' || order.status === 'cancelled') {
            const idStr = String(order._id || key);
            orderLastStageMap.delete(idStr);
            orderLastStageMap.delete(String(order.orderId || '').toUpperCase());
            continue;
          }

          if (order.status === 'confirmed' || order.status === 'preparing') {
            const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const dueStage = getDueEscalationStage(ageMin);

            const idStr = String(order._id || key);
            const tokenStr = String(order.orderId || key).toUpperCase();
            const lastStage =
              orderLastStageMap.get(idStr) ||
              orderLastStageMap.get(tokenStr) ||
              order.lastEscalatedStage ||
              0;

            if (dueStage > 0 && dueStage > lastStage) {
              orderLastStageMap.set(idStr, dueStage);
              orderLastStageMap.set(tokenStr, dueStage);
              order.lastEscalatedStage = dueStage;
              order.isEscalated = true;

              await triggerAdminEscalation(order, io, dueStage, false);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Escalation Monitor Error]:', err.message);
    }
  }, 15000);
}

module.exports = {
  triggerAdminEscalation,
  initEscalationMonitor,
  getDueEscalationStage,
  orderLastStageMap,
  ADMIN_PHONE,
};
