const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role,
    hostelId: user.hostelId || null
  };

  const secret = process.env.JWT_SECRET || 'change_this_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

module.exports = generateToken;
