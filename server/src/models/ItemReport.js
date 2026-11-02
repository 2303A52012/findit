const mongoose = require('mongoose');

const itemReportSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportType: { type: String, enum: ['Lost', 'Found'], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  eventDate: { type: Date, required: true },
  locationText: { type: String, required: true, trim: true, maxlength: 200 },
  imageUrl: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['Under Review', 'Resolved', 'Removed'],
    default: 'Under Review',
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

itemReportSchema.index({ title: 'text', category: 'text', locationText: 'text' });

module.exports = mongoose.model('ItemReport', itemReportSchema);
