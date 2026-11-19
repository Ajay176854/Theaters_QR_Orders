/**
 * 🚨 Grandé Muthuram Multiplex — Automated Order Escalation & Admin Call-Forward Service
 *
 * Rule: If kitchen staff does NOT pick up an order within 5 minutes of placement:
 * 1. Dispatches an automated call forward alert to Admin: +91 7092466027
 * 2. Sends an urgent WhatsApp escalation notification to Admin: +91 7092466027
 * 3. Broadcasts an emergency visual & audio siren on Kitchen Console & Admin Dashboard
 * 4. Triggers Browser Text-to-Speech audio announcement on staff devices
 */

const mongoose = require('mongoose');
const { sendWhatsAppDirect } = require('./baileysBot');
const { initiateAutomatedVoiceCall } = require('./voiceCallService');

const ADMIN_PHONE = process.env.ADMIN_PHONE || '7092466027';
const ESCALATION_MINUTES = parseInt(process.env.ESCALATION_DELAY_MINUTES, 10) || 5;

/**
 * Format speech & alert message for call forwarding
 */
const buildEscalationDetails = (order) => {
  const shortId = order.orderId || order.shortId || (order._id ? String(order._id).slice(-6) : 'GMM');
  const screen = order.screenNumber || order.screen || 1;
  const seat = order.seatNumber || order.seat || 'A1';
  const customer = order.customerName || order.name || 'Patron';
  const customerPhone = order.customerPhone || order.phone || 'Not provided';
  const total = order.totalAmount || order.total || 0;
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const elapsedMin = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 60000));

  let itemsList = 'Concession Refreshments';
  if (Array.isArray(order.items) && order.items.length) {
    itemsList = order.items.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ');
  }

  // Spoken voice script for phone calls
  const spokenVoiceScript =
    `Emergency Concession Alert from Grandé Muthuram Multiplex. ` +
    `Order token ${shortId} for Customer ${customer} at Screen ${screen}, Seat ${seat} ` +
    `has NOT been picked up by kitchen staff for over ${elapsedMin} minutes. ` +
    `Items: ${itemsList}. Total: ${total} rupees. Please check kitchen console immediately.`;

  // WhatsApp text alert
  const whatsAppText =
    `🚨 *KITCHEN OVERDUE ESCALATION — GRANDÉ MUTHURAM MULTIPLEX*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ *ATTENTION ADMIN:* Order has NOT been picked by staff for over *${elapsedMin} minutes*!\n\n` +
    `🎟️ *Order Token:* #${shortId}\n` +
    `📍 *Delivery Seat:* Screen ${screen} · Seat ${seat}\n` +
    `👤 *Customer:* ${customer}\n` +
    `📞 *Customer Phone:* +91 ${customerPhone}\n` +
    `📋 *Items:* ${itemsList}\n` +
    `💰 *Paid Total:* ₹${total}\n` +
    `🕒 *Placed At:* ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ *Action Required:* Automated call forwarded to Admin (+91 ${ADMIN_PHONE}). Please direct kitchen staff to prepare this order immediately!`;

  return {
    shortId,
    screen,
    seat,
    customer,
    customerPhone,
    total,
    itemsList,
    elapsedMin,
    spokenVoiceScript,
    whatsAppText,
    adminPhone: ADMIN_PHONE,
  };
};

/**
 * Execute escalation: Call Forward simulation, WhatsApp alert, and WebSocket broadcast
 */
async function triggerAdminEscalation(order, io, isManual = false) {
  if (!order) return { success: false, error: 'No order provided' };

  const details = buildEscalationDetails(order);

  // Mark as escalated to avoid repeat spam
  order.isEscalated = true;
  order.escalatedAt = new Date().toISOString();

  console.log(`\n🚨🚨🚨 ==============================================================`);
  console.log(`📞 [ADMIN CALL-FORWARD ESCALATION TRIGGERED]`);
  console.log(`🎯 Recipient (Admin Phone): +91 ${details.adminPhone}`);
  console.log(`⚠️ Reason: Order #${details.shortId} unpicked for > ${details.elapsedMin} minutes!`);
  console.log(`📍 Destination: Screen ${details.screen} · Seat ${details.seat}`);
  console.log(`👤 Customer: ${details.customer} (+91 ${details.customerPhone})`);
  console.log(`📋 Items: ${details.itemsList} | Total: ₹${details.total}`);
  console.log(`🎙️ Spoken Speech Script: "${details.spokenVoiceScript}"`);
  console.log(`🚨🚨🚨 ==============================================================\n`);

  // 1. Send High-Priority WhatsApp Alert to Admin
  try {
    await sendWhatsAppDirect(details.adminPhone, details.whatsAppText);
  } catch (waErr) {
    console.warn(`[Escalation WhatsApp Error]:`, waErr.message);
  }

  // 2. Dispatch Automated Outbound Voice Call to Admin (+91 7092466027) with IVR ('Press 1 to Repeat')
  let callResult = null;
  try {
    callResult = await initiateAutomatedVoiceCall(details, io);
  } catch (callErr) {
    console.warn(`[Voice Call Error]:`, callErr.message);
  }

  // 2. Broadcast Real-time Siren & Voice Alert to Kitchen & Admin Sockets
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
      spokenVoiceScript: details.spokenVoiceScript,
      adminPhone: details.adminPhone,
      isManual,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  }

  return {
    success: true,
    escalated: true,
    adminPhone: details.adminPhone,
    details,
  };
}

/**
 * Background monitor that scans for unpicked orders every 20 seconds
 */
function initEscalationMonitor(io) {
  console.log(`⏱️ [Escalation Service] Monitor active. Checks unpicked orders every 20s (Threshold: ${ESCALATION_MINUTES} mins).`);
  console.log(`📞 [Escalation Service] Admin Phone configured: +91 ${ADMIN_PHONE}`);

  setInterval(async () => {
    try {
      const Order = mongoose.models.Order;
      const thresholdTime = new Date(Date.now() - ESCALATION_MINUTES * 60 * 1000);

      // 1. Query MongoDB if connected
      if (mongoose.connection.readyState === 1 && Order) {
        const delayedOrders = await Order.find({
          status: { $in: ['confirmed', 'preparing'] },
          createdAt: { $lte: thresholdTime },
          isEscalated: { $ne: true },
        }).lean();

        for (const order of delayedOrders) {
          await triggerAdminEscalation(order, io, false);
          await Order.updateOne({ _id: order._id }, { $set: { isEscalated: true, escalatedAt: new Date() } });
        }
      }

      // 2. Query In-Memory Orders Store
      const { inMemoryOrders } = require('../controllers/orderController');
      if (inMemoryOrders && inMemoryOrders.size > 0) {
        for (const [id, order] of inMemoryOrders.entries()) {
          if (!order.isEscalated && (order.status === 'confirmed' || order.status === 'preparing')) {
            const ageMs = Date.now() - new Date(order.createdAt).getTime();
            if (ageMs >= ESCALATION_MINUTES * 60 * 1000) {
              await triggerAdminEscalation(order, io, false);
              order.isEscalated = true;
            }
          }
        }
      }
    } catch (err) {
      // Silently handle any interval error
    }
  }, 20000);
}

module.exports = {
  triggerAdminEscalation,
  initEscalationMonitor,
  ADMIN_PHONE,
  ESCALATION_MINUTES,
};
