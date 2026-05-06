const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['Appetizers', 'Mains', 'Desserts', 'Sides', 'Beverages'],
      default: 'Mains',
    },
    dietaryType: {
      type: String,
      enum: ['veg', 'non_veg'],
      default: 'non_veg',
    },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
