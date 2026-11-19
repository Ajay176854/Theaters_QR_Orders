const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    theaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: ['Snacks', 'Beverages', 'Combos', 'Desserts', 'Main Course', 'Sides', 'Other'],
        message: '{VALUE} is not a valid category',
      },
    },
    image: {
      type: String,
      default: '',
    },
    available: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

menuSchema.index({ theaterId: 1, category: 1 });
menuSchema.index({ theaterId: 1, available: 1 });

module.exports = mongoose.model('Menu', menuSchema);
