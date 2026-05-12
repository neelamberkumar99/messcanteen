const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['admin', 'contractor', 'superadmin', 'student'], required: true },
  action: { type: String, required: true }, // e.g., "created_student", "generated_bill", "approved_order"
  resource: { type: String, required: true }, // e.g., "student", "bill", "order"
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String }, // Additional context
  ipAddress: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed } // Before/after values
}, { timestamps: true });

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ userRole: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
