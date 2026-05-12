
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Hostel = require('./models/Hostel');
const DietLog = require('./models/DietLog');

async function checkData() {
  await mongoose.connect('mongodb+srv://neelambarkumar966_db_user:N12345678%40sn@cluster0.b6185mr.mongodb.net/?appName=Cluster0');
  
  const hostels = await Hostel.find();
  console.log('Hostels:', hostels.length);
  hostels.forEach(h => console.log(`- ${h.name} (_id: ${h._id}, contractorId: ${h.contractorId})`));

  const contractors = await User.find({ role: 'contractor' });
  console.log('Contractors:', contractors.length);
  contractors.forEach(c => console.log(`- ${c.name} (_id: ${c._id}, hostelId: ${c.hostelId})`));

  const students = await Student.find();
  console.log('Students:', students.length);
  const hostelGroups = {};
  students.forEach(s => {
    hostelGroups[s.hostelId] = (hostelGroups[s.hostelId] || 0) + 1;
  });
  console.log('Students by Hostel:', hostelGroups);

  process.exit();
}

checkData();
