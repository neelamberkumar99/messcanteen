const dietService = require('../services/dietService');
const asyncHandler = require('../middlewares/asyncHandler');
const Hostel = require('../models/Hostel');
const auditService = require('../services/auditService');

const getDietStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const data = await dietService.getDietStatus(userId);
  res.json({ success: true, data });
});

const toggleDietOff = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const hostelId = req.user.profile?.hostelId || req.body.hostelId;

  const student = await require('../models/Student').findOne({ userId: userId }).populate('userId', 'name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const hostel = await Hostel.findById(hostelId || student.hostelId);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

  // "One diet before" rule: 
  // If user wants to turn off TODAY, it must be before the FIRST meal's cutoff.
  // Actually, usually it means you must inform 1 day prior or by early morning.
  const cutoff = hostel.dietCutoffTime || '08:00';
  const [hh, mm] = cutoff.split(':').map(Number);
  
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const currentMinutes = ist.getHours() * 60 + ist.getMinutes();
  const cutoffMinutes = hh * 60 + mm;

  if (currentMinutes > cutoffMinutes) {
    return res.status(400).json({ 
      success: false, 
      message: 'Rule: Diet off allowed one diet before only. Cutoff time for today has passed.' 
    });
  }

  const log = await dietService.toggleDietOff(userId, hostel._id);
  
  // Notify Vendor
  if (hostel && hostel.contractorId) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: hostel.contractorId,
      title: 'Diet Toggle Alert',
      message: `${student.userId?.name || 'A student'} has turned OFF their diet for today.`,
      type: 'diet'
    });
  }

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'TOGGLE_DIET_OFF',
    resource: 'DietLog',
    resourceId: log._id,
    details: 'Student manually turned off diet for today',
    ipAddress: req.ip
  });

  res.json({ success: true, log });
});

const toggleDietOn = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const student = await require('../models/Student').findOne({ userId: userId }).populate('userId', 'name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Find and delete the OFF log if it exists for today
  const DietLog = require('../models/DietLog');
  const log = await DietLog.findOneAndDelete({ 
    studentId: student._id, 
    date: { $gte: start, $lt: end },
    isActive: false
  });

  // Notify Vendor
  const hostel = await Hostel.findById(student.hostelId);
  if (hostel && hostel.contractorId) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: hostel.contractorId,
      title: 'Diet Toggle Alert',
      message: `${student.userId?.name || 'A student'} has turned ON their diet for today.`,
      type: 'diet'
    });
  }

  await auditService.logAction({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'TOGGLE_DIET_ON',
    resource: 'DietLog',
    details: 'Student manually turned on diet for today',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Diet activated for today' });
});

const getDietHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId || req.user.profile?._id;
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const logs = await dietService.getDietHistory(userId, month, year);
  res.json({ success: true, logs });
});

const adminUpdateDietRules = asyncHandler(async (req, res) => {
  const { hostelId, dietCutoffTime, dietPricePerDay } = req.body;
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
  if (dietCutoffTime) hostel.dietCutoffTime = dietCutoffTime;
  if (typeof dietPricePerDay !== 'undefined') hostel.dietPricePerDay = dietPricePerDay;
  await hostel.save();
  res.json({ success: true, hostel });
});

const toggleMeal = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.profile?.userId;
  const { mealName, date } = req.body; // mealName e.g. "Lunch"
  
  if (!mealName) return res.status(400).json({ success: false, message: 'mealName is required' });

  const student = await require('../models/Student').findOne({ userId }).populate('hostelId');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const hostel = student.hostelId;
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0,0,0,0);

  // "One diet before" rule check
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  
  // Sort components by time to find the sequence
  const activeComponents = (hostel.dietComponents || [])
    .filter(c => c.isActive !== false)
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const compIndex = activeComponents.findIndex(c => c.name === mealName);
  if (compIndex > -1) {
    const component = activeComponents[compIndex];
    
    // Previous meal in the cycle
    const prevIndex = compIndex === 0 ? activeComponents.length - 1 : compIndex - 1;
    const prevComponent = activeComponents[prevIndex];
    
    // Target meal time
    const [hh, mm] = (component.time || '00:00').split(':').map(Number);
    const targetMealTime = new Date(targetDate);
    targetMealTime.setHours(hh, mm, 0, 0);

    const prevTime = prevComponent.time || (prevIndex === activeComponents.length - 1 ? '20:00' : '08:00');
    const [ph, pm] = prevTime.split(':').map(Number);

    // Cutoff time (Start of previous meal)
    let cutoffTime;
    if (compIndex === 0) {
      // For first meal of day (Breakfast), cutoff is previous day's last meal (Dinner)
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - 1);
      cutoffTime = new Date(prevDate);
      cutoffTime.setHours(ph, pm, 0, 0);
    } else {
      // For other meals, cutoff is today's previous meal
      cutoffTime = new Date(targetDate);
      cutoffTime.setHours(ph, pm, 0, 0);
    }

    if (ist.getTime() >= cutoffTime.getTime()) {
       return res.status(400).json({ 
         success: false, 
         message: `Rule: Diet off allowed one diet before only. Cutoff was at ${prevComponent.name} (${prevTime}).` 
       });
    }
  }

  const DietLog = require('../models/DietLog');
  let log = await DietLog.findOne({ studentId: student._id, date: targetDate });
  
  if (!log) {
    log = await DietLog.create({ studentId: student._id, date: targetDate, mealsOff: [] });
  }

  const index = log.mealsOff.indexOf(mealName);
  if (index > -1) {
    log.mealsOff.splice(index, 1);
  } else {
    log.mealsOff.push(mealName);
  }
  
  await log.save();

  // Notify Vendor
  if (hostel && hostel.contractorId) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: hostel.contractorId,
      title: 'Meal Preference Update',
      message: `${student.userId?.name || 'A student'} has updated their preference for ${mealName} on ${targetDate.toLocaleDateString()}. Now: ${index > -1 ? 'ON' : 'OFF'}`,
      type: 'diet'
    });
  }

  res.json({ success: true, log });
});

const getDietPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id || req.user.profile?.userId;
  const student = await require('../models/Student').findOne({ userId }).populate('hostelId');
  if (!student || !student.hostelId) return res.status(404).json({ success: false, message: 'Hostel or student not found' });

  const hostel = student.hostelId;
  const schedule = hostel.dietPlan && hostel.dietPlan.schedule ? hostel.dietPlan.schedule : [];

  const enriched = schedule.map(day => {
    const meals = {};
    (hostel.dietComponents || []).forEach(comp => {
      meals[comp.name] = (day.meals instanceof Map ? day.meals.get(comp.name) : day.meals?.[comp.name]) || 'N/A';
    });
    return {
      day: day.day,
      meals
    };
  });

  res.json({ success: true, plan: enriched, hostel: { _id: hostel._id, name: hostel.name, dietComponents: hostel.dietComponents } });
});

module.exports = { getDietStatus, toggleDietOff, toggleDietOn, toggleMeal, getDietHistory, adminUpdateDietRules, getDietPlan };
