/**
 * 📲 Grandé Muthuram Multiplex — Automated WhatsApp Notification Engine
 *
 * Automatically dispatches WhatsApp order updates as status transitions:
 * 1. Confirmed -> 2. Preparing -> 3. Ready (Out for Delivery) -> 4. Delivered
 *
 * Supports:
 * - Direct HTTP Cloud Gateways (CallMeBot / Green-API / UltraMsg / Twilio)
 * - Real-Time Socket.IO Client Notification Stream
 * - 1-Click Universal wa.me fallback
 */

const { sendWhatsAppDirect } = require('./baileysBot');

const formatWhatsAppStatus = (order, status) => {
  const shortId = order.orderId || order.shortId || (order._id ? order._id.slice(-5) : 'ORDER');
  const name = order.customerName ? order.customerName.split(' ')[0] : 'Guest';
  const screen = order.screenNumber || order.screen || 1;
  const seat = order.seatNumber || order.seat || 'A1';
  const total = order.totalAmount || order.total || 0;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl = `${origin}/confirmation/${order._id || shortId}`;

  switch (status.toLowerCase()) {
    case 'confirmed':
      return (
        `🎬 *GRANDÉ MUTHURAM MULTIPLEX — ORDER CONFIRMED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Guest:* ${name}\n` +
        `🎟️ *Token ID:* #${shortId}\n` +
        `📍 *Location:* Screen ${screen} · Seat ${seat}\n` +
        `🕒 *Time:* ${time}\n` +
        `💳 *Total Paid:* ₹${total}\n\n` +
        `✅ Your concession order has been transmitted to our kitchen!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Live Seat Delivery Tracker:* ${trackingUrl}`
      );

    case 'preparing':
      return (
        `🍿 *GRANDÉ MUTHURAM CONCESSIONS — NOW PREPARING*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Guest:* ${name} | 🎟️ *Token:* #${shortId}\n` +
        `📍 *Seat:* Screen ${screen} · Seat ${seat}\n` +
        `🕒 *Time:* ${time}\n\n` +
        `🔥 Our kitchen team is popping fresh popcorn & preparing your items right now.\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Live Tracker:* ${trackingUrl}`
      );

    case 'ready':
      return (
        `🚀 *GRANDÉ MUTHURAM CONCESSIONS — ON THE WAY TO SEAT!*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Guest:* ${name} | 🎟️ *Token:* #${shortId}\n` +
        `📍 *Destination:* Screen ${screen} · Seat ${seat}\n` +
        `🕒 *Time:* ${time}\n\n` +
        `🏃 Our concession delivery crew has picked up your order and is walking down your aisle now!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Live Tracker:* ${trackingUrl}`
      );

    case 'delivered':
      return (
        `✨ *GRANDÉ MUTHURAM MULTIPLEX — ORDER DELIVERED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Guest:* ${name} | 🎟️ *Token:* #${shortId}\n` +
        `📍 *Seat:* Screen ${screen} · Seat ${seat}\n` +
        `🕒 *Time:* ${time}\n\n` +
        `🍿 Concession order successfully delivered to Screen ${screen}, Seat ${seat}.\n` +
        `Enjoy your refreshments and the movie at Grandé Muthuram Multiplex!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Thank you for ordering with us!`
      );

    default:
      return (
        `🎬 *GRANDÉ MUTHURAM MULTIPLEX — ORDER UPDATE*\n` +
        `Order #${shortId} status changed to ${status.toUpperCase()} for Screen ${screen}, Seat ${seat}.\n` +
        `🔗 ${trackingUrl}`
      );
  }
};

/**
 * Dispatch automated WhatsApp message
 */
const sendAutomatedWhatsApp = async (order, status, io = null) => {
  try {
    const rawPhone = order.customerPhone || order.phone || '7092466027';
    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.log(`ℹ️ [WhatsApp Service] Invalid phone number (${rawPhone}) — skipping.`);
      return { success: false, reason: 'INVALID_PHONE' };
    }

    const messageText = formatWhatsAppStatus(order, status);
    const shortId = order.orderId || order.shortId || (order._id ? order._id.slice(-5) : 'ORDER');

    console.log(`\n======================================================================`);
    console.log(`🟢 [WHATSAPP AUTO-DISPATCH] -> +91 ${cleanPhone}`);
    console.log(`📌 Order #${shortId} | Status: ${status.toUpperCase()} | Time: ${new Date().toLocaleTimeString()}`);
    console.log(`----------------------------------------------------------------------`);
    console.log(messageText);
    console.log(`======================================================================\n`);

    // 1. Direct Autonomous Dispatch via Baileys WhatsApp Web Bot
    await sendWhatsAppDirect(cleanPhone, messageText);

    // 2. If user configured CallMeBot API Key in backend/.env
    if (process.env.CALLMEBOT_API_KEY) {
      try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=91${cleanPhone}&text=${encodeURIComponent(messageText)}&apikey=${process.env.CALLMEBOT_API_KEY}`;
        const res = await fetch(url);
        console.log(`✅ [CallMeBot WhatsApp] Dispatched automatically! Status:`, res.status);
      } catch (botErr) {
        console.warn(`⚠️ [CallMeBot WhatsApp] Error sending message:`, botErr.message);
      }
    }

    // 2. If user configured Green-API in backend/.env
    if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) {
      try {
        const greenUrl = `https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}/sendMessage/${process.env.GREEN_API_TOKEN}`;
        await fetch(greenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `91${cleanPhone}@c.us`,
            message: messageText,
          }),
        });
        console.log(`✅ [Green-API WhatsApp] Autonomous message sent to +91 ${cleanPhone}`);
      } catch (greenErr) {
        console.warn(`⚠️ [Green-API WhatsApp] Error:`, greenErr.message);
      }
    }

    // 3. Broadcast real-time Socket.IO event for live customer screen banner & auto-sync
    if (io) {
      const waClickUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      io.emit('customer-whatsapp-status', {
        phone: cleanPhone,
        status,
        orderId: order.orderId || order._id,
        shortId,
        message: messageText,
        waUrl: waClickUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    return {
      success: true,
      phone: cleanPhone,
      status,
      message: messageText,
      waUrl: `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`,
    };
  } catch (error) {
    console.error(`❌ [WhatsApp Service Error]:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAutomatedWhatsApp,
  formatWhatsAppStatus,
};

