const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/itemController');

// Validation rules for reporting a lost or found item
const createItemValidation = [
  body('reportType').isIn(['Lost', 'Found']).withMessage('Report type must be Lost or Found'),
  body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Title is required and must be between 2 and 120 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be at least 10 characters'),
  body('eventDate').isISO8601().withMessage('A valid date is required'),
  body('locationText').trim().notEmpty().withMessage('Location is required'),
  body('imageUrl').optional({ values: 'falsy' }).isURL().withMessage('Image URL must be a valid URL')
];

// Validation rules for updating an item report
const updateItemValidation = [
  body('reportType').optional().isIn(['Lost', 'Found']).withMessage('Report type must be Lost or Found'),
  body('title').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be at least 10 characters'),
  body('eventDate').optional().isISO8601().withMessage('A valid date is required'),
  body('locationText').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('imageUrl').optional({ values: 'falsy' }).isURL().withMessage('Image URL must be a valid URL'),
  body('status').optional().isIn(['Under Review', 'Resolved', 'Removed']).withMessage('Status must be Under Review, Resolved, or Removed')
];

// 1. Retrieve all items (with search and filters)
router.get('/', listItems);

// 2. Create item report (authenticated user)
router.post('/', authenticate, createItemValidation, createItem);

// 3. Retrieve individual item by ID
router.get('/:id', getItem);

// 4. Update item report (owner or moderator)
router.patch('/:id', authenticate, updateItemValidation, updateItem);

// 5. Delete item report (owner or moderator)
router.delete('/:id', authenticate, deleteItem);

// Coordinate claims integration if claimController is available from claims developer
let claimController = null;
try {
  claimController = require('../controllers/claimController');
} catch (_) {}

if (claimController) {
  router.post(
    '/:id/claims',
    authenticate,
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Claim message must be at least 10 characters'),
    claimController.createClaim
  );
  router.get('/:id/claims', authenticate, claimController.getItemClaims);
  router.get('/claims/:claimId/messages', authenticate, claimController.getClaimConversation);
  router.post(
    '/claims/:claimId/messages',
    authenticate,
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message cannot be empty or longer than 2000 characters'),
    claimController.sendClaimMessage
  );
  router.patch('/claims/:claimId/handshake', authenticate, claimController.updateClaimHandshake);
}

module.exports = router;
