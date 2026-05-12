const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['upi', 'cash', 'online'], required: true },
  transactionId: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
