const mongoose = require('mongoose');

const CanteenItemSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  isAvailable: { type: Boolean, default: true },
  availableDate: { type: Date, default: Date.now },
  dailyStock: { type: Number, default: -1, min: -1 } // Daily available quantity; -1 = unlimited (not set)
}, { timestamps: true });

module.exports = mongoose.model('CanteenItem', CanteenItemSchema);
