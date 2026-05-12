// MongoDB Index Migration Script
// Run this once to create indexes for better performance
// Usage: node scripts/createIndexes.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Student = require('../models/Student');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const CanteenItem = require('../models/CanteenItem');
const DietLog = require('../models/DietLog');
const Complaint = require('../models/Complaint');
const Hostel = require('../models/Hostel');

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mess');
    console.log('Connected to MongoDB');

    // User indexes
    console.log('Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ hostelId: 1 });
    await User.collection.createIndex({ isActive: 1 });
    console.log('✓ User indexes created');

    // Student indexes
    console.log('Creating Student indexes...');
    await Student.collection.createIndex({ userId: 1 }, { unique: true });
    await Student.collection.createIndex({ hostelId: 1 });
    await Student.collection.createIndex({ rollNumber: 1 });
    await Student.collection.createIndex({ dietStatus: 1 });
    console.log('✓ Student indexes created');

    // Order indexes
    console.log('Creating Order indexes...');
    await Order.collection.createIndex({ studentId: 1 });
    await Order.collection.createIndex({ contractorId: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ contractorId: 1, status: 1 });
    await Order.collection.createIndex({ studentId: 1, status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    console.log('✓ Order indexes created');

    // Bill indexes
    console.log('Creating Bill indexes...');
    await Bill.collection.createIndex({ studentId: 1 });
    await Bill.collection.createIndex({ status: 1 });
    await Bill.collection.createIndex({ studentId: 1, status: 1 });
    await Bill.collection.createIndex({ year: 1, month: 1 });
    await Bill.collection.createIndex({ dueDate: 1 });
    console.log('✓ Bill indexes created');

    // CanteenItem indexes
    console.log('Creating CanteenItem indexes...');
    await CanteenItem.collection.createIndex({ contractorId: 1 });
    await CanteenItem.collection.createIndex({ isAvailable: 1 });
    console.log('✓ CanteenItem indexes created');

    // DietLog indexes
    console.log('Creating DietLog indexes...');
    await DietLog.collection.createIndex({ studentId: 1 });
    await DietLog.collection.createIndex({ date: 1 });
    await DietLog.collection.createIndex({ studentId: 1, date: 1 });
    console.log('✓ DietLog indexes created');

    // Complaint indexes
    console.log('Creating Complaint indexes...');
    await Complaint.collection.createIndex({ studentId: 1 });
    await Complaint.collection.createIndex({ status: 1 });
    await Complaint.collection.createIndex({ createdAt: -1 });
    console.log('✓ Complaint indexes created');

    // Hostel indexes
    console.log('Creating Hostel indexes...');
    await Hostel.collection.createIndex({ adminId: 1 });
    await Hostel.collection.createIndex({ contractorId: 1 });
    console.log('✓ Hostel indexes created');

    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
};

createIndexes();
