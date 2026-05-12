const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Bill = require('../models/Bill');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcrypt');

// Get all admins across hostels
const getAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, hostelId } = req.query;
  const skip = (page - 1) * limit;

  const query = { role: 'admin', isActive: true };
  if (hostelId) query.hostelId = hostelId;

  const admins = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('hostelId', 'name')
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: admins,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

// Create admin
const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, name, hostelId } = req.body;

  if (!email || !password || !name || !hostelId) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, name, and hostelId are required'
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Check if hostel exists
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return res.status(404).json({
      success: false,
      message: 'Hostel not found'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    email,
    password,
    role: 'admin',
    hostelId,
    name
  });

  await user.save();

  // Log action
  await AuditLog.create({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'created_admin',
    resource: 'admin',
    resourceId: user._id,
    details: `Created admin ${name} for hostel ${hostel.name}`,
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Deactivate admin
const deactivateAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await User.findByIdAndUpdate(
    adminId,
    { isActive: false },
    { new: true }
  );

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Log action
  await AuditLog.create({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'deactivated_admin',
    resource: 'admin',
    resourceId: admin._id,
    details: `Deactivated admin ${admin.name}`,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Admin deactivated successfully'
  });
});

// Get audit log
const getAuditLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, action, startDate, endDate } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (role) query.userRole = role;
  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  const total = await AuditLog.countDocuments(query);

  res.json({
    success: true,
    logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

// Publish announcement
const publishAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, target = 'all' } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required'
    });
  }

  let userIds = [];

  if (target === 'all') {
    // All active users
    const users = await User.find({ isActive: true }).select('_id');
    userIds = users.map(u => u._id);
  } else if (target === 'students') {
    // All students
    const students = await Student.find({ isActive: true }).populate('userId', '_id');
    userIds = students.map(s => s.userId._id);
  } else if (target === 'admins') {
    // All admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    userIds = admins.map(a => a._id);
  } else if (target.startsWith('hostel:')) {
    // Specific hostel
    const hostelId = target.split(':')[1];
    const hostelUsers = await User.find({ hostelId, isActive: true }).select('_id');
    userIds = hostelUsers.map(u => u._id);
  }

  // Send notifications
  await notificationService.sendBulkNotification(userIds, title, message, 'announcement');

  // Log action
  await AuditLog.create({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'published_announcement',
    resource: 'announcement',
    details: `Published announcement to ${target}: ${title}`,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Announcement published successfully',
    data: {
      recipientCount: userIds.length,
      target
    }
  });
});

// Get system stats
const getSystemStats = asyncHandler(async (req, res) => {
  const totalHostels = await Hostel.countDocuments();
  const totalStudents = await Student.countDocuments({ isActive: { $ne: false } });
  const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
  
  // Get total revenue from bills
  const billStats = await Bill.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
  ]);
  const totalRevenue = billStats[0]?.totalRevenue || 0;
  const totalBills = billStats[0]?.count || 0;

  // Get active bills (unpaid)
  const activeBills = await Bill.countDocuments({ status: 'unpaid' });

  // Get pending complaints
  const pendingComplaints = await Complaint.countDocuments({ status: { $in: ['open', 'in-progress'] } });

  res.json({
    success: true,
    data: {
      totalHostels,
      totalStudents,
      totalAdmins,
      totalBills,
      totalRevenue,
      activeBills,
      pendingComplaints
    }
  });
});

module.exports = {
  getAdmins,
  createAdmin,
  deactivateAdmin,
  getAuditLog,
  publishAnnouncement,
  getSystemStats
};
