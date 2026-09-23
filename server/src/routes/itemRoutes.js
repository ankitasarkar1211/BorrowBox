const express = require('express');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Every item route requires a logged-in user — there is no public
// browsing of listings, since BorrowBox is a closed-community platform.
router.use(protect);

router.route('/').post(createItem).get(getItems);

router.route('/:id').get(getItemById).put(updateItem).delete(deleteItem);

module.exports = router;
