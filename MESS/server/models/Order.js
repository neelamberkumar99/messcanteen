const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CanteenItem', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true, default: [] },
  totalAmount: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdByContractor: { type: Boolean, default: false },
  note: { type: String, trim: true },
  rejectionReason: { type: String, trim: true },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
