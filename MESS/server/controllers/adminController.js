const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const DietLog = require('../models/DietLog');
const FineRule = require('../models/FineRule');
const ContractorRequest = require('../models/ContractorRequest');
const asyncHandler = require('../middlewares/asyncHandler');
const { calculateFine } = require('../utils/fineCalculator');
const { generateMonthlyBill, updateFinesForOverdueBills } = require('../services/billingService');
const { getActiveDietDays } = require('../utils/dietUtils');
const auditService = require('../services/auditService');

const normalizeOptionalObjectId = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return undefined;
  return value;
};

const getDefaultHostel = async (adminId) => {
  const hostel = await Hostel.findOne({ adminId });
  return hostel || null;
};

const getStudents = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();
  const roomNumber = (req.query.roomNumber || '').trim();
  const dietStatus = req.query.dietStatus;

  const studentQuery = { hostelId: req.user.hostelId };
  if (roomNumber) studentQuery.roomNumber = new RegExp(roomNumber, 'i');
  if (typeof dietStatus !== 'undefined' && dietStatus !== '') {
    studentQuery.dietStatus = dietStatus === 'true';
  }

  if (search) {
    const matchedUsers = await User.find({
      role: 'student',
      $or: [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ]
    }).select('_id');
    const userIds = matchedUsers.map((u) => u._id);
    studentQuery.userId = userIds.length ? { $in: userIds } : { $in: [] };
  }

  const [students, total] = await Promise.all([
    Student.find(studentQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'userId', select: 'name email role hostelId isActive' })
      .populate({ path: 'hostelId', select: 'name paymentDueDays dietCutoffTime dietPricePerDay paymentMethod' }),
    Student.countDocuments(studentQuery)
  ]);

  const enhanced = await Promise.all(students.map(async (student) => {
    try {
      const latestBill = await Bill.findOne({ studentId: student._id }).sort({ year: -1, month: -1 });
      const unpaidBills = await Bill.find({ studentId: student._id, status: { $ne: 'paid' } });
      const billSummary = {
        latestBill,
        unpaidCount: unpaidBills.length,
        dueAmount: unpaidBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
      };
      return { ...student.toObject(), billSummary };
    } catch (billError) {
      console.error('Error calculating bill summary for student:', student._id, billError);
      return { ...student.toObject(), billSummary: { latestBill: null, unpaidCount: 0, dueAmount: 0 } };
    }
  }));

  res.json({
    success: true,
    students: enhanced,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

const getStats = asyncHandler(async (req, res) => {
  // Identify hostel — supports both admin and contractor (vendor) roles
  const profileHostelId = req.user.profile?.hostelId;
  let hostelId = req.query.hostelId
    || (profileHostelId ? String(profileHostelId) : null)
    || req.user.hostelId;
  let hostel = null;

  if (hostelId) {
    hostel = await Hostel.findById(hostelId).catch(() => null);
  }

  // Fallback: find hostel by adminId or contractorId
  if (!hostel) {
    const userId = req.user.profile?._id || req.user.id;
    hostel = await Hostel.findOne({ adminId: userId })
          || await Hostel.findOne({ contractorId: userId });
  }

  if (!hostel) {
    return res.json({
      success: true,
      stats: { totalStudents: 0, totalDietOn: 0, mealStats: {}, activeDiets: 0 }
    });
  }

  // Date Normalization (IST focus)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utc + (330 * 60000)); // UTC+5.5
  const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

  const hostelStudents = await Student.find({ hostelId: hostel._id, isActive: { $ne: false } }).populate('userId', 'isActive hostelId name email');
  const studentIdsAll = hostelStudents.map(s => s._id);

  const [pendingComplaints, unpaidBillsArr] = await Promise.all([
    Complaint.countDocuments({ status: 'open', studentId: { $in: studentIdsAll } }),
    Bill.find({ status: { $ne: 'paid' }, studentId: { $in: studentIdsAll } })
  ]);

  const activeHostelStudents = hostelStudents.filter((student) => student.isActive !== false && student.userId?.isActive !== false);

  const studentIds = activeHostelStudents.map(s => s._id);
  const dietLogs = await DietLog.find({ 
    studentId: { $in: studentIds },
    date: { $gte: today, $lt: new Date(today.getTime() + 24*60*60*1000) } 
  });

  const isStudentDietOn = (student, log) => {
    if (log) return log.isActive !== false;
    return student.dietStatus !== false;
  };
  
  const mealStats = {};
  if (hostel && hostel.dietComponents) {
    hostel.dietComponents.forEach(comp => {
      if (comp.isActive === false) return;
      let activeForMeal = 0;
      activeHostelStudents.forEach(s => {
        const log = dietLogs.find(l => String(l.studentId) === String(s._id));
        const isGlobalOff = !isStudentDietOn(s, log);
        const isMealOff = log?.mealsOff?.includes(comp.name);
        if (!isGlobalOff && !isMealOff) activeForMeal++;
      });
      mealStats[comp.name] = activeForMeal;
    });
  }

  const dietLogsTomorrow = await DietLog.find({ 
    studentId: { $in: studentIds },
    date: { $gte: tomorrow, $lt: dayAfter } 
  });

  const mealStatsTomorrow = {};
  if (hostel && hostel.dietComponents) {
    hostel.dietComponents.forEach(comp => {
      if (comp.isActive === false) return;
      let activeForMeal = 0;
      activeHostelStudents.forEach(s => {
        const log = dietLogsTomorrow.find(l => String(l.studentId) === String(s._id));
        const isGlobalOff = !isStudentDietOn(s, log);
        const isMealOff = log?.mealsOff?.includes(comp.name);
        if (!isGlobalOff && !isMealOff) activeForMeal++;
      });
      mealStatsTomorrow[comp.name] = activeForMeal;
    });
  }

  // Calculate Global ON (Total - Global Off today)
  let totalDietOn = 0;
  activeHostelStudents.forEach(s => {
    const log = dietLogs.find(l => String(l.studentId) === String(s._id));
    if (isStudentDietOn(s, log)) totalDietOn++;
  });

  res.json({ 
    success: true, 
    hostel,
    stats: {
      totalStudents: activeHostelStudents.length,
      totalDietOn,
      pendingComplaints,
      unpaidBills: unpaidBillsArr.length,
      activeDiets: totalDietOn,
      mealStats,
      mealStatsTomorrow,
      dietCutoff: hostel?.dietCutoffTime,
      dietPrice: hostel?.dietPricePerDay
    }
  });
});

const addStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber, roomNumber, hostelId } = req.body;
  const normalizedHostelId = normalizeOptionalObjectId(hostelId);
  // Force hostelId to be the admin's hostelId for strict isolation
  const finalHostelId = req.user.role === 'admin' ? req.user.hostelId : normalizedHostelId;
  
  if (!name || !email || !password || !rollNumber) {
    return res.status(400).json({ success: false, message: 'name, email, password and rollNumber are required' });
  }

  // Validate hostel exists
  if (finalHostelId) {
    const hostel = await Hostel.findById(finalHostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

  const user = await User.create({ name, email, password, role: 'student', hostelId: finalHostelId });
  const student = await Student.create({ userId: user._id, rollNumber, roomNumber, hostelId: finalHostelId });

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'ADD_STUDENT',
    resource: 'Student',
    resourceId: student._id,
    details: `Added student ${name} (${email})`,
    ipAddress: req.ip
  });

  const populatedStudent = await student.populate('userId', 'name email role');
  res.status(201).json({ success: true, user: await User.findById(user._id).select('-password'), student: populatedStudent });
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, rollNumber, roomNumber, hostelId, dietStatus, isActive } = req.body;
  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const user = await User.findById(student.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (typeof name !== 'undefined') user.name = name;
  if (typeof email !== 'undefined') user.email = email;
  if (typeof password !== 'undefined' && password) user.password = password;
  if (typeof hostelId !== 'undefined') {
    const finalHostelId = req.user.role === 'admin' ? req.user.hostelId : hostelId;
    user.hostelId = finalHostelId;
    student.hostelId = finalHostelId;
  }
  if (typeof rollNumber !== 'undefined') student.rollNumber = rollNumber;
  if (typeof roomNumber !== 'undefined') student.roomNumber = roomNumber;
  if (typeof dietStatus !== 'undefined') student.dietStatus = dietStatus;
  if (typeof isActive !== 'undefined') user.isActive = isActive;

  await user.save();
  await student.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_STUDENT',
    resource: 'Student',
    resourceId: student._id,
    details: `Updated student ${user.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, user: await User.findById(user._id).select('-password'), student });
});

const deactivateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  const user = await User.findById(student.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'Student deactivated' });
});

const getContractors = asyncHandler(async (req, res) => {
  const contractors = await User.find({ role: 'contractor', hostelId: req.user.hostelId }).sort({ createdAt: -1 }).select('-password');
  res.json({ success: true, contractors });
});

const addContractor = asyncHandler(async (req, res) => {
  const { name, email, password, hostelId } = req.body;
  const normalizedHostelId = normalizeOptionalObjectId(hostelId);
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }
  // Force hostelId to be the admin's hostelId for strict isolation
  const finalHostelId = req.user.role === 'admin' ? req.user.hostelId : normalizedHostelId;
  
  if (finalHostelId) {
    const hostel = await Hostel.findById(finalHostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

  const user = await User.create({ name, email, password, role: 'contractor', hostelId: finalHostelId });
  
  if (finalHostelId) {
    await Hostel.findByIdAndUpdate(finalHostelId, { contractorId: user._id });
  }

  res.status(201).json({ success: true, user: await User.findById(user._id).select('-password') });
});

const updateContractor = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'contractor' });
  if (!user) return res.status(404).json({ success: false, message: 'Contractor not found' });

  const { name, email, password, hostelId, isActive } = req.body;
  if (typeof name !== 'undefined') user.name = name;
  if (typeof email !== 'undefined') user.email = email;
  if (typeof password !== 'undefined' && password) user.password = password;
  if (typeof hostelId !== 'undefined') {
    const finalHostelId = req.user.role === 'admin' ? req.user.hostelId : hostelId;
    user.hostelId = finalHostelId;
    if (finalHostelId) {
      await Hostel.findByIdAndUpdate(finalHostelId, { contractorId: user._id });
    }
  }
  if (typeof isActive !== 'undefined') user.isActive = isActive;
  await user.save();
  res.json({ success: true, user: await User.findById(user._id).select('-password') });
});

const getStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: 'staff', hostelId: req.user.hostelId }).sort({ createdAt: -1 }).select('-password');
  res.json({ success: true, staff });
});

const addStaff = asyncHandler(async (req, res) => {
  const { name, email, password, hostelId } = req.body;
  const normalizedHostelId = normalizeOptionalObjectId(hostelId);
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }
  // Force hostelId to be the admin's hostelId for strict isolation
  const finalHostelId = req.user.role === 'admin' ? req.user.hostelId : normalizedHostelId;

  if (finalHostelId) {
    const hostel = await Hostel.findById(finalHostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

  const user = await User.create({ name, email, password, role: 'staff', hostelId: finalHostelId });
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'ADD_STAFF',
    resource: 'User',
    resourceId: user._id,
    details: `Added staff member ${name}`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, user: await User.findById(user._id).select('-password') });
});

const updateStaff = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'staff' });
  if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });

  const { name, email, password, hostelId, isActive } = req.body;
  if (typeof name !== 'undefined') user.name = name;
  if (typeof email !== 'undefined') user.email = email;
  if (typeof password !== 'undefined' && password) user.password = password;
  if (typeof hostelId !== 'undefined') {
    user.hostelId = req.user.role === 'admin' ? req.user.hostelId : hostelId;
  }
  if (typeof isActive !== 'undefined') user.isActive = isActive;
  await user.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_STAFF',
    resource: 'User',
    resourceId: user._id,
    details: `Updated staff member ${user.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, user: await User.findById(user._id).select('-password') });
});

