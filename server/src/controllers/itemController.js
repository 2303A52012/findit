const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const ItemReport = require('../models/ItemReport');

// Graceful fallback for Claim and ClaimMessage if claims module is not yet initialized
let Claim = null;
try {
  Claim = require('../models/Claim');
} catch (_) {}

let ClaimMessage = null;
try {
  ClaimMessage = require('../models/ClaimMessage');
} catch (_) {}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/items
 * Retrieve available item reports with search and filter capabilities.
 */
async function listItems(req, res, next) {
  try {
    const { search, category, location, type, status, includeRemoved } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    } else if (includeRemoved !== 'true' && includeRemoved !== true) {
      filter.status = { $ne: 'Removed' };
    }

    if (type && ['Lost', 'Found'].includes(type)) {
      filter.reportType = type;
    }

    if (category?.trim()) {
      filter.category = new RegExp(category.trim(), 'i');
    }

    if (location?.trim()) {
      filter.locationText = new RegExp(location.trim(), 'i');
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { locationText: searchRegex }
      ];
    }

    const items = await ItemReport.find(filter)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/items/:id
 * Retrieve details for a single item report.
 */
async function getItem(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await ItemReport.findById(req.params.id).populate('ownerId', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item report not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/items
 * Create a new lost or found item report with initial status 'Under Review'.
 */
async function createItem(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: errors.array()[0].msg
      });
    }

    const { reportType, title, category, description, eventDate, locationText, imageUrl } = req.body;
    
    // Bind ownerId strictly from authenticated user token, never trusting client body
    const ownerId = req.user.id || req.user._id;

    const item = await ItemReport.create({
      ownerId,
      reportType,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      eventDate,
      locationText: locationText.trim(),
      imageUrl: imageUrl?.trim() || '',
      status: 'Under Review'
    });

    const populated = await item.populate('ownerId', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/items/:id
 * Update an existing report. Owner can edit details; moderator can update status.
 */
async function updateItem(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: errors.array()[0].msg
      });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await ItemReport.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found' });
    }

    const currentUserId = (req.user.id || req.user._id).toString();
    const isOwner = (item.ownerId._id || item.ownerId).toString() === currentUserId;
    const isModerator = req.user.role === 'moderator';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'You do not have permission to edit this report' });
    }

    const ownerFields = ['title', 'category', 'description', 'eventDate', 'locationText', 'imageUrl', 'reportType'];
    for (const field of ownerFields) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }

    // Only moderators can change status
    if (req.body.status !== undefined) {
      if (isModerator) {
        item.status = req.body.status;
      } else if (!isModerator && req.body.status !== item.status) {
        return res.status(403).json({ message: 'Only moderators can update report status' });
      }
    }

    await item.save();

    // If Claim model is active, cascade status updates
    if (Claim) {
      if (item.status === 'Resolved') {
        await Claim.updateMany(
          { itemReportId: item._id, status: 'Pending' },
          { $set: { status: 'Approved', chatDisabled: true } }
        );
      } else if (item.status === 'Removed') {
        await Claim.updateMany(
          { itemReportId: item._id, status: 'Pending' },
          { $set: { status: 'Rejected', chatDisabled: true } }
        );
      }
    }

    const populated = await item.populate('ownerId', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/items/:id
 * Delete an item report. Allowed for report owner or moderator.
 */
async function deleteItem(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await ItemReport.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item report not found' });
    }

    const currentUserId = (req.user.id || req.user._id).toString();
    const isOwner = (item.ownerId._id || item.ownerId).toString() === currentUserId;
    const isModerator = req.user.role === 'moderator';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'You do not have permission to delete this report' });
    }

    await item.deleteOne();

    // Clean up associated claims and claim messages if models are loaded
    if (Claim) {
      if (ClaimMessage) {
        const claims = await Claim.find({ itemReportId: item._id }, '_id');
        await ClaimMessage.deleteMany({ claimId: { $in: claims.map(claim => claim._id) } });
      }
      await Claim.deleteMany({ itemReportId: item._id });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
