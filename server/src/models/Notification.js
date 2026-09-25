const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'borrow_request_received',
  'borrow_request_approved',
  'borrow_request_rejected',
  'borrow_request_cancelled',
  'loan_due_soon',
  'loan_overdue',
  'item_returned',
  'review_received',
  'credit_received',
  'credit_spent',
];

// What the notification is "about". Kept as a plain string + ObjectId
// pair (rather than Mongoose's refPath auto-population) since nothing
// in this module needs to auto-populate a polymorphic reference — a
// client that wants the full related object already has the
// type-specific endpoint to fetch it by id (e.g. GET
// /api/borrow-requests/:id). Keeping it simple here avoids coupling
// this model to every other model's exact ref name.
const RELATED_ENTITY_TYPES = ['BorrowRequest', 'Loan', 'Review', 'CreditTransaction'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'title must be at most 150 characters long'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'message must be at most 1000 characters long'],
    },
    relatedEntityType: {
      type: String,
      enum: {
        values: RELATED_ENTITY_TYPES,
        message: `relatedEntityType must be one of: ${RELATED_ENTITY_TYPES.join(', ')}`,
      },
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Serves every list endpoint at once: GET /api/notifications (with or
// without an isRead filter) and GET /api/notifications/unread-count,
// all scoped to `recipient` and sorted newest-first.
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Used by reminderService to check "has this loan already gotten a
// loan_due_soon / loan_overdue notification?" before creating another.
notificationSchema.index({ recipient: 1, type: 1, relatedEntityType: 1, relatedEntityId: 1 });

notificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
module.exports.RELATED_ENTITY_TYPES = RELATED_ENTITY_TYPES;
