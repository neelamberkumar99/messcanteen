const mongoose = require('mongoose');

const ContractorRequestSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'inprogress', 'resolved'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ContractorRequest', ContractorRequestSchema);