const setDietRules = asyncHandler(async (req, res) => {
  const { hostelId, dietCutoffTime, minDiets, dietPlan, dietComponents, dietPricePerDay } = req.body;
  
  // Admins may only update their own hostel
  let finalHostelId = hostelId;
  if (req.user.role === 'admin') {
    finalHostelId = req.user.hostelId || req.user.profile?.hostelId;
  }

  if (!finalHostelId) return res.status(400).json({ success: false, message: 'hostelId is required' });

  const hostel = await Hostel.findById(finalHostelId);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

  if (typeof dietCutoffTime !== 'undefined' && dietCutoffTime) {
    hostel.dietCutoffTime = dietCutoffTime;
  }
  
  if (typeof minDiets !== 'undefined') {
    hostel.minDiets = Number(minDiets);
  }

  if (typeof dietPricePerDay !== 'undefined') {
    hostel.dietPricePerDay = Number(dietPricePerDay);
  }
  
  if (dietComponents && Array.isArray(dietComponents)) {
    hostel.dietComponents = dietComponents;
  }

  if (typeof dietPlan !== 'undefined') {
    if (!hostel.dietPlan) hostel.dietPlan = { title: 'Weekly Plan', schedule: [] };
    if (dietPlan.title) hostel.dietPlan.title = dietPlan.title;
    if (dietPlan.schedule && Array.isArray(dietPlan.schedule)) {
      hostel.dietPlan.schedule = dietPlan.schedule;
    }
    hostel.markModified('dietPlan');
  }

  await hostel.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_DIET_RULES',
    resource: 'Hostel',
    resourceId: hostel._id,
    details: `Updated diet rules for ${hostel.name}`,
    ipAddress: req.ip
  });

  // Emit socket event for real-time sync across all roles
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`hostel:${hostel._id}`).emit('menu:update', { 
        action: 'update', 
        dietPlan: hostel.dietPlan, 
        dietComponents: hostel.dietComponents,
        hostelId: hostel._id 
      });
    }
  } catch (err) {}

  res.json({ success: true, hostel });
});

