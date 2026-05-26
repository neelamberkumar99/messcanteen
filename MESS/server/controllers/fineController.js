const asyncHandler = require('../middlewares/asyncHandler');
const auditService = require('../services/auditService');
const FineRule = require('../models/FineRule');
const Bill = require('../models/Bill');
const { calculateFine } = require('../utils/fineCalculator');

const getFineRules = asyncHandler(async (req, res) => {
  let { hostelId } = req.query;
  
  // If no hostelId provided, use the requesting user's hostel
  if (!hostelId) {
    hostelId = req.user.hostelId || req.user.profile?.hostelId;
    if (!hostelId) return res.status(400).json({ success: false, message: 'hostelId required or user must have a hostel' });
  }
  
  const rules = await FineRule.find({ hostelId }).sort({ effectiveFrom: -1 });
  res.json({ success: true, rules });
});

const setFineRules = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const hostelId = req.user.hostelId || req.user.profile?.hostelId || req.body.hostelId;
  const { slabs, effectiveFrom } = req.body;
  
  if (!hostelId || !adminId || !Array.isArray(slabs)) return res.status(400).json({ success: false, message: 'hostelId, adminId and slabs required' });
  const rule = new FineRule({ hostelId, adminId, slabs, effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date() });
  await rule.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'SET_FINE_RULES',
    resource: 'FineRule',
    resourceId: rule._id,
    details: `Updated fine slabs for hostel ${hostelId}`,
    ipAddress: req.ip
  });

  res.json({ success: true, rule });
});

const getFineBreakdown = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const bill = await Bill.findById(billId);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  const studentId = bill.studentId;
  // Find the most applicable FineRule for student's hostel — naive: one rule per hostel
  const fineRule = await FineRule.findOne({ hostelId: bill.hostelId }).sort({ effectiveFrom: -1 });
  const slabs = fineRule ? fineRule.slabs : [];

  const breakdown = calculateFine(bill.dueDate, slabs, new Date());
  res.json({ success: true, breakdown });
});

module.exports = { getFineRules, setFineRules, getFineBreakdown };
