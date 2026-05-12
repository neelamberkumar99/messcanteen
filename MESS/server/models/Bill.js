const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  dietCharges: { type: Number, default: 0, min: 0 },
  canteenCharges: { type: Number, default: 0, min: 0 },
  totalBeforeFine: { type: Number, default: 0, min: 0 },
  fineAccrued: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
  generatedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  paidAt: { type: Date },
  paidAmount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema);