const setPaymentDueDays = asyncHandler(async (req, res) => {
  const hostelId = req.user.hostelId || req.user.profile?.hostelId;
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found for admin' });
  const { paymentDueDays } = req.body;
  hostel.paymentDueDays = paymentDueDays;
  await hostel.save();
  res.json({ success: true, hostel });
});

const setPaymentMethod = asyncHandler(async (req, res) => {
  const hostelId = req.user.hostelId || req.user.profile?.hostelId;
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found for admin' });
  const { provider, upiId, gatewayName, accountName, accountNumber, ifsc, active } = req.body;
  hostel.paymentMethod = {
    provider: provider || hostel.paymentMethod?.provider || 'upi',
    upiId: upiId ?? hostel.paymentMethod?.upiId ?? '',
    gatewayName: gatewayName ?? hostel.paymentMethod?.gatewayName ?? '',
    accountName: accountName ?? hostel.paymentMethod?.accountName ?? '',
    accountNumber: accountNumber ?? hostel.paymentMethod?.accountNumber ?? '',
    ifsc: ifsc ?? hostel.paymentMethod?.ifsc ?? '',
    active: typeof active === 'boolean' ? active : (hostel.paymentMethod?.active ?? true)
  };
  await hostel.save();
  res.json({ success: true, hostel });
});

