const mongoose = require('mongoose');
const Student = require('../models/Student');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const FineRule = require('../models/FineRule');
const Hostel = require('../models/Hostel');
const Payment = require('../models/Payment');
const { calculateMonthlyDietCharge, calculateApprovedCanteenCharges, generateBillSummary } = require('../utils/billingUtils');
const { calculateFine } = require('../utils/fineCalculator');

/** Get a live (current) bill breakdown for a student without persisting */
const getLiveBill = async (studentUserId) => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const now = new Date();
  const monthIndex = now.getMonth();
  const month = monthIndex + 1;
  const year = now.getFullYear();

  const startOfMonth = new Date(year, monthIndex, 1);
  const startOfNextMonth = new Date(year, monthIndex + 1, 1);

  // Diet charges: count active diet components for the student this month that have passed their time
  const hostel = await Hostel.findById(student.hostelId);
  const DietLog = require('../models/DietLog');
  const logs = await DietLog.find({
    studentId: student._id,
    date: { $gte: startOfMonth, $lt: startOfNextMonth }
  });
  const logMap = new Map(logs.map(l => [l.date.toDateString(), l]));

  let dietCharges = 0;
  let activeUnits = 0; // for tracking consumption

  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  // Loop through all days of the month up to today
  for (let d = new Date(startOfMonth); d <= now; d.setDate(d.getDate() + 1)) {
    const isToday = d.toDateString() === now.toDateString();
    const log = logMap.get(d.toDateString());
    const isActive = log ? log.isActive : student.dietStatus;
    
    if (isActive) {
      (hostel?.dietComponents || []).forEach(comp => {
        if (comp.isActive === false) return;
        if (log?.mealsOff?.includes(comp.name)) return;

        if (!isToday) {
          dietCharges += (comp.price || 0);
          activeUnits++;
        } else {
          const [hh, mm] = (comp.time || '00:00').split(':').map(Number);
          const mealMinutes = hh * 60 + mm;
          if (currentMinutes >= mealMinutes) {
            dietCharges += (comp.price || 0);
            activeUnits++;
          }
        }
      });
    }
  }

  // Canteen charges: sum approved orders for this student in the month
  const orders = await Order.find({
    studentId: student._id,
    status: 'approved',
    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
  });
  const canteenCharges = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  // Accrued fines: sum fineAccrued from unpaid overdue bills
  const unpaidBills = await Bill.find({ studentId: student._id, status: { $ne: 'paid' } });
  const fines = unpaidBills.reduce((s, b) => s + (b.fineAccrued || 0), 0);

  const total = Number(dietCharges + canteenCharges + fines);

  return {
    student: student._id,
    month,
    year,
    diet: { activeUnits, dietCharges },
    canteen: { ordersCount: orders.length, canteenCharges },
    fines,
    total
  };
};

/** Generate a single monthly bill and persist it */
const generateMonthlyBill = async (studentUserId, month, year) => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const hostel = await Hostel.findById(student.hostelId);
  const dueDays = hostel?.paymentDueDays || 7; // default 7 days

  const summary = await generateBillSummary(studentUserId, month, year);

  const generatedAt = new Date();
  const dueDate = new Date(generatedAt);
  dueDate.setDate(dueDate.getDate() + dueDays);

  const bill = new Bill({
    studentId: student._id,
    month,
    year,
    dietCharges: summary.diet.dietCharges || 0,
    canteenCharges: summary.canteen.canteenCharges || 0,
    totalBeforeFine: summary.totalBeforeFine || 0,
    fineAccrued: summary.existingFine || 0,
    totalAmount: (summary.totalBeforeFine || 0) + (summary.existingFine || 0),
    status: 'unpaid',
    generatedAt,
    dueDate
  });

  await bill.save();
  return bill;
};

/** Generate bills for all active students in a hostel */
const generateBillsForAll = async (hostelId, month, year) => {
  const students = await Student.find({ hostelId, });
  const results = [];
  for (const s of students) {
    try {
      const bill = await generateMonthlyBill(s.userId, month, year);
      results.push({ student: s._id, bill });
    } catch (err) {
      results.push({ student: s._id, error: err.message });
    }
  }
  return results;
};

