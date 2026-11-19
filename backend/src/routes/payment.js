const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');

// POST /api/payment/create-order - public (customer initiates payment)
router.post('/create-order', createRazorpayOrder);

// POST /api/payment/verify - public (called after Razorpay checkout)
router.post('/verify', verifyPayment);

module.exports = router;