const getDietMetrics = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const hostelId = req.query.hostelId;
  // Admins can only query their own hostel metrics
  if (req.user.role === 'admin') {
    const userHostel = req.user.profile?.hostelId;
    if (!userHostel || String(userHostel) !== String(hostelId)) {
      return res.status(403).json({ success: false, message: 'Access denied: not your hostel' });
    }
  }
  const studentQuery = hostelId ? { hostelId } : {};
  const students = await Student.find(studentQuery).select('_id userId hostelId dietStatus');
  const studentIds = students.map((s) => s._id);
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const dietLogs = await DietLog.find({ studentId: { $in: studentIds }, date: { $gte: start, $lt: end } });
  const activeCount = dietLogs.filter((log) => log.isActive).length;
  const offCount = dietLogs.filter((log) => !log.isActive).length;

  const perStudentDays = await Promise.all(students.map(async (student) => ({
    studentId: student._id,
    daysActive: await getActiveDietDays(student.userId, month, year)
  })));
  const avgDietDays = perStudentDays.length ? (perStudentDays.reduce((sum, row) => sum + row.daysActive, 0) / perStudentDays.length) : 0;

  const summaryByDay = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayStart = new Date(year, month - 1, day);
    const dayEnd = new Date(year, month - 1, day + 1);
    const logs = dietLogs.filter((log) => log.date >= dayStart && log.date < dayEnd);
    return {
      day,
      active: logs.filter((log) => log.isActive).length,
      off: logs.filter((log) => !log.isActive).length
    };
  });

  const today = new Date();
  const todaysOffLogs = dietLogs.filter((log) => log.date.toDateString() === today.toDateString() && !log.isActive).length;
  const activeToday = Math.max(0, students.length - todaysOffLogs);

  res.json({
    success: true,
    metrics: {
      avgDietDaysPerStudent: Number(avgDietDays.toFixed(2)),
      offDaysCount: offCount,
      monthlySummary: summaryByDay,
      activeToday
    }
  });
});

