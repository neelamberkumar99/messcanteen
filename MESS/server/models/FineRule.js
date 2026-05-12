const mongoose = require('mongoose');

const SlabSchema = new mongoose.Schema({
  fromDay: { type: Number, required: true, min: 0 },
  toDay: { type: Number, required: true, min: 0 },
  perDayFine: { type: Number, required: true, min: 0 }
}, { _id: false });

const FineRuleSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slabs: { type: [SlabSchema], default: [] },
  effectiveFrom: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FineRule', FineRuleSchema);
