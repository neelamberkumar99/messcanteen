/**
 * Comprehensive Database Seed Script for Mess ERP
 * Populates the database with realistic sample data for all modules.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Models
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const FineRule = require('../models/FineRule');
const CanteenItem = require('../models/CanteenItem');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const DietLog = require('../models/DietLog');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGO_URI;

const clearDatabase = async () => {
  console.log('Clearing existing data...');
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
};

const seedDatabase = async () => {
  console.log('Starting seed process...');

  // 1. Create SuperAdmin
  const superAdmin = await User.create({
    name: 'System Controller',
    email: 'superadmin@mess.com',
    password: 'password123',
    role: 'superadmin'
  });

  // 2. Create Admin
  const admin = await User.create({
    name: 'Hostel Warden',
    email: 'admin@mess.com',
    password: 'password123',
    role: 'admin'
  });

  // 3. Create Contractor (Vendor)
  const contractor = await User.create({
    name: 'Culinary Master Vendor',
    email: 'vendor@mess.com',
    password: 'password123',
    role: 'contractor'
  });

  // 4. Create Hostel & Diet Plan
  const hostel = await Hostel.create({
    name: 'North Block Residency',
    address: 'University Campus, Gate 4',
    adminId: admin._id,
    contractorId: contractor._id,
    dietCutoffTime: '22:00',
    inventoryFreezeTime: '08:00',
    dietPricePerDay: 150,
    minDietDays: 15,
    paymentDueDays: 7,
    paymentMethod: {
      provider: 'upi',
      upiId: 'mess@upi',
      gatewayName: 'CampusPay',
      accountName: 'Hostel Mess Fund',
      accountNumber: '9876543210',
      ifsc: 'UNI0001234',
      active: true
    },
    dietPlan: {
      title: 'Premium Nutrition Plan',
      schedule: [
        { day: 'Monday', breakfast: 'Stuffed Paratha & Curd', lunch: 'Rajma Chawal & Salad', dinner: 'Mix Veg & Roti' },
        { day: 'Tuesday', breakfast: 'Poha & Sprouts', lunch: 'Kadahi Paneer & Naan', dinner: 'Aloo Gobi & Roti' },
        { day: 'Wednesday', breakfast: 'Idli Sambar', lunch: 'Veg Biryani & Raita', dinner: 'Dal Tadka & Rice' },
        { day: 'Thursday', breakfast: 'Aloo Poori', lunch: 'Chole Bhature', dinner: 'Seasonal Veg & Roti' },
        { day: 'Friday', breakfast: 'Bread Omelette / Cutlet', lunch: 'Kadi Chawal', dinner: 'Mutter Paneer & Roti' },
        { day: 'Saturday', breakfast: 'Pav Bhaji', lunch: 'Dal Baati Churma', dinner: 'Veg Pulao & Curd' },
        { day: 'Sunday', breakfast: 'Special Pancakes', lunch: 'Sunday Royal Thali', dinner: 'Light Veg Khichdi' }
      ]
    }
  });

  // Link Admin and Contractor to Hostel
  admin.hostelId = hostel._id;
  contractor.hostelId = hostel._id;
  await Promise.all([admin.save(), contractor.save()]);

  // 5. Create Students
  const studentUser1 = await User.create({
    name: 'Neel Kumar',
    email: 'neel@student.com',
    password: 'password123',
    role: 'student',
    hostelId: hostel._id
  });

  const studentUser2 = await User.create({
    name: 'Aditya Singh',
    email: 'aditya@student.com',
    password: 'password123',
    role: 'student',
    hostelId: hostel._id
  });

  const studentUser3 = await User.create({
    name: 'Ishita Roy',
    email: 'ishita@student.com',
    password: 'password123',
    role: 'student',
    hostelId: hostel._id
  });

  // Create Student specific profiles
  const student1 = await Student.create({
    userId: studentUser1._id,
    rollNumber: 'CS2024001',
    roomNumber: 'A-101',
    hostelId: hostel._id,
    dietStatus: true
  });

  const student2 = await Student.create({
    userId: studentUser2._id,
    rollNumber: 'CS2024002',
    roomNumber: 'A-102',
    hostelId: hostel._id,
    dietStatus: true
  });

  // 6. Create Fine Rules
  await FineRule.create({
    hostelId: hostel._id,
    adminId: admin._id,
    slabs: [
      { fromDay: 1, toDay: 3, perDayFine: 10 },
      { fromDay: 4, toDay: 7, perDayFine: 25 },
      { fromDay: 8, toDay: 999, perDayFine: 50 }
    ]
  });

  // 7. Create Canteen Items
  const canteenItems = await CanteenItem.create([
    { contractorId: contractor._id, name: 'Double Cheese Pizza', price: 199, category: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', isAvailable: true },
    { contractorId: contractor._id, name: 'Spiced Paneer Wrap', price: 89, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', isAvailable: true },
    { contractorId: contractor._id, name: 'Classic Cold Coffee', price: 60, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400', isAvailable: true },
    { contractorId: contractor._id, name: 'Veg Hakka Noodles', price: 120, category: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', isAvailable: true },
    { contractorId: contractor._id, name: 'Chocolate Lava Cake', price: 75, category: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400', isAvailable: true },
    { contractorId: contractor._id, name: 'Crispy French Fries', price: 70, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isAvailable: true }
  ]);

  // 8. Create Mock Bills
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const bill1 = await Bill.create({
    studentId: student1._id,
    month,
    year,
    dietCharges: 4500,
    canteenCharges: 259,
    totalBeforeFine: 4759,
    fineAccrued: 0,
    totalAmount: 4759,
    status: 'paid',
    generatedAt: new Date(year, month, 1),
    dueDate: new Date(year, month, 7),
    paidAt: new Date(year, month, 5),
    paidAmount: 4759
  });

  await Bill.create({
    studentId: student2._id,
    month,
    year,
    dietCharges: 4500,
    canteenCharges: 89,
    totalBeforeFine: 4589,
    fineAccrued: 30,
    totalAmount: 4619,
    status: 'unpaid',
    generatedAt: new Date(year, month, 1),
    dueDate: new Date(year, month, 7)
  });

  // 9. Create Mock Payments
  await Payment.create({
    studentId: student1._id,
    billId: bill1._id,
    amount: 4759,
    method: 'upi',
    transactionId: 'TXN-NORTH-0001',
    status: 'success',
    paidAt: new Date(year, month, 5)
  });

  // 10. Create Mock Orders
  await Order.create({
    studentId: student1._id,
    contractorId: contractor._id,
    items: [
      { itemId: canteenItems[0]._id, quantity: 1, price: canteenItems[0].price },
      { itemId: canteenItems[2]._id, quantity: 1, price: canteenItems[2].price }
    ],
    totalAmount: 259,
    status: 'approved',
    approvedAt: new Date()
  });

  await Order.create({
    studentId: student2._id,
    contractorId: contractor._id,
    items: [{ itemId: canteenItems[1]._id, quantity: 1, price: canteenItems[1].price }],
    totalAmount: 89,
    status: 'pending'
  });

  // 11. Create Mock Complaints
  await Complaint.create({
    studentId: student1._id,
    title: 'Water Purifier Not Working',
    description: 'The RO unit on the 2nd floor has been offline for 2 days.',
    category: 'service',
    status: 'open'
  });

  await Complaint.create({
    studentId: student2._id,
    title: 'Dinner Quality',
    description: 'The paneer was slightly stale last night.',
    category: 'food',
    status: 'resolved',
    resolution: 'Vendor notified. Quality check updated.'
  });

  // 12. Create Notifications
  await Notification.create([
    {
      userId: studentUser1._id,
      title: 'Bill Paid Successfully',
      message: 'Your payment of ₹4,759.00 has been verified.',
      type: 'payment'
    },
    {
      userId: studentUser2._id,
      title: 'Due Date Reminder',
      message: 'Please clear your mess dues before the 7th of this month.',
      type: 'payment'
    }
  ]);

  // 13. Create Audit Log
  await AuditLog.create({
    userId: superAdmin._id,
    userRole: 'superadmin',
    action: 'seed_database',
    resource: 'system',
    details: 'Initial comprehensive dataset seeded for Mess ERP.',
    ipAddress: '127.0.0.1'
  });

  console.log('Seed process completed successfully.');
  return {
    users: 6,
    hostels: 1,
    students: 2,
    canteenItems: 6,
    bills: 2,
    orders: 2,
    complaints: 2
  };
};

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    if (process.argv.includes('--clear')) {
      await clearDatabase();
      console.log('Database cleared.');
      process.exit(0);
    }

    await clearDatabase();
    const summary = await seedDatabase();
    
    console.log('-------------------------------------------');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.table(summary);
    console.log('-------------------------------------------');
    console.log('DEMO CREDENTIALS (All use password: password123)');
    console.log('SuperAdmin: superadmin@mess.com');
    console.log('Admin:      admin@mess.com');
    console.log('Vendor:     vendor@mess.com');
    console.log('Student 1:  neel@student.com');
    console.log('Student 2:  aditya@student.com');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
