const mongoose = require('mongoose');

const claimMessageSchema = new mongoose.Schema({
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

claimMessageSchema.index({ claimId: 1, createdAt: 1 });

module.exports = mongoose.model('ClaimMessage', claimMessageSchema);
