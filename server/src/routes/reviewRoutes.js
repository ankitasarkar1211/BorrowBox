const express = require('express');
const {
  createReview,
  getUserReviews,
  getLoanReviews,
  getMyReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createReview);

// /my must be declared before any pattern that could otherwise swallow
// it — it doesn't collide with /user/:userId or /loan/:loanId (different
// path segments), but is grouped here for readability/consistency with
// the other route files in this project.
router.get('/my', getMyReviews);
router.get('/user/:userId', getUserReviews);
router.get('/loan/:loanId', getLoanReviews);

module.exports = router;
