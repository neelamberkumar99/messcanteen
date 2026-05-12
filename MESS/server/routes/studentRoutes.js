const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isStudent } = require('../middlewares/roleGuard');
const asyncHandler = require('../middlewares/asyncHandler');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const auditService = require('../services/auditService');
const { validateComplaint } = require('../middlewares/validation');

// Student get their complaints
router.get('/complaint', verifyToken, isStudent, asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }
  const complaints = await Complaint.find({ studentId: student._id }).sort({ createdAt: -1 });
  res.status(200).json(complaints);
}));

// Student submit complaint
router.post('/complaint', verifyToken, isStudent, asyncHandler(async (req, res) => {
  const studentUserId = req.user.id;
  const { title, subject, category, description } = req.body;

  // Support both 'title' and 'subject' field names for frontend compatibility
  const complaintTitle = title || subject;

  if (!complaintTitle || !category || !description) {
    return res.status(400).json({ success: false, message: 'Title/Subject, category, and description are required' });
  }

  // Validate complaint fields
  if (!validateComplaint(complaintTitle, description)) {
    return res.status(400).json({ success: false, message: 'Title must be 1-200 characters and description must be 1-5000 characters' });
  }

  // Validate category enum
  const validCategories = ['food', 'billing', 'service', 'hygiene', 'staff', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
  }

  const student = await Student.findOne({ userId: studentUserId });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const complaint = await Complaint.create({
    studentId: student._id,
    title: complaintTitle,
    category,
    description,
    status: 'open'
  });

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'SUBMIT_COMPLAINT',
    resource: 'Complaint',
    resourceId: complaint._id,
    details: `Student submitted complaint: ${complaintTitle}`,
    ipAddress: req.ip
  });

  res.status(201).json({ 
    success: true, 
    complaint,
    message: 'Complaint submitted successfully. We will look into it.' 
  });
}));

module.exports = router;