/** Recalculate fines for overdue bills and update them */
const updateFinesForOverdueBills = async () => {
  const now = new Date();
  // Find unpaid bills past dueDate
  const overdueBills = await Bill.find({ status: { $ne: 'paid' }, dueDate: { $lt: now } });
  const updates = [];

  for (const bill of overdueBills) {
    // Get hostel's fine rules; we need student's hostel
    const student = await Student.findById(bill.studentId);
    const hostelId = student?.hostelId;
    const fineRule = await FineRule.findOne({ hostelId }).sort({ effectiveFrom: -1 });
    const slabs = fineRule ? fineRule.slabs : [];

    const { totalFine } = calculateFine(bill.dueDate, slabs, now);

    // Only update if differs
    if ((bill.fineAccrued || 0) !== totalFine) {
      bill.fineAccrued = totalFine;
      bill.totalAmount = (bill.totalBeforeFine || 0) + totalFine;
      await bill.save();
      updates.push({ billId: bill._id, fineAccrued: totalFine });
    }
  }

  return updates;
};

/** Get a daily breakdown of charges for the current month */
const getDailyBreakdown = async (studentUserId) => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const now = new Date();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();

  const startOfMonth = new Date(year, monthIndex, 1);
  const startOfNextMonth = new Date(year, monthIndex + 1, 1);

  // 1. Get Diet Logs
  const DietLog = require('../models/DietLog');
  const dietLogs = await DietLog.find({
    studentId: student._id,
    date: { $gte: startOfMonth, $lt: startOfNextMonth },
    isActive: true
  }).sort({ date: 1 });

  // 2. Get Canteen Orders
  const orders = await Order.find({
    studentId: student._id,
    status: 'approved',
    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
  }).sort({ createdAt: 1 });

  // 3. Get Hostel Diet Price
  const hostel = await Hostel.findById(student.hostelId);
  const dietPrice = (hostel?.dietComponents || [])
    .filter(c => c.isActive !== false)
    .reduce((sum, c) => sum + (c.price || 0), 0);
  const minDiets = hostel?.minDiets || 0;

  // Combine into daily buckets
  const breakdown = {};
  let daysActive = 0;

  // Fill diet charges
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  dietLogs.forEach(log => {
    const day = new Date(log.date).getDate();
    if (!breakdown[day]) breakdown[day] = { date: log.date, diet: 0, canteen: 0, fine: 0, total: 0 };

    const isToday = new Date(log.date).toDateString() === now.toDateString();
    let dailyAmount = 0;

    (hostel?.dietComponents || []).forEach(comp => {
      if (comp.isActive === false) return;
      if (log.mealsOff?.includes(comp.name)) return;

      if (!isToday) {
        dailyAmount += (comp.price || 0);
      } else {
        const [hh, mm] = (comp.time || '00:00').split(':').map(Number);
        const mealMinutes = hh * 60 + mm;
        if (currentMinutes >= mealMinutes) {
          dailyAmount += (comp.price || 0);
        }
      }
    });

    breakdown[day].diet += dailyAmount;
    if (dailyAmount > 0) daysActive++;
  });

  // Fill canteen charges
  orders.forEach(order => {
    const day = new Date(order.createdAt).getDate();
    if (!breakdown[day]) breakdown[day] = { date: order.createdAt, diet: 0, canteen: 0, fine: 0, total: 0 };
    breakdown[day].canteen += (order.totalAmount || 0);
  });

  // Calculate totals for each day
  const dailyRecords = Object.values(breakdown).map(record => ({
    ...record,
    total: record.diet + record.canteen + record.fine
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  // If month is complete (or current view), and daysActive < minDiets, add surcharge row
  if (daysActive < minDiets) {
    const gap = minDiets - daysActive;
    const surcharge = gap * dietPrice;
    dailyRecords.unshift({
      date: new Date(),
      diet: surcharge,
      canteen: 0,
      fine: 0,
      total: surcharge,
      isAdjustment: true,
      label: `Min Diet Surcharge (${gap} diets)`
    });
  }

  return dailyRecords;
};

module.exports = { getLiveBill, generateMonthlyBill, generateBillsForAll, updateFinesForOverdueBills, getDailyBreakdown };
