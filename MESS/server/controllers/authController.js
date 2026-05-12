const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
const auditService = require('../services/auditService');

// Register: create user and student record if role=student
const register = async (req, res) => {
	const { name, email, password, role, hostelId, rollNumber, roomNumber } = req.body;
	if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

	const existing = await User.findOne({ email });
	if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

	const user = new User({ name, email, password, role: role || 'student', hostelId });
	await user.save();

	if (user.role === 'student') {
		await Student.create({ userId: user._id, rollNumber: rollNumber || '', roomNumber: roomNumber || '', hostelId });
	}

	const token = generateToken(user);
	const userSafe = await User.findById(user._id).select('-password');
	res.status(201).json({ success: true, token, user: userSafe });
};

// Login: verify and return token
const login = async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

	const isMatch = await user.comparePassword(password);
	if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

	const token = generateToken(user);
	const userSafe = await User.findById(user._id).select('-password');

	await auditService.logAction({
		userId: user._id,
		userRole: user.role,
		action: 'LOGIN',
		resource: 'User',
		resourceId: user._id,
		details: `User logged in: ${user.email}`,
		ipAddress: req.ip
	});

	res.json({ success: true, token, user: userSafe });
};

// getMe: return current user
const getMe = async (req, res) => {
	// req.user.profile is attached by auth middleware
	const user = req.user && req.user.profile ? req.user.profile : null;
	if (!user) return res.status(404).json({ success: false, message: 'User not found' });
	res.json({ success: true, user });
};

// changePassword: oldPassword, newPassword
const changePassword = async (req, res) => {
	const userId = req.user && req.user.id;
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing passwords' });

	const user = await User.findById(userId);
	if (!user) return res.status(404).json({ success: false, message: 'User not found' });

	const match = await user.comparePassword(oldPassword);
	if (!match) return res.status(401).json({ success: false, message: 'Old password is incorrect' });

	user.password = newPassword;
	await user.save();
	res.json({ success: true, message: 'Password changed successfully' });
};

module.exports = { register, login, getMe, changePassword };
