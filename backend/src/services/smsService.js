/**
 * 📲 Grandé Muthuram Multiplex - SMS & Mobile Order Notification Service
 *
 * Supports:
 * 1. Fast2SMS (Free / Developer credits for real Indian SMS without DLT)
 * 2. Open-Source Android SMS Gateway (100% Free Carrier SMS using an Android phone SIM)
 * 3. WhatsApp Direct Digital Receipt (100% Free instant messaging link)
 * 4. Real-time In-App SMS Push Notification Simulator (via Socket.IO)
 */

const axios = require('axios');

/**
 * Format order status into friendly SMS message copy
 */
const formatSMSMessage = (order, status) => {
  const shortId = order.orderId || order.shortId || (order._id ? order._id.slice(-5) : 'ORDER');
  const name = order.customerName ? order.customerName.split(' ')[0] : 'Guest';
  const screen = order.screenNumber || order.screen || 1;
  const seat = order.seatNumber || order.seat || 'A1';
  const total = order.totalAmount || order.total || 0;

  switch (status) {
    case 'confirmed':
      return `🎬 Grandé Muthuram Multiplex: Hi ${name}, your concession order #${shortId} is CONFIRMED for Screen ${screen}, Seat ${seat}. Total: ₹${total}. Delivery directly to your seat shortly!`;
    case 'preparing':
      return `🍿 Grandé Muthuram Concessions: Hi ${name}, order #${shortId} is now PREPARING in the kitchen for Screen ${screen}, Seat ${seat}.`;
    case 'ready':
      return `🚀 Grandé Muthuram Concessions: Order #${shortId} is READY! Staff is on the way to deliver to Screen ${screen}, Seat ${seat}.`;
    case 'delivered':
      return `✨ Grandé Muthuram Multiplex: Order #${shortId} DELIVERED to Screen ${screen}, Seat ${seat}. Enjoy your movie & refreshments!`;
    default:
      return `🎬 Grandé Muthuram Multiplex: Order #${shortId} update: ${status.toUpperCase()} for Seat ${seat}.`;
  }
};

/**
 * Send SMS notification via configured provider or open-source gateway
 */
const sendOrderSMS = async (order, status = 'confirmed', io = null) => {
  try {
    const rawPhone = order.customerPhone || order.phone;
    if (!rawPhone) {
      console.log(`ℹ️ [SMS Service] No phone provided for order #${order.orderId || order._id} — skipping SMS.`);
      return { success: false, reason: 'NO_PHONE' };
    }

    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      console.log(`ℹ️ [SMS Service] Invalid phone length (${cleanPhone}) — skipping SMS.`);
      return { success: false, reason: 'INVALID_PHONE' };
    }

    const messageText = formatSMSMessage(order, status);
    console.log(`\n======================================================`);
    console.log(`📲 [SMS DISPATCH] To: +91 ${cleanPhone} | Status: ${status.toUpperCase()}`);
    console.log(`💬 Message: "${messageText}"`);
    console.log(`======================================================\n`);

    // Provider 1: Fast2SMS (Free Tier / Developer API for Indian numbers)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            route: 'q', // Quick SMS route (No DLT required for dev test)
            message: messageText,
            language: 'english',
            numbers: cleanPhone,
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
            },
            timeout: 5000,
          }
        );
        console.log(`✅ [Fast2SMS] Sent real SMS to +91 ${cleanPhone}:`, response.data?.message || 'Success');
        return { success: true, provider: 'fast2sms', data: response.data };
      } catch (f2sErr) {
        console.warn(`⚠️ [Fast2SMS] Gateway call failed:`, f2sErr.response?.data || f2sErr.message);
      }
    }

    // Provider 2: Open-Source Android SMS Gateway (Self-hosted on any Android phone)
    // E.g., https://github.com/capcom6/android-sms-gateway (runs HTTP REST API on your phone)
    if (process.env.ANDROID_SMS_GATEWAY_URL) {
      try {
        const gatewayRes = await axios.post(
          `${process.env.ANDROID_SMS_GATEWAY_URL}/message`,
          {
            phoneNumbers: [`+91${cleanPhone}`],
            message: messageText,
          },
          {
            headers: process.env.ANDROID_SMS_GATEWAY_TOKEN
              ? { Authorization: `Bearer ${process.env.ANDROID_SMS_GATEWAY_TOKEN}` }
              : {},
            timeout: 5000,
          }
        );
        console.log(`✅ [Android SMS Gateway] Sent carrier SMS via phone SIM:`, gatewayRes.data);
        return { success: true, provider: 'android-gateway', data: gatewayRes.data };
      } catch (gwErr) {
        console.warn(`⚠️ [Android SMS Gateway] Gateway failed:`, gwErr.message);
      }
    }

    // Provider 3: Real-Time In-App Live SMS Push Notification (via Socket.IO)
    // Pops up an authentic SMS notification banner on the customer's device in real-time
    if (io) {
      io.emit('customer-sms-notification', {
        phone: cleanPhone,
        sender: 'GMM-CINEMA',
        message: messageText,
        status,
        orderId: order.orderId || order._id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    return {
      success: true,
      provider: 'in-app-simulator',
      simulated: true,
      phone: cleanPhone,
      message: messageText,
    };
  } catch (error) {
    console.error(`❌ [SMS Service] Unexpected error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a 1-click WhatsApp Digital Bill / Order Link (100% Free)
 */
const getWhatsAppBillLink = (order, origin = 'http://localhost:5173') => {
  const rawPhone = order.customerPhone || order.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
  const shortId = order.orderId || order.shortId || (order._id ? order._id.slice(-5) : 'ORDER');
  const screen = order.screenNumber || order.screen || 1;
  const seat = order.seatNumber || order.seat || 'A1';
  const total = order.totalAmount || order.total || 0;
  const name = order.customerName || 'Valued Guest';
  const orderId = order._id || shortId;
  const trackingUrl = `${origin}/confirmation/${orderId}`;

  // Format itemized lines
  let itemsList = '';
  if (Array.isArray(order.items) && order.items.length) {
    itemsList = order.items
      .map((item) => `• ${item.quantity || 1}x ${item.name || 'Concession'} — ₹${(item.price || 0) * (item.quantity || 1)}`)
      .join('\n');
  } else {
    itemsList = '• Concession Refreshments';
  }

  const receipt =
    `🎬 *GRANDÉ MUTHURAM MULTIPLEX — CONCESSION DIGITAL BILL*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Guest:* ${name}\n` +
    `🎟️ *Token ID:* #${shortId}\n` +
    `📍 *Auditorium:* Screen ${screen} · Seat ${seat}\n` +
    `🕒 *Time:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
    `📋 *ORDER SUMMARY:*\n` +
    `${itemsList}\n\n` +
    `💰 *Total Paid:* ₹${total} (Incl. Taxes)\n` +
    `⚡ *Status:* ${String(order.status || 'Confirmed').toUpperCase()}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *Live Order Tracking:* ${trackingUrl}\n\n` +
    `✨ Delivered directly to your seat during showtime. Enjoy your movie!`;

  return cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(receipt)}`
    : `https://wa.me/?text=${encodeURIComponent(receipt)}`;
};

module.exports = {
  sendOrderSMS,
  formatSMSMessage,
  getWhatsAppBillLink,
};

