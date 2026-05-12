const mongoose = require('mongoose');

const DietLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  mealsOff: [{ type: String }], // e.g. ["Lunch", "Snacks"]
  markedOffAt: { type: Date },
  autoResetAt: { type: Date },
  chargeApplied: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DietLog', DietLogSchema);
