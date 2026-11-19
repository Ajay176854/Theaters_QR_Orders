const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true,
      maxlength: [100, 'Theater name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    screens: {
      type: Number,
      required: [true, 'Number of screens is required'],
      min: [1, 'Must have at least 1 screen'],
      max: [50, 'Cannot exceed 50 screens'],
    },
    rows: {
      type: Number,
      required: [true, 'Number of rows per screen is required'],
      min: [1, 'Must have at least 1 row'],
      max: [50, 'Cannot exceed 50 rows'],
    },
    seatsPerRow: {
      type: Number,
      required: [true, 'Seats per row is required'],
      min: [1, 'Must have at least 1 seat per row'],
      max: [100, 'Cannot exceed 100 seats per row'],
    },
    seatingLayout: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    settings: {
      printerIp: {
        type: String,
        default: '',
      },
      autoPrint: {
        type: Boolean,
        default: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

theaterSchema.virtual('totalSeats').get(function () {
  return this.screens * this.rows * this.seatsPerRow;
});

theaterSchema.index({ name: 1 });
theaterSchema.index({ isActive: 1 });

module.exports = mongoose.model('Theater', theaterSchema);
