/**
 * Database Seed Script for Mess ERP
 * Populates the database with initial data for all roles and modules.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Hostel = require('./models/Hostel');
const CanteenItem = require('./models/CanteenItem');
const Order = require('./models/Order');
const Complaint = require('./models/Complaint');
const Bill = require('./models/Bill');

const MONGO_URI = process.env.MONGO_URI;

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // 1. Clear Existing Data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      CanteenItem.deleteMany({}),
      Order.deleteMany({}),
      Complaint.deleteMany({}),
      Bill.deleteMany({})
    ]);

    // 2. Create SuperAdmin
    console.log('Seeding SuperAdmin...');
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@mess.com',
      password: 'password123',
      role: 'superadmin'
    });

    // 3. Create Admin
    console.log('Seeding Admin...');
    const admin = await User.create({
      name: 'Hostel Admin',
      email: 'admin@mess.com',
      password: 'password123',
      role: 'admin'
    });

    // 4. Create Contractor (Vendor)
    console.log('Seeding Contractor...');
    const contractor = await User.create({
      name: 'Culinary Arts Vendor',
      email: 'vendor@mess.com',
      password: 'password123',
      role: 'contractor'
    });

    // 5. Create Hostel
    console.log('Seeding Hostel & Diet Plan...');
    const hostel = await Hostel.create({
      name: 'North Block Residency',
      address: 'University Campus, Gate 4',
      adminId: admin._id,
      contractorId: contractor._id,
      dietCutoffTime: '22:00',
      inventoryFreezeTime: '08:00',
      dietPricePerDay: 150,
      paymentMethod: {
        provider: 'upi',
        upiId: 'mess@upi',
        accountName: 'Hostel Mess Fund'
      },
      dietPlan: {
        title: 'Premium Weekly Menu',
        schedule: [
          { day: 'Monday', breakfast: 'Stuffed Paratha & Curd', lunch: 'Rajma Chawal & Salad', dinner: 'Mix Veg & Roti' },
          { day: 'Tuesday', breakfast: 'Poha & Sprouts', lunch: 'Kadahi Paneer & Naan', dinner: 'Aloo Gobi & Roti' },
          { day: 'Wednesday', breakfast: 'Idli Sambar', lunch: 'Veg Biryani & Raita', dinner: 'Dal Tadka & Rice' },
          { day: 'Thursday', breakfast: 'Aloo Poori', lunch: 'Chole Bhature', dinner: 'Seasonal Veg & Roti' },
          { day: 'Friday', breakfast: 'Bread Omelette / Cutlet', lunch: 'Kadi Chawal', dinner: 'Mutter Paneer & Roti' },
          { day: 'Saturday', breakfast: 'Pav Bhaji', lunch: 'Dal Baati Churma', dinner: 'Veg Pulao & Curd' },
          { day: 'Sunday', breakfast: 'Pancakes / Chole Bhature', lunch: 'Special Thali', dinner: 'Light Khichdi' }
        ]
      }
    });

    // Link Admin and Contractor to Hostel
    await User.findByIdAndUpdate(admin._id, { hostelId: hostel._id });
    await User.findByIdAndUpdate(contractor._id, { hostelId: hostel._id });

    // 6. Create Students
    console.log('Seeding Students...');
    const students = await Promise.all([
      User.create({ name: 'Neel Kumar', email: 'neel@student.com', password: 'password123', role: 'student', hostelId: hostel._id }),
      User.create({ name: 'Aditya Singh', email: 'aditya@student.com', password: 'password123', role: 'student', hostelId: hostel._id }),
      User.create({ name: 'Ishita Roy', email: 'ishita@student.com', password: 'password123', role: 'student', hostelId: hostel._id })
    ]);

    // 7. Create Canteen Items
    console.log('Seeding Canteen Items...');
    const canteenItems = await CanteenItem.insertMany([
      { contractorId: contractor._id, name: 'Double Cheese Pizza', price: 199, category: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Spiced Paneer Wrap', price: 89, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Classic Cold Coffee', price: 60, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Veg Hakka Noodles', price: 120, category: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Chocolate Lava Cake', price: 75, category: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Masala Dosa', price: 110, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Crispy French Fries', price: 70, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isAvailable: true },
      { contractorId: contractor._id, name: 'Fresh Fruit Juice', price: 50, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400', isAvailable: true }
    ]);

    // 8. Create Mock Orders for Neel
    console.log('Seeding Mock Orders...');
    await Order.create({
      studentId: students[0]._id,
      items: [
        { itemId: canteenItems[0]._id, name: canteenItems[0].name, price: canteenItems[0].price, quantity: 1 },
        { itemId: canteenItems[2]._id, name: canteenItems[2].name, price: canteenItems[2].price, quantity: 1 }
      ],
      total: 259,
      status: 'fulfilled',
      paymentStatus: 'paid'
    });

    await Order.create({
      studentId: students[0]._id,
      items: [{ itemId: canteenItems[1]._id, name: canteenItems[1].name, price: canteenItems[1].price, quantity: 1 }],
      total: 89,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // 9. Create Mock Complaints
    console.log('Seeding Mock Complaints...');
    await Complaint.create({
      studentId: students[0]._id,
      title: 'Water Quality Issue',
      description: 'The water purifier on the 2nd floor is not working properly.',
      category: 'Maintenance',
      status: 'pending'
    });

    await Complaint.create({
      studentId: students[1]._id,
      title: 'Food Quality',
      description: 'The dinner yesterday was slightly undercooked.',
      category: 'Food',
      status: 'resolved',
      resolution: 'Chef notified and extra quality checks implemented.'
    });

    // 10. Create Initial Bill for Current Month
    console.log('Seeding Initial Bills...');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    await Bill.create({
      studentId: students[0]._id,
      month: currentMonth,
      year: currentYear,
      dietCharges: 4500, // 30 days * 150
      canteenCharges: 348,
      totalDue: 4848,
      status: 'unpaid'
    });

    console.log('-------------------------------------------');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('-------------------------------------------');
    console.log('Use these credentials to login:');
    console.log('SuperAdmin: superadmin@mess.com / password123');
    console.log('Admin:      admin@mess.com / password123');
    console.log('Vendor:     vendor@mess.com / password123');
    console.log('Student:    neel@student.com / password123');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
