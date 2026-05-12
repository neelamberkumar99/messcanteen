const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateTimeFormat = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.every(item => item.itemId && typeof item.quantity === 'number' && item.quantity > 0);
};

const validateComplaint = (title, description) => {
  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) return false;
  if (!description || typeof description !== 'string' || description.trim().length === 0 || description.length > 5000) return false;
  return true;
};

const validatePassword = (password) => {
  if (!password || password.length < 6) return false;
  return true;
};

const validateCanteenItem = (name, price) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) return false;
  if (typeof price !== 'number' || price <= 0 || price > 100000) return false;
  return true;
};

module.exports = {
  validateEmail,
  validateTimeFormat,
  validateOrderItems,
  validateComplaint,
  validatePassword,
  validateCanteenItem
};
