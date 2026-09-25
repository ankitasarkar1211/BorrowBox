const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  runRemindersNow,
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Declared before /:id/read so Express never tries to match
// "unread-count" or "read-all" as the :id param.
router.get('/unread-count', getUnreadCount);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

// Admin-only manual trigger for the reminder job — see
// notificationController.runRemindersNow for why this reuses the
// existing adminOnly middleware.
router.post('/run-reminders', adminOnly, runRemindersNow);

module.exports = router;
