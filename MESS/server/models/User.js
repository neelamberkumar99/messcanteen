const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['student', 'contractor', 'admin', 'superadmin', 'staff'],
    default: 'student'
  },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Helper to compare passwords
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
// Mongoose User model (students, admins, contractors, superadmin)
