const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

let razorpayInstance;

if (keyId === 'rzp_test_placeholder') {
  console.warn('⚠️  [Razorpay] No real RAZORPAY_KEY_ID found in .env — using mock mode for local dev.');
  razorpayInstance = {
    orders: {
      create: async (options) => {
        return {
          id: `order_mock_${Date.now()}`,
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          notes: options.notes,
          created_at: Math.floor(Date.now() / 1000),
        };
      },
    },
  };
} else {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

module.exports = razorpayInstance;
