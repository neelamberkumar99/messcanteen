const asyncHandler = require('../middlewares/asyncHandler');
const orderService = require('../services/orderService');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');

const placeOrder = asyncHandler(async (req, res) => {
  const studentUserId = req.user.id;
  const { items, contractorId, note } = req.body;
  const order = await orderService.createOrder(studentUserId, items, contractorId, note);
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'PLACE_ORDER',
    resource: 'Order',
    resourceId: order._id,
    details: `Placed order for ₹${order.totalAmount}`,
    ipAddress: req.ip
  });

  // Notify contractor about the new order so contractor clients can refresh
  try {
      const contractorId = order.contractorId;
      const studentName = order.studentId?.userId?.name || 'Student';
      const meta = {
        orderId: order._id,
        studentId: order.studentId?._id,
        studentName,
        totalAmount: order.totalAmount
      };
      await notificationService.sendNotification(
        contractorId,
        'New Canteen Order',
        `New order from ${studentName} for ₹${order.totalAmount}`,
        'order',
        meta
      );
      // Emit socket event to contractor's hostel room so contractor clients get real-time update
      try {
        const io = req.app.get('io');
        if (io) {
          const contractorHostel = order.contractorId?.hostelId || order.studentId?.hostelId || order.studentId?.userId?.hostelId || null;
          if (contractorHostel) {
            io.to(`hostel:${contractorHostel}`).emit('order:update', { action: 'newOrder', order, createdAt: new Date() });
          } else {
            io.emit('order:update', { action: 'newOrder', order, createdAt: new Date() });
          }
        }
      } catch (err) {
        console.warn('Socket emit failed for new order:', err.message || err);
      }
  } catch (err) {
    console.error('Failed to send contractor notification:', err.message || err);
  }

  res.status(201).json({ success: true, order });
});

const approveOrder = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  
  // Check if order exists and is in pending status
  const order = await (async () => {
    try {
      return await orderService.approveOrder(req.params.id, contractorId);
    } catch (err) {
      // Return error response instead of letting it propagate
      if (err.message === 'Order not found') return res.status(404).json({ success: false, message: err.message });
      if (err.message === 'Forbidden') return res.status(403).json({ success: false, message: err.message });
      if (err.message === 'Only pending orders can be approved') return res.status(400).json({ success: false, message: err.message });
      if (err.message && err.message.includes('Insufficient stock')) return res.status(400).json({ success: false, message: err.message });
      throw err;
    }
  })();
  
  if (!order || order.statusCode) return; // Response already sent by error handler
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'APPROVE_ORDER',
    resource: 'Order',
    resourceId: order._id,
    details: `Approved order ${order._id}`,
    ipAddress: req.ip
  });

  // Notify student about approval
  try {
    const studentUserId = order.studentId?.userId?._id || order.studentId?.userId;
    const contractorName = req.user?.name || order.contractorId?.name || 'Contractor';
    const meta = { orderId: order._id, status: 'approved', contractorId: order.contractorId?._id, contractorName };
    await notificationService.sendNotification(
      studentUserId,
      'Your canteen order was approved',
      `Your order ₹${order.totalAmount} has been approved by ${contractorName}.`,
      'order',
      meta
    );
  } catch (err) {
    console.error('Failed to notify student about approval:', err.message || err);
    // Don't fail the request if notification fails
  }

  // Emit real-time update
  try {
    const io = req.app.get('io');
    if (io) {
      // Try to determine the hostel room to emit to (student's hostel or contractor's hostel)
      const hostelId = order.studentId?.hostelId || order.studentId?.userId?.hostelId || order.contractorId?.hostelId || null;
      if (hostelId) {
        io.to(`hostel:${hostelId}`).emit('order:update', {
          action: 'statusChanged',
          order: order,
          status: 'approved',
          updatedAt: new Date()
        });
      } else {
        io.emit('order:update', {
          action: 'statusChanged',
          order: order,
          status: 'approved',
          updatedAt: new Date()
        });
      }
    }
  } catch (err) {
    // ignore socket errors
  }

  res.json({ success: true, order });
});

const rejectOrder = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const { reason } = req.body;
  const order = await orderService.rejectOrder(req.params.id, contractorId, reason);
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'REJECT_ORDER',
    resource: 'Order',
    resourceId: order._id,
    details: `Rejected order ${order._id}. Reason: ${reason}`,
    ipAddress: req.ip
  });

  // Notify student about rejection
  try {
    const studentUserId = order.studentId?.userId?._id || order.studentId?.userId;
    const contractorName = req.user?.name || order.contractorId?.name || 'Contractor';
    const meta = { orderId: order._id, status: 'rejected', contractorId: order.contractorId?._id, contractorName, reason };
    await notificationService.sendNotification(
      studentUserId,
      'Your canteen order was rejected',
      `Your order ₹${order.totalAmount} was rejected by ${contractorName}. Reason: ${reason || 'No reason provided'}.`,
      'order',
      meta
    );
  } catch (err) {
    console.error('Failed to notify student about rejection:', err.message || err);
  }

  // Emit real-time update
  try {
    const io = req.app.get('io');
    if (io) {
      const hostelId = order.studentId?.hostelId || order.studentId?.userId?.hostelId || order.contractorId?.hostelId || null;
      if (hostelId) {
        io.to(`hostel:${hostelId}`).emit('order:update', {
          action: 'statusChanged',
          order: order,
          status: 'rejected',
          updatedAt: new Date()
        });
      } else {
        io.emit('order:update', {
          action: 'statusChanged',
          order: order,
          status: 'rejected',
          updatedAt: new Date()
        });
      }
    }
  } catch (err) {
    // ignore socket errors
  }

  res.json({ success: true, order });
});

const createOrderForStudent = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const { studentId, items, note } = req.body;
  const order = await orderService.createOrderByContractor(studentId, items, contractorId, note);
  
  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'CREATE_ORDER_BY_CONTRACTOR',
    resource: 'Order',
    resourceId: order._id,
    details: `Contractor created order for student ${studentId}`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const studentUserId = req.user.id;
  const { page, limit, month, year, status } = req.query;
  const data = await orderService.getStudentOrders(studentUserId, { page, limit, month, year, status });
  res.json({ success: true, ...data });
});

const getPendingOrders = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const orders = await orderService.getPendingOrders(contractorId);
  res.json({ success: true, orders });
});

const getContractorApprovedOrders = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const orders = await orderService.getApprovedOrders(contractorId);
  res.json({ success: true, orders });
});

const getContractorOrderSummary = asyncHandler(async (req, res) => {
  const contractorId = req.user.id;
  const summary = await orderService.getContractorOrderSummary(contractorId);
  res.json({ success: true, summary });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const Student = require('../models/Student');
  const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
  const studentIds = students.map(s => s._id);

  const filters = { ...req.query, studentIds };
  const data = await orderService.getAllOrders(filters);
  res.json({ success: true, ...data });
});

module.exports = {
  placeOrder,
  approveOrder,
  rejectOrder,
  createOrderForStudent,
  getMyOrders,
  getPendingOrders,
  getContractorApprovedOrders,
  getContractorOrderSummary,
  getAllOrders
};