const getReports = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const hostelId = req.query.hostelId;
  // Admins can only query reports for their own hostel
  if (req.user.role === 'admin') {
    const userHostel = req.user.profile?.hostelId;
    if (!userHostel || String(userHostel) !== String(hostelId)) {
      return res.status(403).json({ success: false, message: 'Access denied: not your hostel' });
    }
  }
  const studentQuery = hostelId ? { hostelId } : {};
  const students = await Student.find(studentQuery).select('_id');
  const studentIds = students.map((s) => s._id);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [paidBills, unpaidBills, payments, complaints] = await Promise.all([
    Bill.find({ studentId: { $in: studentIds }, status: 'paid', paidAt: { $gte: start, $lt: end } }),
    Bill.find({ studentId: { $in: studentIds }, status: { $ne: 'paid' } }),
    Payment.find({ studentId: { $in: studentIds }, status: 'success', paidAt: { $gte: start, $lt: end } }).sort({ paidAt: -1 }).limit(5).populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } }),
    Complaint.find({ createdAt: { $gte: start, $lt: end }, status: { $in: ['open', 'inprogress'] } })
  ]);

  const monthlyRevenue = paidBills.reduce((sum, bill) => sum + (bill.paidAmount || bill.totalAmount || 0), 0);
  const fineCollected = paidBills.reduce((sum, bill) => sum + (bill.fineAccrued || 0), 0);
  const pendingDues = unpaidBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

  const revenueByMonth = await Bill.aggregate([
    { $match: { studentId: { $in: studentIds }, status: 'paid' } },
    { $group: { _id: { year: '$year', month: '$month' }, revenue: { $sum: '$paidAmount' }, fine: { $sum: '$fineAccrued' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const recentPayments = payments.map((payment) => ({
    _id: payment._id,
    studentName: payment.studentId?.userId?.name,
    amount: payment.amount,
    paidAt: payment.paidAt,
    method: payment.method
  }));

  const totalComplaints = complaints.length;

  res.json({
    success: true,
    reports: {
      monthlyRevenue,
      fineCollected,
      pendingDues,
      complaintCount: totalComplaints,
      paymentCount: payments.length,
      recentPayments,
      revenueByMonth
    }
  });
});

const sendBulkNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'announcement' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required' });
  }
  const students = await User.find({ role: 'student', isActive: true, hostelId: req.user.hostelId }).select('_id');
  const notifications = await Notification.insertMany(students.map((student) => ({
    userId: student._id,
    title,
    message,
    type
  })));
  res.status(201).json({ success: true, notifications });
});

const triggerPaymentReminder = asyncHandler(async (req, res) => {
  const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
  const studentIds = students.map(s => s._id);

  const bills = await Bill.find({ status: { $ne: 'paid' }, studentId: { $in: studentIds } }).populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
  const notifications = await Notification.insertMany(bills.map((bill) => ({
    userId: bill.studentId.userId._id,
    title: 'Payment reminder',
    message: `Your bill of ₹${bill.totalAmount} is pending. Due date: ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}`,
    type: 'payment'
  })));
  res.json({ success: true, notifications });
});

