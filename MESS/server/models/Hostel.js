const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dietCutoffTime: {
    type: String,
    validate: {
      validator: function (v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid HH:MM time string`
    }
  },
  inventoryFreezeTime: {
    type: String,
    default: '08:00',
    validate: {
      validator: function (v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid HH:MM time string`
    }
  },
  dietComponents: [
    {
      name: { type: String, required: true },
      price: { type: Number, default: 0 },
      includeInDiet: { type: Boolean, default: true },
      isActive: { type: Boolean, default: true }
    }
  ],
  dietPlan: {
    title: { type: String, default: 'Standard Plan' },
    schedule: [
      {
        day: { type: String, required: true },
        meals: { type: Map, of: String }
      }
    ]
  },
  minDiets: { type: Number, default: 0, min: 0 },
  paymentDueDays: { type: Number, default: 7, min: 0 },
  paymentMethod: {
    provider: { type: String, trim: true, default: 'upi' },
    upiId: { type: String, trim: true, default: '' },
    gatewayName: { type: String, trim: true, default: '' },
    accountName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    ifsc: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', HostelSchema);
