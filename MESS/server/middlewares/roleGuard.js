const roleLevels = {
	student: 1,
	contractor: 2,
	admin: 3,
	superadmin: 4
};

const requireExact = (role) => (req, res, next) => {
	if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
	if (req.user.role !== role) return res.status(403).json({ success: false, message: 'Forbidden' });
	return next();
};

const requireMinLevel = (minRole) => (req, res, next) => {
	if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
	const userLevel = roleLevels[req.user.role] || 0;
	const requiredLevel = roleLevels[minRole] || 0;
	if (userLevel < requiredLevel) return res.status(403).json({ success: false, message: 'Forbidden' });
	return next();
};

module.exports = {
	isStudent: requireExact('student'),
	isContractor: requireExact('contractor'),
	isAdmin: requireExact('admin'),
	isSuperAdmin: requireExact('superadmin'),
	isAdminOrAbove: requireMinLevel('admin'),
	isContractorOrAbove: requireMinLevel('contractor')
};
