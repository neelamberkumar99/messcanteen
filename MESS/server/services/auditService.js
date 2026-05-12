const AuditLog = require('../models/AuditLog');

const logAction = async ({ userId, userRole, action, resource, resourceId, details, ipAddress }) => {
  try {
    await AuditLog.create({
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Logging Failed:', err);
  }
};

module.exports = { logAction };
