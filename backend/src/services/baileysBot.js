/**
 * 🤖 Grandé Muthuram Multiplex — Autonomous WhatsApp Web Bot (Baileys)
 *
 * 100% Free & Open-Source WhatsApp Automation
 * Connects directly using WhatsApp Web protocol.
 * Scans QR once -> Sends automated messages to any mobile number with ZERO manual clicks!
 */

const pino = require('pino');
const path = require('path');
const fs = require('fs');
const qrcodeTerminal = require('qrcode-terminal');

let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion;

async function loadBaileys() {
  if (!makeWASocket) {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default || baileys.makeWASocket;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  }
}

let sock = null;
let isConnected = false;
let currentQR = null;
let connecting = false;

const authFolder = path.join(__dirname, '../../.baileys_auth_info');

if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

/**
 * Initialize Baileys WhatsApp Socket
 */
async function initBaileysBot() {
  if (connecting || (sock && isConnected)) return sock;
  connecting = true;

  try {
    await loadBaileys();
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // We handle terminal printing custom with instructions
      logger: pino({ level: 'silent' }), // Suppress internal debug traces
      browser: ['Grandé Muthuram Bot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        console.log(`\n======================================================`);
        console.log(`📲 [WHATSAPP BOT] SCAN QR CODE TO LINK AUTOMATION`);
        console.log(`👉 Open WhatsApp on your phone -> Settings/Menu -> Linked Devices -> Link a Device`);
        console.log(`======================================================\n`);
        qrcodeTerminal.generate(qr, { small: true });
        console.log(`\n======================================================\n`);
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`⚠️ [WhatsApp Bot] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(initBaileysBot, 5000);
        } else {
          console.log(`🔒 [WhatsApp Bot] Logged out. Delete 'database/baileys_auth_info' and restart to scan new QR.`);
          // Clean up old session
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
          } catch {}
          setTimeout(initBaileysBot, 3000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQR = null;
        connecting = false;
        console.log(`\n======================================================`);
        console.log(`✅ [WHATSAPP BOT] CONNECTED & ACTIVE!`);
        console.log(`🚀 Automated WhatsApp order updates are now live.`);
        console.log(`======================================================\n`);
      }
    });

    return sock;
  } catch (err) {
    connecting = false;
    console.error(`❌ [WhatsApp Bot Init Error]:`, err.message);
    return null;
  }
}

/**
 * Send autonomous WhatsApp message to a phone number
 * @param {string} phone - 10 digit Indian number (e.g. 7092466027)
 * @param {string} message - Formatted message text
 */
async function sendWhatsAppDirect(phone, message) {
  try {
    if (!sock || !isConnected) {
      console.log(`⏳ [WhatsApp Bot] Not connected yet — message queued or waiting for QR scan.`);
      return { success: false, reason: 'NOT_CONNECTED' };
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, reason: 'INVALID_PHONE' };
    }

    const jid = `91${cleanPhone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });
    console.log(`\n======================================================`);
    console.log(`✅ [WHATSAPP AUTONOMOUS DISPATCH SUCCESS]`);
    console.log(`📲 Delivered directly to: +91 ${cleanPhone}`);
    console.log(`======================================================\n`);

    return { success: true, phone: cleanPhone };
  } catch (error) {
    console.error(`❌ [WhatsApp Bot Send Error]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Status and QR helpers
 */
function getBotStatus() {
  return {
    isConnected,
    hasQR: Boolean(currentQR),
    qr: currentQR,
  };
}

module.exports = {
  initBaileysBot,
  sendWhatsAppDirect,
  getBotStatus,
};

