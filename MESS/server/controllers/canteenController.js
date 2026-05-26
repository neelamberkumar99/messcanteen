const asyncHandler = require('../middlewares/asyncHandler');
const CanteenItem = require('../models/CanteenItem');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const ContractorRequest = require('../models/ContractorRequest');
const User = require('../models/User');
const Student = require('../models/Student');
const auditService = require('../services/auditService');

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};

const isBefore8AM = () => {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
  return now < cutoff;
};

const addItem = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const { name, price, category, imageUrl, isAvailable = true } = req.body;
  if (!name || typeof price === 'undefined') {
    return res.status(400).json({ success: false, message: 'name and price are required' });
  }
  
  // Validate input
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ success: false, message: 'Item name must be 1-100 characters' });
  }
  if (typeof price !== 'number' || price <= 0 || price > 100000) {
    return res.status(400).json({ success: false, message: 'Price must be a number between 0 and 100000' });
  }
  
  // Verify contractor's hostel exists
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) {
    return res.status(403).json({ success: false, message: 'Contractor hostel not found' });
  }

  const item = await CanteenItem.create({
    contractorId,
    hostelId: hostel._id,
    name,
    price,
    category,
    imageUrl,
    isAvailable
  });

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'ADD_CANTEEN_ITEM',
    resource: 'CanteenItem',
    resourceId: item._id,
    details: `Added canteen item ${name}`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, item });
});

const editItem = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const item = await CanteenItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  if (String(item.contractorId) !== String(contractorId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Verify contractor's hostel still exists
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) {
    return res.status(403).json({ success: false, message: 'Contractor hostel not found' });
  }

  const { name, price, category, imageUrl, isAvailable } = req.body;
  if (typeof name !== 'undefined') {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'Item name must be 1-100 characters' });
    }
    item.name = name;
  }
  if (typeof price !== 'undefined') {
    if (typeof price !== 'number' || price <= 0 || price > 100000) {
      return res.status(400).json({ success: false, message: 'Price must be a number between 0 and 100000' });
    }
    item.price = price;
  }
  if (typeof category !== 'undefined') item.category = category;
  if (typeof imageUrl !== 'undefined') item.imageUrl = imageUrl;
  if (typeof isAvailable !== 'undefined') item.isAvailable = isAvailable;

  await item.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_CANTEEN_ITEM',
    resource: 'CanteenItem',
    resourceId: item._id,
    details: `Updated canteen item ${item.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, item });
});

const deleteItem = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const item = await CanteenItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  if (String(item.contractorId) !== String(contractorId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Verify contractor's hostel exists
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) {
    return res.status(403).json({ success: false, message: 'Contractor hostel not found' });
  }

  await item.deleteOne();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'DELETE_CANTEEN_ITEM',
    resource: 'CanteenItem',
    resourceId: item._id,
    details: `Deleted canteen item ${item.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Item deleted' });
});

// Contractor sets availability before 8AM only.
const setAvailability = asyncHandler(async (req, res) => {
  if (!isBefore8AM()) {
    return res.status(403).json({ success: false, message: 'Availability can only be set before 8:00 AM' });
  }

  const contractorId = req.user.id;
  const { items = [] } = req.body; // items: [{ itemId, quantity }]
  const selectedItems = Array.isArray(items) ? items : [];

  if (!selectedItems.length) {
    return res.status(400).json({ success: false, message: 'items array is required' });
  }

  // Validate each item has valid quantity
  for (const item of selectedItems) {
    if (!item.itemId || typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 10000) {
      return res.status(400).json({ success: false, message: 'Each item must have a positive quantity (1-10000)' });
    }
  }

  // First disable all items for this contractor for today
  await CanteenItem.updateMany({ contractorId }, { $set: { isAvailable: false, dailyStock: 0 } });

  // Enable selected items and set stock
  const { start } = getTodayRange();
  for (const { itemId, quantity } of selectedItems) {
    await CanteenItem.updateOne(
      { contractorId, _id: itemId },
      { $set: { isAvailable: true, availableDate: start, dailyStock: quantity } }
    );
  }

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'SET_DAILY_AVAILABILITY',
    resource: 'CanteenInventory',
    details: `Set daily availability for ${selectedItems.length} items`,
    ipAddress: req.ip
  });

  const allItems = await CanteenItem.find({ contractorId }).sort({ category: 1, name: 1 });

  // Emit socket event to notify students of availability change for this contractor's hostel
  try {
    const io = req.app.get('io');
    const hostel = await Hostel.findOne({ contractorId });
    if (io && hostel) {
      io.to(`hostel:${hostel._id}`).emit('menu:update', { action: 'availability', items: allItems, hostelId: hostel._id });
    }
  } catch (err) {
    // ignore socket errors
  }

  res.json({ success: true, items: allItems });
});

