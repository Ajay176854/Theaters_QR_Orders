const mongoose = require('mongoose');
const generateOrderId = require('../utils/generateOrderId');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [20, 'Quantity cannot exceed 20'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    theaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater ID is required'],
      index: true,
    },
    screenNumber: {
      type: Number,
      required: [true, 'Screen number is required'],
      min: 1,
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    customerName: {
      type: String,
      trim: true,
      required: [true, 'Customer name is mandatory for in-seat delivery'],
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ theaterId: 1, status: 1 });
orderSchema.index({ theaterId: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const id = generateOrderId();
      const existing = await mongoose.model('Order').findOne({ orderId: id });
      if (!existing) {
        this.orderId = id;
        unique = true;
      }
      attempts++;
    }
    if (!unique) {
      return next(new Error('Failed to generate unique order ID'));
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
