const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const DietLog = require('../models/DietLog');
const mongoose = require('mongoose');

// Helper: parse HH:MM string into today's Date object for cutoff
function getCutoffDateForToday(cutoffHHMM) {
  if (!cutoffHHMM) return null;
  const [hh, mm] = cutoffHHMM.split(':').map((v) => parseInt(v, 10));
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  return cutoff;
}

const isDietOffAllowed = async (studentId, hostelId) => {
  // Check cutoff and whether student already turned off diet today
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new Error('Hostel not found');

  const cutoff = getCutoffDateForToday(hostel.dietCutoffTime);
  const now = new Date();
  const beforeCutoff = cutoff ? now < cutoff : true;

  // Check diet log for today
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const existing = await DietLog.findOne({ studentId: new mongoose.Types.ObjectId(studentId), date: { $gte: start, $lt: end } });

  const notAlreadyOff = !existing || existing.isActive === true;

  return { allowed: beforeCutoff && notAlreadyOff, beforeCutoff, existingLog: existing };
};

const calculateDietCharge = async (hostelId, daysActive) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) throw new Error('Hostel not found');
  return (hostel.dietPricePerDay || 0) * (daysActive || 0);
};

const getActiveDietDays = async (studentId, month, year) => {
  // month: 1-12
  const student = await Student.findOne({ userId: studentId });
  if (!student) throw new Error('Student not found');

  const m = month - 1;
  const start = new Date(year, m, 1);
  const end = new Date(year, m + 1, 1);

  // Build a map of dates to logs
  const logs = await DietLog.find({ studentId: student._id, date: { $gte: start, $lt: end } });
  const logMap = new Map(logs.map((l) => [l.date.toDateString(), l]));

  // Iterate days of month
  let daysActive = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const key = d.toDateString();
    if (logMap.has(key)) {
      if (logMap.get(key).isActive) daysActive += 1;
    } else {
      // no log: fallback to student's default dietStatus
      if (student.dietStatus) daysActive += 1;
    }
  }

  return daysActive;
};

module.exports = { isDietOffAllowed, calculateDietCharge, getActiveDietDays };
