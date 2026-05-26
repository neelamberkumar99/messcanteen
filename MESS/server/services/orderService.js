const mongoose = require('mongoose');
const Order = require('../models/Order');
const Student = require('../models/Student');
const User = require('../models/User');
const CanteenItem = require('../models/CanteenItem');

const normalizeItems = (items = []) => {
  const map = new Map();
  for (const raw of items) {
    const itemId = raw.itemId || raw._id || raw.id;
    const quantity = Math.max(1, Number(raw.quantity || 1));
    if (!itemId) continue;
    const key = String(itemId);
    map.set(key, {
      itemId: new mongoose.Types.ObjectId(itemId),
      quantity: (map.get(key)?.quantity || 0) + quantity
    });
  }
  return [...map.values()];
};

const validateOrderItems = async (normalizedItems, contractorId) => {
  if (!normalizedItems.length) {
    throw new Error('At least one item is required');
  }

  const itemIds = normalizedItems.map((item) => item.itemId);
  const foundItems = await CanteenItem.find({
    _id: { $in: itemIds },
    contractorId,
    isAvailable: true
  });

  if (foundItems.length !== itemIds.length) {
    throw new Error('One or more items are unavailable or do not exist');
  }

  const itemMap = new Map(foundItems.map((item) => [String(item._id), item]));
  const orderItems = normalizedItems.map((entry) => {
    const item = itemMap.get(String(entry.itemId));
    if (!item) throw new Error('Invalid item in order');
    return {
      itemId: item._id,
      quantity: entry.quantity,
      price: item.price
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { orderItems, totalAmount };
};

const createOrder = async (studentUserId, items, contractorId, note = '') => {
  const student = await Student.findOne({ userId: studentUserId }).populate('hostelId');
  if (!student) throw new Error('Student not found');

  // If contractorId is not provided, use the one from the student's hostel
  let finalContractorId = contractorId;
  if (!finalContractorId && student.hostelId) {
    finalContractorId = student.hostelId.contractorId;
  }

  if (!finalContractorId) throw new Error('No contractor assigned to student hostel');

  const normalizedItems = normalizeItems(items);
  const { orderItems, totalAmount } = await validateOrderItems(normalizedItems, finalContractorId);

  const order = await Order.create({
    studentId: student._id,
    contractorId: finalContractorId,
    items: orderItems,
    totalAmount,
    status: 'pending',
    createdByContractor: false,
    note
  });

  return order.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } },
    { path: 'contractorId', select: 'name email role hostelId' },
    { path: 'items.itemId', select: 'name price category imageUrl isAvailable' }
  ]);
};

const createOrderByContractor = async (studentUserId, items, contractorId, note = '') => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const normalizedItems = normalizeItems(items);
  const { orderItems, totalAmount } = await validateOrderItems(normalizedItems, contractorId);

  const order = await Order.create({
    studentId: student._id,
    contractorId,
    items: orderItems,
    totalAmount,
    status: 'approved',
    createdByContractor: true,
    note,
    approvedAt: new Date()
  });

  return order.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } },
    { path: 'contractorId', select: 'name email role hostelId' },
    { path: 'items.itemId', select: 'name price category imageUrl isAvailable' }
  ]);
};

const approveOrder = async (orderId, contractorId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (String(order.contractorId) !== String(contractorId)) throw new Error('Forbidden');
  if (order.status !== 'pending') throw new Error('Order already processed');

  // Check stock availability and deduct individually to ensure persistence
  // Only validate stock if it's explicitly set (> 0). 0 or negative means unlimited (not set).
  for (const item of order.items) {
    const canteenItem = await CanteenItem.findById(item.itemId);
    if (!canteenItem) throw new Error('Item not found');
    // Only reject if stock is explicitly set (> 0) AND is less than quantity
    if (canteenItem.dailyStock > 0 && canteenItem.dailyStock < item.quantity) {
      throw new Error(`Insufficient stock for ${canteenItem.name || 'item'}`);
    }
  }

  // Deduct stock: update each item and save
  // Only deduct if stock is explicitly set (> 0). If 0 or negative (unlimited), don't deduct.
  for (const item of order.items) {
    const canteenItem = await CanteenItem.findById(item.itemId);
    if (canteenItem.dailyStock > 0) {
      canteenItem.dailyStock = canteenItem.dailyStock - item.quantity;
      if (canteenItem.dailyStock < 0) canteenItem.dailyStock = 0;
      await canteenItem.save();
    }
  }

  order.status = 'approved';
  order.approvedAt = new Date();
  order.rejectionReason = undefined;
  await order.save();

  return order.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } },
    { path: 'contractorId', select: 'name email role hostelId' },
    { path: 'items.itemId', select: 'name price category imageUrl isAvailable' }
  ]);
};

