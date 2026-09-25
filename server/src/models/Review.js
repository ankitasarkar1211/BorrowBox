const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // Both derived from the authenticated user + the Loan being
    // reviewed — never accepted from the client. See
    // reviewController.createReview.
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    // Copied from loan.item at creation time — lets review listings
    // show what the review was about without an extra populate hop
    // through Loan.
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
      min: [1, 'rating must be between 1 and 5'],
      max: [5, 'rating must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'comment must be at most 1000 characters long'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A loan has exactly two possible reviews (borrower→owner and
// owner→borrower), never two from the same reviewer. This unique
// index is the actual enforcement mechanism for "prevent duplicate
// review by the same reviewer for the same loan" — a second insert
// attempt fails with a duplicate-key error, which the existing
// centralized error handler already converts to a clean 409. It also
// serves GET /api/reviews/loan/:loanId as a usable prefix index.
reviewSchema.index({ loan: 1, reviewer: 1 }, { unique: true });

// GET /api/reviews/user/:userId — reviews received, newest first.
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// GET /api/reviews/my — reviews written, newest first.
reviewSchema.index({ reviewer: 1, createdAt: -1 });

reviewSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
