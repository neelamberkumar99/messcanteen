const mongoose = require('mongoose');

const DietOffSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  offByStudent: { type: Boolean, default: true }
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, required: true, trim: true },
  roomNumber: { type: String, trim: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  dietStatus: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  dietOffHistory: { type: [DietOffSchema], default: [] },
  joiningDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
