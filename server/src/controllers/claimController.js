const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const ItemReport = require('../models/ItemReport');
const Claim = require('../models/Claim');
const ClaimMessage = require('../models/ClaimMessage');

async function createClaim(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid item ID' });
    const item = await ItemReport.findById(req.params.id);
    if (!item || item.status === 'Removed') return res.status(404).json({ message: 'Item report not found' });
    if (item.status === 'Resolved') return res.status(409).json({ message: 'This item has already been resolved and cannot accept new claims' });
    const existingClaim = await Claim.findOne({ itemReportId: item._id, claimantId: req.user._id });
    if (existingClaim) return res.status(409).json({ message: 'You have already submitted a claim for this item' });
    const claim = await Claim.create({
      itemReportId: item._id,
      claimantId: req.user._id,
      message: req.body.message
    });
    await ClaimMessage.create({
      claimId: claim._id,
      senderId: req.user._id,
      message: req.body.message
    });
    res.status(201).json(await claim.populate(['itemReportId', 'claimantId']));
  } catch (error) {
    next(error);
  }
}

async function getItemClaims(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid item ID' });
      const item = await ItemReport.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item report not found' });

      const isOwner = item.ownerId.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'moderator') {
        const ownClaims = await Claim.find({ itemReportId: item._id, claimantId: req.user._id })
          .populate('claimantId', 'name email');
        return res.json(ownClaims);
      }

      const claims = await Claim.find({ itemReportId: item._id })
        .populate('claimantId', 'name email')
        .sort({ createdAt: 1 });
      res.json(claims);
    } catch (error) {
      next(error);
    }
}

async function getClaimConversation(req, res, next) {
    try {
      const claim = await Claim.findById(req.params.claimId)
        .populate('itemReportId')
        .populate('claimantId', 'name email');
      if (!claim) return res.status(404).json({ message: 'Claim not found' });

      const itemOwnerId = claim.itemReportId.ownerId?.toString() || claim.itemReportId.ownerId;
      const canAccess = req.user.role === 'moderator'
        || claim.claimantId._id.toString() === req.user._id.toString()
        || itemOwnerId === req.user._id.toString();
      if (!canAccess) return res.status(403).json({ message: 'You are not a participant in this conversation' });

      const messages = await ClaimMessage.find({ claimId: claim._id })
        .populate('senderId', 'name role')
        .sort({ createdAt: 1 });
      res.json(messages);
    } catch (error) {
      next(error);
    }
}

async function sendClaimMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      const claim = await Claim.findById(req.params.claimId).populate('itemReportId');
      if (!claim) return res.status(404).json({ message: 'Claim not found' });

      const itemOwnerId = claim.itemReportId.ownerId.toString();
      const canAccess = req.user.role === 'moderator'
        || claim.claimantId.toString() === req.user._id.toString()
        || itemOwnerId === req.user._id.toString();
      if (!canAccess) return res.status(403).json({ message: 'You are not a participant in this conversation' });

      const message = await ClaimMessage.create({
        claimId: claim._id,
        senderId: req.user._id,
        message: req.body.message
      });
      res.status(201).json(await message.populate('senderId', 'name role'));
    } catch (error) {
      next(error);
  }
}

async function myItems(req, res, next) {
  try {
    const items = await ItemReport.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function myClaims(req, res, next) {
  try {
    const claims = await Claim.find({ claimantId: req.user._id })
      .populate('itemReportId')
      .sort({ createdAt: -1 });
    for (const claim of claims) {
      const itemStatus = claim.itemReportId?.status;
      const syncedStatus = itemStatus === 'Resolved'
        ? 'Approved'
        : itemStatus === 'Removed'
          ? 'Rejected'
          : claim.status;
      if (syncedStatus !== claim.status && claim.status === 'Pending') {
        claim.status = syncedStatus;
        await claim.save();
      }
    }
    res.json(claims);
  } catch (error) {
    next(error);
  }
}

module.exports = { createClaim, myItems, myClaims, getItemClaims, getClaimConversation, sendClaimMessage };
