const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  itemReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemReport', required: true, index: true },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  senderSent: { type: Boolean, default: false },
  receiverReceived: { type: Boolean, default: false },
  chatDisabled: { type: Boolean, default: false },
  sentAt: { type: Date },
  receivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Claim', claimSchema);
