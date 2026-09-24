const express = require('express');
const {
  createBorrowRequest,
  getMyBorrowRequests,
  getReceivedBorrowRequests,
  getBorrowRequestById,
  approveBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
} = require('../controllers/borrowRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createBorrowRequest);

// /my and /received must be declared before /:id, or Express would
// try to match "my"/"received" as the :id param.
router.get('/my', getMyBorrowRequests);
router.get('/received', getReceivedBorrowRequests);

router.get('/:id', getBorrowRequestById);
router.patch('/:id/approve', approveBorrowRequest);
router.patch('/:id/reject', rejectBorrowRequest);
router.patch('/:id/cancel', cancelBorrowRequest);

module.exports = router;
