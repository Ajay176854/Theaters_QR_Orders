const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const getLanIp = require('../utils/getLanIp');

/**
 * Get current Wi-Fi LAN IP & Frontend URL for mobile phone connectivity
 * GET /api/qr/network-info
 */
router.get('/network-info', (req, res) => {
  const lanIp = getLanIp();
  const port = 5173;
  res.json({
    lanIp,
    frontendUrl: `http://${lanIp}:${port}`,
    backendUrl: `http://${lanIp}:${process.env.PORT || 5000}`,
  });
});

/**
 * Generate QR code data URL for a theater/screen/seat
 * GET /api/qr/generate?theaterId=X&screen=Y&seat=Z
 */
router.get('/generate', async (req, res, next) => {
  try {
    const { theaterId, screen, seat } = req.query;

    if (!theaterId || !screen || !seat) {
      return res.status(400).json({ error: 'theaterId, screen, and seat query params are required.' });
    }

    const lanIp = getLanIp();
    const defaultFrontend = `http://${lanIp}:5173`;
    const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? process.env.FRONTEND_URL
      : defaultFrontend;

    const orderUrl = `${frontendUrl}/${theaterId}?screen=${screen}&seat=${seat}`;

    const qrDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    res.json({
      qrDataUrl,
      orderUrl,
      theaterId,
      screen: parseInt(screen, 10),
      seat,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate QR code as PNG image
 * GET /api/qr/image?theaterId=X&screen=Y&seat=Z
 */
router.get('/image', async (req, res, next) => {
  try {
    const { theaterId, screen, seat } = req.query;

    if (!theaterId || !screen || !seat) {
      return res.status(400).json({ error: 'theaterId, screen, and seat query params are required.' });
    }

    const lanIp = getLanIp();
    const defaultFrontend = `http://${lanIp}:5173`;
    const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? process.env.FRONTEND_URL
      : defaultFrontend;
    const orderUrl = `${frontendUrl}/${theaterId}?screen=${screen}&seat=${seat}`;

    res.setHeader('Content-Type', 'image/png');
    await QRCode.toFileStream(res, orderUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
