const mongoose = require('mongoose');
const Review = require('../models/Review');
const Loan = require('../models/Loan');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { safeNotify } = require('../services/notificationService');
const { parsePagination, parseSort } = require('../utils/listQueryHelpers');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const shapeUserRef = (ref) => {
  if (ref && typeof ref === 'object' && ref.name !== undefined) {
    return { id: ref._id, name: ref.name, avatarUrl: ref.avatarUrl };
  }
  return ref;
};

const shapeItemRef = (ref) => {
  if (ref && typeof ref === 'object' && ref.title !== undefined) {
    return { id: ref._id, title: ref.title };
  }
  return ref;
};

const toPublicReview = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    reviewer: shapeUserRef(obj.reviewer),
    reviewee: shapeUserRef(obj.reviewee),
    loan: obj.loan,
    item: shapeItemRef(obj.item),
    rating: obj.rating,
    comment: obj.comment,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const REVIEW_POPULATE = [
  { path: 'reviewer', select: 'name avatarUrl' },
  { path: 'reviewee', select: 'name avatarUrl' },
  { path: 'item', select: 'title' },
];

/**
 * Computes reputation on demand from Review and Loan — nothing here is
 * stored on User, so it can never go stale (per the brief: "avoid
 * stale stored reputation data unless there is a good reason to
 * maintain it").
 */
const computeReputation = async (userId) => {
  const [ratingAgg, totalReviews, completedBorrowings, completedLendings] = await Promise.all([
    Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]),
    Review.countDocuments({ reviewee: userId }),
    Loan.countDocuments({ borrower: userId, status: 'returned' }),
    Loan.countDocuments({ owner: userId, status: 'returned' }),
  ]);

  const averageRating = ratingAgg.length > 0 ? Math.round(ratingAgg[0].avg * 10) / 10 : null;

  return { averageRating, totalReviews, completedBorrowings, completedLendings };
};

// @route   POST /api/reviews
// @access  Private (borrower or owner of a returned loan)
const createReview = asyncHandler(async (req, res) => {
  const { loanId, rating, comment } = req.body;

  if (!loanId || !isValidObjectId(loanId)) {
    throw new ApiError(400, 'A valid loanId is required.');
  }
  if (rating === undefined || rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'rating is required and must be a whole number between 1 and 5.');
  }
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') throw new ApiError(400, 'comment must be a string.');
    if (comment.trim().length > 1000) throw new ApiError(400, 'comment must be at most 1000 characters.');
  }

  const loan = await Loan.findById(loanId);
  if (!loan || loan.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Loan not found.');
  }

  const isBorrower = loan.borrower.toString() === req.user._id.toString();
  const isOwner = loan.owner.toString() === req.user._id.toString();

  // Same convention as loanController.getLoanById: a user who is
  // neither the borrower nor the owner can't see this loan at all, so
  // they get the same 404 here rather than a 403 that would confirm
  // it exists.
  if (!isBorrower && !isOwner) {
    throw new ApiError(404, 'Loan not found.');
  }

  if (loan.status !== 'returned') {
    throw new ApiError(409, 'Only completed (returned) loans can be reviewed.');
  }

  // reviewer is always req.user; reviewee is always "the other party"
  // on this loan — never accepted from the request body. Borrowing
  // your own item is already disallowed when a request is created, so
  // reviewer and reviewee can never structurally be the same person;
  // this check is a defensive backstop, not a reachable code path in
  // normal use.
  const revieweeId = isBorrower ? loan.owner : loan.borrower;
  if (revieweeId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot review yourself.');
  }

  // The unique {loan, reviewer} index is the actual enforcement of "no
  // duplicate review" — a second attempt throws E11000 here, which
  // asyncHandler forwards to the existing centralized error handler,
  // already converting it to a clean 409. No special handling needed.
  const review = await Review.create({
    reviewer: req.user._id,
    reviewee: revieweeId,
    loan: loan._id,
    item: loan.item,
    rating,
    comment: comment ? comment.trim() : null,
  });

  await review.populate(REVIEW_POPULATE);

  await safeNotify({
    recipient: revieweeId,
    type: 'review_received',
    title: 'You received a new review',
    message: `You received a ${rating}-star review.`,
    relatedEntityType: 'Review',
    relatedEntityId: review._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Review submitted.',
    data: { review: toPublicReview(review) },
  });
});

// @route   GET /api/reviews/user/:userId
// @access  Private (same community only)
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new ApiError(400, 'Invalid user id.');

  const targetUser = await User.findById(userId);
  if (!targetUser || targetUser.communityId !== req.user.communityId) {
    throw new ApiError(404, 'User not found.');
  }

  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'rating']);
  if (sortResult.errors.length > 0) throw new ApiError(400, sortResult.errors.join(' '));

  const filter = { reviewee: userId };
  const skip = (page - 1) * limit;

  const [reviews, total, reputation] = await Promise.all([
    Review.find(filter).populate(REVIEW_POPULATE).sort(sortResult.sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
    computeReputation(userId),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      reputation,
      reviews: reviews.map(toPublicReview),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/reviews/loan/:loanId
// @access  Private (borrower or owner of that loan only)
const getLoanReviews = asyncHandler(async (req, res) => {
  const { loanId } = req.params;
  if (!isValidObjectId(loanId)) throw new ApiError(400, 'Invalid loan id.');

  const loan = await Loan.findById(loanId);
  if (!loan || loan.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Loan not found.');
  }

  const isBorrower = loan.borrower.toString() === req.user._id.toString();
  const isOwner = loan.owner.toString() === req.user._id.toString();
  if (!isBorrower && !isOwner) {
    throw new ApiError(404, 'Loan not found.');
  }

  const reviews = await Review.find({ loan: loanId }).populate(REVIEW_POPULATE).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: { reviews: reviews.map(toPublicReview) },
  });
});

// @route   GET /api/reviews/my
// @access  Private
// "my" reviews means reviews you WROTE, consistent with
// /api/borrow-requests/my meaning requests you created. Reviews
// written ABOUT you are at GET /api/reviews/user/:yourOwnId.
const getMyReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'rating']);
  if (sortResult.errors.length > 0) throw new ApiError(400, sortResult.errors.join(' '));

  const filter = { reviewer: req.user._id };
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate(REVIEW_POPULATE).sort(sortResult.sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      reviews: reviews.map(toPublicReview),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

module.exports = { createReview, getUserReviews, getLoanReviews, getMyReviews, computeReputation };
