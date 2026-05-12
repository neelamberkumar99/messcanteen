const asyncHandler = require('../middlewares/asyncHandler');
const billingService = require('../services/billingService');
const Bill = require('../models/Bill');
const Student = require('../models/Student');
const auditService = require('../services/auditService');

const getLiveBill = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const data = await billingService.getLiveBill(userId);
  res.json({ success: true, data });
});

const getDailyBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const data = await billingService.getDailyBreakdown(userId);
  res.json({ success: true, data });
});

const getBillHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const student = await Student.findOne({ userId });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  const bills = await Bill.find({ studentId: student._id }).sort({ year: -1, month: -1 });
  res.json({ success: true, bills });
});

const getBillById = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const bill = await Bill.findById(billId);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  // If student, ensure ownership
  if (req.user.role === 'student') {
    const userId = req.user.id;
    const student = await Student.findOne({ userId });
    if (!student || !student._id.equals(bill.studentId)) return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  res.json({ success: true, bill });
});

const generateMonthlyBills = asyncHandler(async (req, res) => {
  const { hostelId, month, year } = req.body;
  if (!hostelId || !month || !year) return res.status(400).json({ success: false, message: 'hostelId, month and year required' });

  // Admins can only generate bills for their own hostel
  if (req.user.role === 'admin') {
    const userHostel = req.user.profile?.hostelId;
    if (!userHostel || String(userHostel) !== String(hostelId)) {
      return res.status(403).json({ success: false, message: 'Access denied: not your hostel' });
    }
  }
  const results = await billingService.generateBillsForAll(hostelId, month, year);
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'GENERATE_BILLS',
    resource: 'Bill',
    details: `Generated monthly bills for ${month}/${year} in hostel ${hostelId}. Total results: ${results.length}`,
    ipAddress: req.ip
  });

  res.json({ success: true, results });
});

const updateFines = asyncHandler(async (req, res) => {
  const updates = await billingService.updateFinesForOverdueBills();
  res.json({ success: true, updates });
});

const getAllStudentBills = asyncHandler(async (req, res) => {
  const { hostelId } = req.query;
  if (!hostelId) return res.status(400).json({ success: false, message: 'hostelId required' });
  
  // Verify contractor belongs to this hostel (if contractor role)
  if (req.user.role === 'contractor') {
    const hostel = await Hostel.findOne({ _id: hostelId, contractorId: req.user.id });
    if (!hostel) return res.status(403).json({ success: false, message: 'Forbidden - not contractor for this hostel' });
  }
  
  const students = await Student.find({ hostelId });
  const studentIds = students.map((s) => s._id);
  const bills = await Bill.find({ studentId: { $in: studentIds } }).sort({ year: -1, month: -1 });
  res.json({ success: true, bills });
});

module.exports = { getLiveBill, getDailyBreakdown, getBillHistory, getBillById, generateMonthlyBills, updateFines, getAllStudentBills };