const getAvailableItems = asyncHandler(async (req, res) => {
  const { start } = getTodayRange();
  // Filter by user's hostelId
  const hostelId = req.user.hostelId || req.user.profile?.hostelId;
  if (!hostelId) return res.status(400).json({ success: false, message: 'Hostel context missing' });

  const items = await CanteenItem.find({ isAvailable: true, hostelId })
    .sort({ category: 1, name: 1 });
  res.json({ success: true, items, date: start });
});

const getAllItems = asyncHandler(async (req, res) => {
  const hostelId = req.user.hostelId || req.user.profile?.hostelId;
  if (!hostelId) return res.status(400).json({ success: false, message: 'Hostel context missing' });

  const items = await CanteenItem.find({ hostelId }).sort({ category: 1, name: 1 });
  res.json({ success: true, items });
});

const getDietPlan = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found for this contractor' });

  const students = await Student.find({ hostelId: hostel._id, isActive: { $ne: false } }).select('_id dietStatus');
  const baseHeadcount = students.filter(s => s.dietStatus !== false).length;

  res.json({ 
    success: true, 
    dietPlan: hostel.dietPlan || { schedule: [] },
    plan: hostel.dietPlan || { schedule: [] }, // For frontend compatibility
    hostel: {
      _id: hostel._id,
      name: hostel.name,
      dietComponents: hostel.dietComponents,
      dietPricePerDay: hostel.dietPricePerDay,
      dietCutoffTime: hostel.dietCutoffTime,
      typicalHeadcount: baseHeadcount
    }
  });
});

const updateDietPlan = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const { title, schedule, dietComponents, dietPricePerDay, dietCutoffTime } = req.body;

  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

  if (title || schedule) {
    hostel.dietPlan = { 
      title: title || hostel.dietPlan?.title || 'Weekly Plan', 
      schedule: schedule || hostel.dietPlan?.schedule || [] 
    };
    hostel.markModified('dietPlan');
  }

  if (dietComponents) hostel.dietComponents = dietComponents;
  if (typeof dietPricePerDay !== 'undefined') hostel.dietPricePerDay = dietPricePerDay;
  if (dietCutoffTime) hostel.dietCutoffTime = dietCutoffTime;

  await hostel.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_DIET_PLAN',
    resource: 'Hostel',
    resourceId: hostel._id,
    details: `Updated diet plan and rules: ${title || 'Shared Update'}`,
    ipAddress: req.ip
  });

  // Emit socket event to notify students in this hostel about diet plan update
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

  res.json({ success: true, dietPlan: hostel.dietPlan, hostel });
});

const getComplaints = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  
  // Find the hostel for this contractor
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) {
    return res.json({ success: true, complaints: [] });
  }

  // Find all students in this hostel
  const students = await Student.find({ hostelId: hostel._id });
  const studentIds = students.map(s => s._id);

  // Get complaints from students in this hostel
  const complaints = await Complaint.find({ studentId: { $in: studentIds } })
    .populate({ path: 'studentId', select: 'userId rollNumber roomNumber', populate: { path: 'userId', select: 'name email' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, complaints });
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id);
  
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
  
  complaint.status = 'resolved';
  complaint.resolvedBy = req.user.id;
  await complaint.save();

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'RESOLVE_COMPLAINT',
    resource: 'Complaint',
    resourceId: complaint._id,
    details: `Resolved complaint: ${complaint.title}`,
    ipAddress: req.ip
  });

  res.json({ success: true, complaint });
});

const getContractorRequests = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const requests = await ContractorRequest.find({ contractorId }).sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

const createContractorRequest = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  const request = await ContractorRequest.create({
    contractorId,
    title,
    description
  });

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'CREATE_CONTRACTOR_REQUEST',
    resource: 'ContractorRequest',
    resourceId: request._id,
    details: `Created request to admin: ${title}`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, request });
});

const searchStudents = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const contractorId = req.user.id;

  // Find the hostel for this contractor to filter students
  const hostel = await Hostel.findOne({ contractorId });
  if (!hostel) return res.json({ success: true, students: [] });

  let students;
  if (!search) {
    // If no search, return all students in this hostel
    students = await Student.find({ hostelId: hostel._id })
      .populate('userId', 'name email role isActive')
      .sort({ 'userId.name': 1 });
  } else {
    // Search with query
    const matchedUsers = await User.find({
      role: 'student',
      $or: [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ]
    }).select('_id');
    
    const userIds = matchedUsers.map(u => u._id);

    students = await Student.find({
      hostelId: hostel._id,
      $or: [
        { userId: { $in: userIds } },
        { rollNumber: new RegExp(search, 'i') },
        { roomNumber: new RegExp(search, 'i') }
      ]
    }).populate('userId', 'name email role isActive');
  }

  res.json({ success: true, students });
});

module.exports = {
  addItem,
  editItem,
  deleteItem,
  setAvailability,
  getAvailableItems,
  getAllItems,
  getDietPlan,
  updateDietPlan,
  getComplaints,
  resolveComplaint,
  getContractorRequests,
  createContractorRequest,
  searchStudents
};
