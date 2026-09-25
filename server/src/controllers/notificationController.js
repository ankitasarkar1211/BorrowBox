const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination } = require('../utils/listQueryHelpers');
const { runReturnReminders } = require('../services/reminderService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toPublicNotification = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    type: obj.type,
    title: obj.title,
    message: obj.message,
    relatedEntityType: obj.relatedEntityType,
    relatedEntityId: obj.relatedEntityId,
    isRead: obj.isRead,
    createdAt: obj.createdAt,
  };
};

// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);

  const filter = { recipient: req.user._id };
  if (req.query.isRead !== undefined) {
    if (req.query.isRead !== 'true' && req.query.isRead !== 'false') {
      throw new ApiError(400, 'isRead must be "true" or "false".');
    }
    filter.isRead = req.query.isRead === 'true';
  }

  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      notifications: notifications.map(toPublicNotification),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return res.status(200).json({ success: true, data: { count } });
});

// @route   PATCH /api/notifications/:id/read
// @access  Private (own notifications only)
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid notification id.');

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    // Covers both "doesn't exist" and "belongs to someone else" — the
    // filter above already excludes another user's notification, so
    // this is never a 403; it's a 404 either way, same convention as
    // the rest of the codebase.
    throw new ApiError(404, 'Notification not found.');
  }

  return res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    data: { notification: toPublicNotification(notification) },
  });
});

// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
    data: { updatedCount: result.modifiedCount },
  });
});

// @route   POST /api/notifications/run-reminders
// @access  Private (admin only)
//
// Manual trigger for the same job the daily cron schedule runs (see
// src/config/scheduler.js) — exists so this can be exercised on demand
// in Postman/testing without waiting for the schedule, and gated
// behind the existing `adminOnly` middleware since it acts across all
// users' loans, not just the caller's own data.
const runRemindersNow = asyncHandler(async (req, res) => {
  const summary = await runReturnReminders();
  return res.status(200).json({
    success: true,
    message: 'Reminder job completed.',
    data: summary,
  });
});

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, runRemindersNow };