const triggerDueAlert = asyncHandler(async (req, res) => {
  const now = new Date();
  const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
  const studentIds = students.map(s => s._id);

  const bills = await Bill.find({ status: { $ne: 'paid' }, dueDate: { $lt: now }, studentId: { $in: studentIds } }).populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
  const notifications = await Notification.insertMany(bills.map((bill) => ({
    userId: bill.studentId.userId._id,
    title: 'Bill due alert',
    message: `Your bill is overdue by ${Math.ceil((now - bill.dueDate) / (1000 * 60 * 60 * 24))} day(s). Please pay immediately.`,
    type: 'payment'
  })));
  res.json({ success: true, notifications });
});

const getNotificationLog = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;
  const query = {};
  if (req.user.role !== 'admin') {
    query.userId = req.user.id || req.user._id;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email role'),
    Notification.countDocuments(query)
  ]);
  res.json({ success: true, notifications, page, limit, total, totalPages: Math.ceil(total / limit) });
});

const getHostelById = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
  if (req.user.role === 'admin') {
    const userHostel = req.user.profile?.hostelId;
    if (!userHostel || String(userHostel) !== String(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied: not your hostel' });
    }
  }
  res.json({ success: true, hostel });
});

const getContractorRequests = asyncHandler(async (req, res) => {
  const contractors = await User.find({ role: 'contractor', hostelId: req.user.hostelId }).select('_id');
  const contractorIds = contractors.map(c => c._id);
  
  const requests = await ContractorRequest.find({ contractorId: { $in: contractorIds } })
    .populate('contractorId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

const resolveContractorRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const request = await ContractorRequest.findById(id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.status = status || 'resolved';
  request.resolvedBy = req.user.id;
  await request.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'RESOLVE_CONTRACTOR_REQUEST',
    resource: 'ContractorRequest',
    resourceId: request._id,
    details: `Admin resolved contractor request: ${request.title}`,
    ipAddress: req.ip
  });

  // Emit real-time update to all connected clients
  const io = req.app.get('io');
  if (io) {
    const populated = await request.populate('contractorId', 'name email');
    io.emit('request:update', {
      action: 'statusChanged',
      request: populated,
      updatedAt: new Date()
    });
  }

  const populated = await request.populate('contractorId', 'name email');
  res.json({ success: true, request: populated });
});

const getComplaints = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
  const studentIds = students.map(s => s._id);

  const query = { studentId: { $in: studentIds } };
  if (status && ['open', 'inprogress', 'resolved'].includes(status)) {
    query.status = status;
  }

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('studentId', 'rollNumber')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(query)
  ]);
  
  const formattedComplaints = complaints.map(complaint => ({
    ...complaint.toObject(),
    studentName: complaint.studentId?.userId?.name || 'Unknown',
    studentEmail: complaint.studentId?.userId?.email || 'Unknown',
    rollNumber: complaint.studentId?.rollNumber || 'N/A'
  }));

  res.json({ success: true, complaints: formattedComplaints, page, limit, total, totalPages: Math.ceil(total / limit) });
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['open', 'inprogress', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  complaint.status = status;
  if (status === 'resolved') {
    complaint.resolvedBy = req.user.id;
  }
  await complaint.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_COMPLAINT_STATUS',
    resource: 'Complaint',
    resourceId: complaint._id,
    details: `Admin updated complaint status to: ${status}`,
    ipAddress: req.ip
  });

  const populated = await complaint.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
    { path: 'resolvedBy', select: 'name email' }
  ]);

  // Emit real-time update to all connected clients
  const io = req.app.get('io');
  if (io) {
    io.emit('complaint:update', {
      action: 'statusChanged',
      complaint: populated,
      updatedAt: new Date()
    });
  }

  res.json({ success: true, complaint: populated });
});

module.exports = {
  getStats,
  getStudents,
  addStudent,
  updateStudent,
  deactivateStudent,
  getContractors,
  addContractor,
  updateContractor,
  getStaff,
  addStaff,
  updateStaff,
  setDietRules,
  setPaymentDueDays,
  setPaymentMethod,
  getDietMetrics,
  getReports,
  sendBulkNotification,
  triggerPaymentReminder,
  triggerDueAlert,
  getNotificationLog,
  getHostelById,
  getContractorRequests,
  resolveContractorRequest,
  getComplaints,
  resolveComplaint
};
