const express = require('express');
const {
  getUsers,
  getUserById,
  updateUserStatus,
  getAdminItems,
  deleteAdminItem,
  getStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Every admin route requires BOTH a valid login AND role: 'admin' — a
// normal, active, authenticated user still gets 403 here.
router.use(protect, adminOnly);

router.get('/stats', getStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);

router.get('/items', getAdminItems);
router.delete('/items/:id', deleteAdminItem);

module.exports = router;