const rejectOrder = async (orderId, contractorId, reason = '') => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (String(order.contractorId) !== String(contractorId)) throw new Error('Forbidden');
  if (order.status !== 'pending') throw new Error('Only pending orders can be rejected');

  order.status = 'rejected';
  order.rejectedAt = new Date();
  order.rejectionReason = reason || 'Rejected by contractor';
  await order.save();

  return order.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } },
    { path: 'contractorId', select: 'name email role hostelId' },
    { path: 'items.itemId', select: 'name price category imageUrl isAvailable' }
  ]);
};

const getStudentOrders = async (studentUserId, filters = {}) => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 10)));
  const skip = (page - 1) * limit;

  const query = { studentId: student._id };
  if (filters.status) query.status = filters.status;

  if (filters.month && filters.year) {
    const monthIndex = Number(filters.month) - 1;
    const year = Number(filters.year);
    query.createdAt = {
      $gte: new Date(year, monthIndex, 1),
      $lt: new Date(year, monthIndex + 1, 1)
    };
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'contractorId', select: 'name email role hostelId' })
      .populate({ path: 'items.itemId', select: 'name price category imageUrl isAvailable' }),
    Order.countDocuments(query)
  ]);

  return { orders, page, limit, total, totalPages: Math.ceil(total / limit) };
};

const getPendingOrders = async (contractorId) => {
  return Order.find({ contractorId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } })
    .populate({ path: 'contractorId', select: 'name email role hostelId' })
    .populate({ path: 'items.itemId', select: 'name price category imageUrl isAvailable' });
};

const getOrdersByMonth = async (studentUserId, month, year) => {
  const student = await Student.findOne({ userId: studentUserId });
  if (!student) throw new Error('Student not found');

  const monthIndex = Number(month) - 1;
  const yearNumber = Number(year);
  return Order.find({
    studentId: student._id,
    createdAt: {
      $gte: new Date(yearNumber, monthIndex, 1),
      $lt: new Date(yearNumber, monthIndex + 1, 1)
    }
  })
    .sort({ createdAt: -1 })
    .populate({ path: 'contractorId', select: 'name email role hostelId' })
    .populate({ path: 'items.itemId', select: 'name price category imageUrl isAvailable' });
};

const getAllOrders = async (filters = {}) => {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const skip = (page - 1) * limit;

  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.contractorId) query.contractorId = filters.contractorId;
  if (filters.studentId) query.studentId = filters.studentId;
  if (filters.studentIds) query.studentId = { $in: filters.studentIds };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } })
      .populate({ path: 'contractorId', select: 'name email role hostelId' })
      .populate({ path: 'items.itemId', select: 'name price category imageUrl isAvailable' }),
    Order.countDocuments(query)
  ]);

  return { orders, page, limit, total, totalPages: Math.ceil(total / limit) };
};

const getApprovedOrders = async (contractorId) => {
  return Order.find({ contractorId, status: 'approved' })
    .sort({ createdAt: -1 })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email role hostelId' } })
    .populate({ path: 'contractorId', select: 'name email role hostelId' })
    .populate({ path: 'items.itemId', select: 'name price category imageUrl isAvailable' });
};

const getContractorOrderSummary = async (contractorId) => {
  const [totalOrders, pendingOrders, approvedOrders, rejectedOrders, canteenOrders, studentOrders] = await Promise.all([
    Order.countDocuments({ contractorId }),
    Order.countDocuments({ contractorId, status: 'pending' }),
    Order.countDocuments({ contractorId, status: 'approved' }),
    Order.countDocuments({ contractorId, status: 'rejected' }),
    Order.countDocuments({ contractorId, createdByContractor: true }),
    Order.countDocuments({ contractorId, createdByContractor: false })
  ]);

  return {
    totalOrders,
    pendingOrders,
    approvedOrders,
    rejectedOrders,
    canteenOrders,
    studentOrders
  };
};

module.exports = {
  createOrder,
  approveOrder,
  rejectOrder,
  createOrderByContractor,
  getStudentOrders,
  getPendingOrders,
  getApprovedOrders,
  getOrdersByMonth,
  getAllOrders,
  getContractorOrderSummary
};
