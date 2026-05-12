const mongoose = require('mongoose');
const DietLog = require('../models/DietLog');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const { isDietOffAllowed } = require('../utils/dietUtils');

// Toggle diet off for today for a student
const toggleDietOff = async (studentId, hostelId) => {
  const student = await Student.findOne({ userId: studentId });
  if (!student) throw new Error('Student not found');

  const { allowed, beforeCutoff, existingLog } = await isDietOffAllowed(student._id, hostelId);
  if (!allowed) {
    if (!beforeCutoff) throw new Error('Cutoff time passed; cannot turn off diet for today');
    throw new Error('Diet already turned off for today');
  }

  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Create DietLog with isActive false and schedule autoResetAt for next day 00:00
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const autoResetAt = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 0, 0, 0);

  const log = await DietLog.create({
    studentId: student._id,
    date,
    isActive: false,
    markedOffAt: new Date(),
    autoResetAt,
    chargeApplied: false
  });

  return log;
};

const getDietStatus = async (studentId) => {
  const student = await Student.findOne({ userId: studentId }).populate('hostelId');
  if (!student) throw new Error('Student not found');

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const startTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const endTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);

  const [logToday, logTomorrow] = await Promise.all([
    DietLog.findOne({ studentId: student._id, date: { $gte: startToday, $lt: endToday } }),
    DietLog.findOne({ studentId: student._id, date: { $gte: startTomorrow, $lt: endTomorrow } })
  ]);

  return { 
    status: logToday ? logToday.isActive : student.dietStatus, 
    mealsOff: logToday ? logToday.mealsOff : [],
    tomorrow: {
      status: logTomorrow ? logTomorrow.isActive : student.dietStatus,
      mealsOff: logTomorrow ? logTomorrow.mealsOff : []
    },
    logToday, 
    logTomorrow,
    hostel: student.hostelId,
    cutoffTime: student.hostelId?.dietCutoffTime || null 
  };
};

const getDietHistory = async (studentId, month, year) => {
  const m = month - 1;
  const start = new Date(year, m, 1);
  const end = new Date(year, m + 1, 1);
  const student = await Student.findOne({ userId: studentId });
  if (!student) throw new Error('Student not found');

  const logs = await DietLog.find({ studentId: student._id, date: { $gte: start, $lt: end } }).sort({ date: 1 });
  return logs;
};

// Auto-reset diets that have autoResetAt <= now
const autoResetDiets = async () => {
  const now = new Date();
  const toReset = await DietLog.find({ isActive: false, autoResetAt: { $lte: now } });
  const results = [];
  for (const log of toReset) {
    log.isActive = true;
    log.autoResetAt = now; // mark reset time
    await log.save();
    results.push(log);
  }
  return results;
};

module.exports = { toggleDietOff, getDietStatus, getDietHistory, autoResetDiets };
