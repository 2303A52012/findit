const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { myItems, myClaims } = require('../controllers/claimController');

router.get('/items', authenticate, myItems);
router.get('/claims', authenticate, myClaims);

module.exports = router;
