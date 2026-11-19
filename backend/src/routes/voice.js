const express = require('express');
const router = express.Router();
const { generateTwimlResponse, initiateAutomatedVoiceCall } = require('../services/voiceCallService');

/**
 * Twilio Webhook for IVR DTMF Keypad responses (e.g., user presses '1' to repeat details)
 */
router.post('/ivr-webhook', (req, res) => {
  const digits = req.body.Digits || req.query.Digits;
  const orderId = req.query.orderId || 'GMM-ORDER';

  console.log(`📞 [IVR Webhook] Key pressed: "${digits}" for order: ${orderId}`);

  // Fake details or lookup details if needed
  const details = {
    shortId: orderId,
    screen: req.query.screen || 1,
    seat: req.query.seat || 'A1',
    customer: req.query.customer || 'Patron',
    elapsedMin: 5,
    itemsList: req.query.items || 'Concession Refreshments',
    total: req.query.total || 0,
    adminPhone: '7092466027',
  };

  const twiml = generateTwimlResponse(details, digits);
  res.type('text/xml');
  res.send(twiml);
});

/**
 * Trigger outbound call to admin
 */
router.post('/call-admin', async (req, res) => {
  try {
    const io = req.app.get('io');
    const orderDetails = req.body.order || {
      shortId: req.body.orderId || 'GMM-M74LPF',
      screen: req.body.screen || 1,
      seat: req.body.seat || 'A1',
      customer: req.body.customer || 'Ajai',
      customerPhone: req.body.customerPhone || '7092466027',
      itemsList: req.body.items || 'Concession Items',
      total: req.body.total || 231,
      elapsedMin: 5,
      adminPhone: req.body.adminPhone || '7092466027',
    };

    const result = await initiateAutomatedVoiceCall(orderDetails, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
