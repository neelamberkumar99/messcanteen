const jwt = require('jsonwebtoken');
const User = require('../models/User');

// verifyToken middleware: extracts token, verifies and attaches req.user
const verifyToken = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ success: false, message: 'No token provided' });
	}

	const token = authHeader.split(' ')[1];
	try {
		const secret = process.env.JWT_SECRET || 'change_this_secret';
		const decoded = jwt.verify(token, secret);
		// attach minimal user info
		req.user = decoded;
		// Load full user from DB and attach profile
		const fullUser = await User.findById(decoded.id).select('-password');
		if (!fullUser) return res.status(401).json({ success: false, message: 'User not found' });
		if (fullUser.isActive === false) return res.status(401).json({ success: false, message: 'User is inactive' });
		// Keep decoded claims and attach DB profile
		req.user.profile = fullUser;
		next();
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			return res.status(401).json({ success: false, message: 'Token expired' });
		}
		return res.status(401).json({ success: false, message: 'Invalid token' });
	}
};

module.exports = verifyToken;
