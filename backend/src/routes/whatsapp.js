const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const { getBotStatus } = require('../services/baileysBot');

/**
 * GET /api/whatsapp/status
 * Check if the autonomous bot is connected
 */
router.get('/status', (req, res) => {
  res.json(getBotStatus());
});

/**
 * GET /api/whatsapp/qr
 * Renders an easy-to-scan QR code page in the browser
 */
router.get('/qr', async (req, res) => {
  const status = getBotStatus();

  if (status.isConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot Connected - Grandé Muthuram Multiplex</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #090a0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
          .card { background: #151824; border: 1.5px solid #10b981; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); max-width: 380px; }
          h2 { color: #34d399; margin: 0 0 0.5rem; }
          p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">✅</div>
          <h2>WhatsApp Bot Connected!</h2>
          <p>Your theater WhatsApp bot is linked and active. Autonomous messages will be sent automatically to customers upon order updates.</p>
        </div>
      </body>
      </html>
    `);
  }

  if (!status.qr) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot - Grandé Muthuram Multiplex</title>
        <meta http-equiv="refresh" content="3">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #090a0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
          .card { background: #151824; border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 16px; max-width: 380px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏳</div>
          <h3>Generating WhatsApp QR...</h3>
          <p style="color: #94a3b8; font-size: 0.85rem;">Refreshing automatically in 3 seconds...</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const qrImage = await qrcode.toDataURL(status.qr, { width: 300, margin: 2 });
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Link Theater WhatsApp - Grandé Muthuram Multiplex</title>
        <meta http-equiv="refresh" content="20">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #090a0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
          .card { background: #151824; border: 1.5px solid rgba(243, 207, 122, 0.4); padding: 2rem; border-radius: 18px; text-align: center; max-width: 380px; box-shadow: 0 12px 40px rgba(0,0,0,0.85); }
          h2 { color: #fae4a8; margin: 0 0 0.5rem; font-size: 1.25rem; }
          p { color: #cbd5e1; font-size: 0.85rem; line-height: 1.4; margin: 0 0 1.25rem; }
          .qr-box { background: #ffffff; padding: 0.75rem; border-radius: 12px; display: inline-block; margin-bottom: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          .qr-box img { display: block; max-width: 100%; height: auto; }
          .steps { text-align: left; background: rgba(0,0,0,0.4); padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.78rem; color: #94a3b8; line-height: 1.6; }
          .steps strong { color: #fff; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>📲 Link WhatsApp Automation</h2>
          <p>Scan this QR code once with WhatsApp to enable 100% automated order dispatch to customers.</p>
          <div class="qr-box">
            <img src="${qrImage}" alt="Scan WhatsApp QR" />
          </div>
          <div class="steps">
            1. Open <strong>WhatsApp</strong> on your phone.<br/>
            2. Tap <strong>Menu (⋮) or Settings</strong>.<br/>
            3. Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>.<br/>
            4. Point your camera at this QR code.
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error rendering QR: ${err.message}`);
  }
});

module.exports = router;

