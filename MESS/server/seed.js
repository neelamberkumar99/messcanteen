/**
 * Database Seed Script for Mess ERP
 * Populates the database with initial data for all roles and modules.
 * Demonstrates full multi-tenancy with 2 distinct Hostels.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Hostel = require('./models/Hostel');
const Student = require('./models/Student');
const CanteenItem = require('./models/CanteenItem');
const Order = require('./models/Order');
const Complaint = require('./models/Complaint');
const Bill = require('./models/Bill');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess_erp';

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
      Student.deleteMany({}),
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

    // ---------------------------------------------------------
    // TENANT 1: NORTH BLOCK RESIDENCY
    // ---------------------------------------------------------
    console.log('Seeding Tenant 1: North Block Residency...');
    
    const adminNorth = await User.create({
      name: 'North Admin',
      email: 'admin_north@mess.com',
      password: 'password123',
      role: 'admin'
    });

    const vendorNorth = await User.create({
      name: 'North Vendor',
      email: 'vendor_north@mess.com',
      password: 'password123',
      role: 'contractor'
    });

    const hostelNorth = await Hostel.create({
      name: 'North Block Residency',
      address: 'University Campus, Gate 4',
      adminId: adminNorth._id,
      contractorId: vendorNorth._id,
      dietCutoffTime: '22:00',
      inventoryFreezeTime: '08:00',
      dietPricePerDay: 150,
      dietComponents: [
        { name: 'Breakfast', price: 50, includeInDiet: true, isActive: true, time: '08:00' },
        { name: 'Lunch', price: 50, includeInDiet: true, isActive: true, time: '12:30' },
        { name: 'Dinner', price: 50, includeInDiet: true, isActive: true, time: '19:30' }
      ],
      paymentMethod: {
        provider: 'upi',
        upiId: 'northmess@upi',
        accountName: 'North Hostel Mess Fund'
      },
      dietPlan: {
        title: 'North Weekly Menu',
        schedule: [
          { day: 'Monday', meals: { Breakfast: 'Stuffed Paratha', Lunch: 'Rajma Chawal', Dinner: 'Mix Veg' } },
          { day: 'Tuesday', meals: { Breakfast: 'Poha', Lunch: 'Kadahi Paneer', Dinner: 'Aloo Gobi' } },
          { day: 'Wednesday', meals: { Breakfast: 'Idli Sambar', Lunch: 'Veg Biryani', Dinner: 'Dal Tadka' } },
          { day: 'Thursday', meals: { Breakfast: 'Aloo Poori', Lunch: 'Chole Bhature', Dinner: 'Seasonal Veg' } },
          { day: 'Friday', meals: { Breakfast: 'Bread Omelette', Lunch: 'Kadi Chawal', Dinner: 'Mutter Paneer' } },
          { day: 'Saturday', meals: { Breakfast: 'Pav Bhaji', Lunch: 'Dal Baati Churma', Dinner: 'Veg Pulao' } },
          { day: 'Sunday', meals: { Breakfast: 'Pancakes', Lunch: 'Special Thali', Dinner: 'Light Khichdi' } }
        ]
      }
    });

    // Link North Admin and North Vendor to North Hostel
    await User.findByIdAndUpdate(adminNorth._id, { hostelId: hostelNorth._id });
    await User.findByIdAndUpdate(vendorNorth._id, { hostelId: hostelNorth._id });

    // Create North Students
    const userNeel = await User.create({ name: 'Neel Kumar', email: 'neel@student.com', password: 'password123', role: 'student', hostelId: hostelNorth._id });
    const userAditya = await User.create({ name: 'Aditya Singh', email: 'aditya@student.com', password: 'password123', role: 'student', hostelId: hostelNorth._id });

    const studentNeel = await Student.create({ userId: userNeel._id, rollNumber: 'N101', roomNumber: '101A', hostelId: hostelNorth._id });
    const studentAditya = await Student.create({ userId: userAditya._id, rollNumber: 'N102', roomNumber: '102B', hostelId: hostelNorth._id });

    // North Canteen Items
    const northItems = await CanteenItem.insertMany([
      { contractorId: vendorNorth._id, hostelId: hostelNorth._id, name: 'North Pizza', price: 199, category: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', isAvailable: true },
      { contractorId: vendorNorth._id, hostelId: hostelNorth._id, name: 'North Cold Coffee', price: 60, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400', isAvailable: true }
    ]);

    // North Orders
    await Order.create({
      studentId: studentNeel._id,
      contractorId: vendorNorth._id,
      items: [
        { itemId: northItems[0]._id, price: northItems[0].price, quantity: 1 },
        { itemId: northItems[1]._id, price: northItems[1].price, quantity: 1 }
      ],
      totalAmount: 259,
      status: 'approved'
    });

    // North Complaints
    await Complaint.create({
      studentId: studentAditya._id,
      title: 'Water Quality Issue in North',
      description: 'The water purifier on the 2nd floor is not working properly.',
      category: 'service',
      status: 'open'
    });


    // ---------------------------------------------------------
    // TENANT 2: SOUTH BLOCK RESIDENCY
    // ---------------------------------------------------------
    console.log('Seeding Tenant 2: South Block Residency...');
    
    const adminSouth = await User.create({
      name: 'South Admin',
      email: 'admin_south@mess.com',
      password: 'password123',
      role: 'admin'
    });

    const vendorSouth = await User.create({
      name: 'South Vendor',
      email: 'vendor_south@mess.com',
      password: 'password123',
      role: 'contractor'
    });

    const hostelSouth = await Hostel.create({
      name: 'South Block Residency',
      address: 'University Campus, Gate 8',
      adminId: adminSouth._id,
      contractorId: vendorSouth._id,
      dietCutoffTime: '21:00',
      inventoryFreezeTime: '07:30',
      dietPricePerDay: 160,
      dietComponents: [
        { name: 'Breakfast', price: 60, includeInDiet: true, isActive: true, time: '08:00' },
        { name: 'Lunch', price: 50, includeInDiet: true, isActive: true, time: '12:30' },
        { name: 'Dinner', price: 50, includeInDiet: true, isActive: true, time: '19:30' }
      ],
      paymentMethod: {
        provider: 'upi',
        upiId: 'southmess@upi',
        accountName: 'South Hostel Mess Fund'
      },
      dietPlan: {
        title: 'South Weekly Menu',
        schedule: [
          { day: 'Monday', meals: { Breakfast: 'Dosa', Lunch: 'Sambar Rice', Dinner: 'Rasam' } },
          { day: 'Tuesday', meals: { Breakfast: 'Upma', Lunch: 'Lemon Rice', Dinner: 'Chapati' } },
          { day: 'Wednesday', meals: { Breakfast: 'Pongal', Lunch: 'Curd Rice', Dinner: 'Idli' } },
          { day: 'Thursday', meals: { Breakfast: 'Puri', Lunch: 'Bisi Bele Bath', Dinner: 'Dosa' } },
          { day: 'Friday', meals: { Breakfast: 'Vada', Lunch: 'Tomato Rice', Dinner: 'Uthappam' } },
          { day: 'Saturday', meals: { Breakfast: 'Appam', Lunch: 'Avial', Dinner: 'Kerala Parotta' } },
          { day: 'Sunday', meals: { Breakfast: 'Puttu', Lunch: 'South Special Thali', Dinner: 'Idiyappam' } }
        ]
      }
    });

    // Link South Admin and South Vendor to South Hostel
    await User.findByIdAndUpdate(adminSouth._id, { hostelId: hostelSouth._id });
    await User.findByIdAndUpdate(vendorSouth._id, { hostelId: hostelSouth._id });

    // Create South Students
    const userIshita = await User.create({ name: 'Ishita Roy', email: 'ishita@student.com', password: 'password123', role: 'student', hostelId: hostelSouth._id });
    const userRahul = await User.create({ name: 'Rahul Dev', email: 'rahul@student.com', password: 'password123', role: 'student', hostelId: hostelSouth._id });

    const studentIshita = await Student.create({ userId: userIshita._id, rollNumber: 'S201', roomNumber: '201A', hostelId: hostelSouth._id });
    const studentRahul = await Student.create({ userId: userRahul._id, rollNumber: 'S202', roomNumber: '202B', hostelId: hostelSouth._id });

    // South Canteen Items
    const southItems = await CanteenItem.insertMany([
      { contractorId: vendorSouth._id, hostelId: hostelSouth._id, name: 'South Burger', price: 99, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isAvailable: true },
      { contractorId: vendorSouth._id, hostelId: hostelSouth._id, name: 'South Fresh Juice', price: 50, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400', isAvailable: true }
    ]);

    // South Orders
    await Order.create({
      studentId: studentIshita._id,
      contractorId: vendorSouth._id,
      items: [
        { itemId: southItems[0]._id, price: southItems[0].price, quantity: 2 }
      ],
      totalAmount: 198,
      status: 'pending'
    });

    // South Complaints
    await Complaint.create({
      studentId: studentRahul._id,
      title: 'AC not working in South',
      description: 'The dining hall AC is broken.',
      category: 'service',
      status: 'open'
    });


    // ---------------------------------------------------------
    // Create Initial Bills
    // ---------------------------------------------------------
    console.log('Seeding Initial Bills...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    await Bill.create({
      studentId: studentNeel._id,
      month: currentMonth,
      year: currentYear,
      dietCharges: 4500, // 30 days * 150
      canteenCharges: 259,
      totalDue: 4759,
      status: 'unpaid'
    });

    await Bill.create({
      studentId: studentIshita._id,
      month: currentMonth,
      year: currentYear,
      dietCharges: 4800, // 30 days * 160
      canteenCharges: 198,
      totalDue: 4998,
      status: 'unpaid'
    });

    console.log('-------------------------------------------');
    console.log('DATABASE SEEDED SUCCESSFULLY WITH MULTI-TENANCY!');
    console.log('-------------------------------------------');
    console.log('Use these credentials to login:');
    console.log('SuperAdmin: superadmin@mess.com / password123');
    console.log('');
    console.log('-- NORTH HOSTEL --');
    console.log('Admin:      admin_north@mess.com / password123');
    console.log('Vendor:     vendor_north@mess.com / password123');
    console.log('Student:    neel@student.com / password123');
    console.log('');
    console.log('-- SOUTH HOSTEL --');
    console.log('Admin:      admin_south@mess.com / password123');
    console.log('Vendor:     vendor_south@mess.com / password123');
    console.log('Student:    ishita@student.com / password123');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
