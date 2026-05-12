const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the AuditLog collection
 * @param {Object} params { userId, userRole, action, resource, resourceId, details, changes, req }
 */
const logAction = async ({ userId, userRole, action, resource, resourceId, details, changes, req }) => {
  try {
    await AuditLog.create({
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      changes,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || '0.0.0.0'
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
    // Non-blocking error
  }
};

module.exports = { logAction };
