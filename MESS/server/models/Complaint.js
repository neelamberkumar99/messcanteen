const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ['food', 'billing', 'service', 'hygiene', 'staff', 'other'], default: 'other' },
  status: { type: String, enum: ['open', 'inprogress', 'resolved'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
