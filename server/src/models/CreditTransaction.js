const mongoose = require('mongoose');

// signup_bonus   - one-time welcome credit granted at registration
// borrow_spend   - credits deducted from a borrower when their request is approved
// lending_reward - credits paid to an owner when their item's request is approved
// refund         - reserved for a future module (e.g. disputed/cancelled-after-approval
//                  flows); no code path in this module creates one yet
// adjustment     - reserved for manual corrections (e.g. a future admin tool)
const CREDIT_TRANSACTION_TYPES = ['signup_bonus', 'borrow_spend', 'lending_reward', 'refund', 'adjustment'];

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Signed: negative for spends, positive for rewards/bonuses. This
    // is what makes balanceAfter - balanceBefore === amount always
    // hold, which is a useful invariant for auditing.
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isFinite(v) && v !== 0,
        message: 'amount must be a non-zero number',
      },
    },
    type: {
      type: String,
      enum: {
        values: CREDIT_TRANSACTION_TYPES,
        message: `type must be one of: ${CREDIT_TRANSACTION_TYPES.join(', ')}`,
      },
      required: true,
    },
    // Snapshotted at the moment of the change — this is what makes the
    // transaction log a real audit trail rather than just a diff list;
    // it lets a reader reconstruct the balance history without
    // replaying every transaction in order.
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    // Null for signup_bonus/adjustment, which aren't tied to a
    // specific borrowing transaction.
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'description must be at most 300 characters long'],
      default: null,
    },
  },
  {
    // Only createdAt is meaningful for an append-only log, but
    // timestamps:true is kept for consistency with every other model
    // in this project; updatedAt is simply never used.
    timestamps: true,
  }
);

// GET /api/credits/transactions — a user's own history, newest first,
// optionally filtered by type. This single compound index serves both
// the unfiltered and the type-filtered query (type as a prefix match).
creditTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });

creditTransactionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
module.exports.CREDIT_TRANSACTION_TYPES = CREDIT_TRANSACTION_TYPES;
