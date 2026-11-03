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

      // Check if chat access is disabled (e.g. claim is resolved, approved, rejected, or chatDisabled flag set)
      if (
        claim.chatDisabled ||
        claim.status === 'Approved' ||
        claim.status === 'Rejected' ||
        claim.itemReportId?.status === 'Resolved' ||
        claim.itemReportId?.status === 'Removed'
      ) {
        return res.status(403).json({
          message: 'Chat access is disabled for this conversation because the claim has been resolved or closed'
        });
      }

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
        if (syncedStatus === 'Approved' || syncedStatus === 'Rejected') {
          claim.chatDisabled = true;
        }
        await claim.save();
      }
    }
    res.json(claims);
  } catch (error) {
    next(error);
  }
}

async function updateClaimHandshake(req, res, next) {
  try {
    const { action } = req.body; // 'sent', 'received', or 'admin_approve'
    if (!['sent', 'received', 'admin_approve'].includes(action)) {
      return res.status(400).json({ message: 'Invalid handshake action. Must be "sent", "received", or "admin_approve".' });
    }

    const claim = await Claim.findById(req.params.claimId).populate('itemReportId');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = claim.itemReportId;
    if (!item) return res.status(404).json({ message: 'Associated item report not found' });

    const currentUserId = req.user._id.toString();
    const itemOwnerId = (item.ownerId._id || item.ownerId).toString();
    const claimantId = (claim.claimantId._id || claim.claimantId).toString();
    const isModerator = req.user.role === 'moderator';

    // Verify participant or moderator
    const canAccess = isModerator || currentUserId === claimantId || currentUserId === itemOwnerId;
    if (!canAccess) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Identify who lost the item (Receiver) and who found it (Sender)
    // If item.reportType is 'Lost': Owner lost it (Receiver), Claimant found it (Sender).
    // If item.reportType is 'Found': Owner found it (Sender), Claimant lost it (Receiver).
    const isLostReport = item.reportType === 'Lost';
    const loserId = isLostReport ? itemOwnerId : claimantId;
    const finderId = isLostReport ? claimantId : itemOwnerId;

    if (action === 'sent') {
      if (!isModerator && currentUserId !== finderId) {
        return res.status(403).json({ message: 'Only the finder who sends or hands over the item can mark it as Sent.' });
      }
      claim.senderSent = true;
      claim.sentAt = new Date();
    } else if (action === 'received') {
      if (!isModerator && currentUserId !== loserId) {
        return res.status(403).json({ message: 'Only the person who lost the item and received it can mark it as Received.' });
      }
      claim.receiverReceived = true;
      claim.receivedAt = new Date();
    } else if (action === 'admin_approve') {
      if (!isModerator) {
        return res.status(403).json({ message: 'Only administrators can perform administrative approval.' });
      }
      claim.senderSent = true;
      claim.receiverReceived = true;
      if (!claim.sentAt) claim.sentAt = new Date();
      if (!claim.receivedAt) claim.receivedAt = new Date();
    }

    // If both parties approved/confirmed or admin verified
    if (claim.senderSent && claim.receiverReceived) {
      claim.status = 'Approved';
      claim.chatDisabled = true;

      // Update the item report status to Resolved
      item.status = 'Resolved';
      await item.save();
    }

    await claim.save();

    const populated = await Claim.findById(claim._id)
      .populate('itemReportId')
      .populate('claimantId', 'name email');

    res.json({
      message: claim.chatDisabled
        ? 'Handover completed and verified. Chat access is now disabled for all participants.'
        : `Handover status updated (${action} confirmed).`,
      claim: populated,
      itemResolved: item.status === 'Resolved'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createClaim,
  myItems,
  myClaims,
  getItemClaims,
  getClaimConversation,
  sendClaimMessage,
  updateClaimHandshake
};
