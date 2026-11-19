const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const orderUrl = `${frontendUrl}/order?theaterId=${theaterId}&screen=${screen}&seat=${seat}`;

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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const orderUrl = `${frontendUrl}/order?theaterId=${theaterId}&screen=${screen}&seat=${seat}`;

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
