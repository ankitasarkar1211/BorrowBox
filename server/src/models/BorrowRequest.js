const mongoose = require('mongoose');

// pending    - awaiting the owner's decision (initial state)
// approved   - owner accepted it; a Loan now exists for it
// rejected   - owner declined it; rejectionReason explains why
// cancelled  - the borrower withdrew it before the owner acted
const BORROW_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const borrowRequestSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Derived from item.owner at creation time — never accepted from
    // the client. Storing it directly (rather than always populating
    // item.owner) lets the "received requests" query filter by a
    // single indexed field.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Derived from the authenticated user's communityId — never
    // accepted from the client. Present mainly as a defense-in-depth
    // safety net for community-scoped queries/audits; the item and
    // owner already imply the same community.
    communityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: BORROW_REQUEST_STATUSES,
        message: `status must be one of: ${BORROW_REQUEST_STATUSES.join(', ')}`,
      },
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'message must be at most 500 characters long'],
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'rejectionReason must be at most 500 characters long'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// GET /api/borrow-requests/my — a borrower's own requests, newest first.
borrowRequestSchema.index({ borrower: 1, createdAt: -1 });

// GET /api/borrow-requests/received — requests for items an owner listed.
borrowRequestSchema.index({ owner: 1, createdAt: -1 });

// Looking up a specific item's request history (used implicitly by
// approval logic and useful for future modules, e.g. showing an owner
// all requests against one listing).
borrowRequestSchema.index({ item: 1, status: 1 });

borrowRequestSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
module.exports.BORROW_REQUEST_STATUSES = BORROW_REQUEST_STATUSES;
