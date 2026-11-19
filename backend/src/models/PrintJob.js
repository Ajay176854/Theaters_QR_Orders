const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    theaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'printed', 'failed'],
        message: '{VALUE} is not a valid print status',
      },
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

printJobSchema.index({ theaterId: 1, status: 1 });
printJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PrintJob', printJobSchema);
