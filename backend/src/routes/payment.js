const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  initiatePaytmUPI,
  handlePaytmWebhook,
  getPaymentStatus,
  simulatePaytmSuccess,
} = require('../controllers/paymentController');

// Razorpay routes
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

// ⚡ Paytm Instant Free UPI Routes
router.post('/paytm-initiate', initiatePaytmUPI);
router.post('/paytm-webhook', handlePaytmWebhook);
router.get('/status/:id', getPaymentStatus);
router.post('/paytm-simulate/:id', simulatePaytmSuccess);

module.exports = router;
