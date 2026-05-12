const mongoose = require('mongoose');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const DietLog = require('../models/DietLog');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const { getActiveDietDays } = require('./dietUtils');

/** Calculate monthly diet charge and return daily breakdown */
const calculateMonthlyDietCharge = async (studentUserId, month, year, hostelId) => {
	const student = await Student.findOne({ userId: studentUserId });
	const hostel = await Hostel.findById(hostelId);
	
	const pricePerDay = (hostel?.dietComponents || [])
		.filter(c => c.isActive !== false)
		.reduce((sum, c) => sum + (c.price || 0), 0);
	const minDiets = hostel?.minDiets || 0;
	
	const m = month - 1;
	const start = new Date(year, m, 1);
	const monthEnd = new Date(year, m + 1, 1);
	
	// If it's the current month, we only calculate up to now
	const now = new Date();
	const effectiveEnd = (now.getMonth() === m && now.getFullYear() === year) ? now : monthEnd;

	const logs = await DietLog.find({ studentId: student._id, date: { $gte: start, $lt: monthEnd } });
	const logMap = new Map(logs.map(l => [l.date.toDateString(), l]));

	let daysActive = 0;
	const dailyBreakdown = [];

	// Loop through all days of the month (or up to today)
	let dietCharges = 0;
	for (let d = new Date(start); d < effectiveEnd; d.setDate(d.getDate() + 1)) {
		const key = d.toDateString();
		const log = logMap.get(key);
		const isActive = log ? log.isActive : student.dietStatus;
		
		if (isActive) {
			daysActive++;
			let dailyAmount = 0;
			const isToday = d.toDateString() === now.toDateString();
			const istOffset = 5.5 * 60 * 60 * 1000;
			const istNow = new Date(now.getTime() + istOffset);
			const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();

			(hostel?.dietComponents || []).forEach(comp => {
				if (comp.isActive === false) return;
				if (log?.mealsOff?.includes(comp.name)) return;

				// Past days: full charge
				if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
					dailyAmount += (comp.price || 0);
				} 
				// Today: only if meal time has passed
				else if (isToday) {
					const [hh, mm] = (comp.time || '00:00').split(':').map(Number);
					const mealMinutes = hh * 60 + mm;
					if (currentMinutes >= mealMinutes) {
						dailyAmount += (comp.price || 0);
					}
				}
			});
			
			dietCharges += dailyAmount;
			if (dailyAmount > 0) {
				dailyBreakdown.push({ 
					date: new Date(d), 
					type: 'diet', 
					label: isToday ? 'Diet (Live Accrual)' : (log?.mealsOff?.length > 0 ? `Diet (${log.mealsOff.length} meals off)` : 'Diet Charge'), 
					amount: dailyAmount 
				});
			}
		}
	}

	let minDietSurcharge = 0;

	// Minimum diet logic: only applies at the end of the month or in final bill generation
	// But for live view, we can show it as a projected surcharge if they are below target
	const totalDaysInMonth = new Date(year, month, 0).getDate();
	if (daysActive < minDiets) {
		const gap = minDiets - daysActive;
		minDietSurcharge = gap * pricePerDay;
		dietCharges += minDietSurcharge;
		
		if (minDietSurcharge > 0) {
			dailyBreakdown.push({ 
				date: new Date(effectiveEnd), 
				type: 'diet_adjustment', 
				label: `Min Diet Surcharge (${gap} diets)`, 
				amount: minDietSurcharge 
			});
		}
	}

	return { 
		daysActive, 
		minDiets,
		dietCharges, 
		minDietSurcharge,
		pricePerDay, 
		dailyBreakdown 
	};
};

function nowYear() { return new Date().getFullYear(); }
function nowMonth() { return new Date().getMonth(); }
function nowDate() { return new Date().getDate(); }

/** Sum approved canteen orders with daily breakdown */
const calculateApprovedCanteenCharges = async (studentUserId, month, year) => {
	const student = await Student.findOne({ userId: studentUserId });
	const m = month - 1;
	const start = new Date(year, m, 1);
	const end = new Date(year, m + 1, 1);

	const orders = await Order.find({ 
		studentId: student._id, 
		status: 'approved', 
		createdAt: { $gte: start, $lt: end } 
	});

	const dailyBreakdown = orders.map(o => ({
		date: o.createdAt,
		type: 'canteen',
		label: o.items?.map(i => i.name).join(', ') || 'Canteen Order',
		amount: o.totalAmount
	}));

	const canteenCharges = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
	return { canteenCharges, orders, dailyBreakdown };
};

/** Combine breakdowns and group by week */
const generateBillSummary = async (studentUserId, month, year) => {
	const student = await Student.findOne({ userId: studentUserId });
	if (!student) throw new Error('Student not found');

	const diet = await calculateMonthlyDietCharge(studentUserId, month, year, student.hostelId);
	const canteen = await calculateApprovedCanteenCharges(studentUserId, month, year);

	const combined = [...diet.dailyBreakdown, ...canteen.dailyBreakdown];
	combined.sort((a, b) => b.date - a.date);

	// Group into weeks
	const weeklyBreakdown = [];
	let currentWeek = { label: 'Week 1', total: 0, items: [] };
	
	combined.forEach((item, idx) => {
		const weekNum = Math.ceil(item.date.getDate() / 7);
		if (`Week ${weekNum}` !== currentWeek.label) {
			if (currentWeek.items.length > 0) weeklyBreakdown.push(currentWeek);
			currentWeek = { label: `Week ${weekNum}`, total: 0, items: [] };
		}
		currentWeek.items.push(item);
		currentWeek.total += item.amount;
	});
	if (currentWeek.items.length > 0) weeklyBreakdown.push(currentWeek);

	const totalBeforeFine = diet.dietCharges + canteen.canteenCharges;
	const unpaidBills = await Bill.find({ studentId: student._id, status: { $ne: 'paid' } });
	const existingFine = unpaidBills.reduce((s, b) => s + (b.fineAccrued || 0), 0);

	return {
		diet,
		canteen,
		weeklyBreakdown,
		dailyBreakdown: combined.slice(0, 10), // last 10 items
		totalBeforeFine,
		existingFine,
		totalAmount: totalBeforeFine + existingFine
	};
};

module.exports = { calculateMonthlyDietCharge, calculateApprovedCanteenCharges, generateBillSummary };
