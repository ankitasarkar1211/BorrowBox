const mongoose = require('mongoose');

// --- Status design, explained ---
//
// Only three values are ever WRITTEN to `status` by application code:
//   active    - the loan is a live reservation: it has been approved
//               and not yet returned or cancelled. This single value
//               deliberately covers the "hasn't started yet", "in
//               progress", and "overdue" time-based sub-states.
//   returned  - the borrower (or owner) has confirmed the item came
//               back. actualReturnDate is set.
//   cancelled - reserved for a future use case (e.g. a mutual
//               cancellation of an approved-but-not-yet-started loan);
//               no endpoint in this module sets it yet, but it exists
//               so a later module can add that flow without a schema
//               change.
//
// "upcoming" and "overdue" are NOT persisted values. Storing them
// would require a scheduled job to flip a loan from "upcoming" to
// "active" to "overdue" as calendar time passes, and if that job ever
// missed a run, the stored status would silently lie. Instead they
// are computed on read from `status` + today's date via
// getEffectiveStatus() below (see also loanController.toPublicLoan,
// which exposes this as `effectiveStatus` in every API response). The
// persisted `status` alone is still exactly what matters for
// availability: any loan with status "active" blocks its date range,
// regardless of whether it's upcoming, in progress, or overdue.
const LOAN_STATUSES = ['active', 'returned', 'cancelled'];

const loanSchema = new mongoose.Schema(
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    communityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // One loan per approved request. The unique index below is a
    // deliberate second line of defense (on top of the transactional
    // approval logic in borrowRequestController) against ever creating
    // two loans for the same request — e.g. if the approve endpoint
    // were somehow called twice in a way that raced past the
    // in-transaction guard, the second insert attempt would fail with
    // a duplicate-key error, which the existing centralized error
    // handler already converts into a clean 409 response.
    borrowRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest',
      required: true,
      unique: true,
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
        values: LOAN_STATUSES,
        message: `status must be one of: ${LOAN_STATUSES.join(', ')}`,
      },
      default: 'active',
      index: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Core overlap-check index: every availability query filters by item +
// status:'active' and compares startDate/endDate.
loanSchema.index({ item: 1, status: 1, startDate: 1, endDate: 1 });

// GET /api/loans/my
loanSchema.index({ borrower: 1, createdAt: -1 });

// GET /api/loans/lending
loanSchema.index({ owner: 1, createdAt: -1 });

// Note: communityId already has a single-field index via `index: true`
// on the field definition above — no separate schema.index() needed.

/**
 * Computes the date-aware status shown to clients, without ever
 * mutating the persisted `status` field. See the comment above
 * LOAN_STATUSES for why this is computed rather than stored.
 */
loanSchema.methods.getEffectiveStatus = function getEffectiveStatus() {
  if (this.status === 'returned') return 'returned';
  if (this.status === 'cancelled') return 'cancelled';

  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'overdue';
  return 'active';
};

loanSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Loan', loanSchema);
module.exports.LOAN_STATUSES = LOAN_STATUSES;
