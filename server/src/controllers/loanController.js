const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, parseSort, parseStatusFilter } = require('../utils/listQueryHelpers');
const { safeNotify } = require('../services/notificationService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const shapeUserRef = (ref) => {
  if (ref && typeof ref === 'object' && ref.name !== undefined) {
    return { id: ref._id, name: ref.name, avatarUrl: ref.avatarUrl };
  }
  return ref;
};

const shapeItemRef = (ref) => {
  if (ref && typeof ref === 'object' && ref.title !== undefined) {
    return { id: ref._id, title: ref.title, images: ref.images, creditCost: ref.creditCost };
  }
  return ref;
};

/**
 * `status` is the persisted value (active | returned | cancelled).
 * `effectiveStatus` overlays the date-aware label (upcoming | active |
 * overdue | returned | cancelled) computed by Loan.getEffectiveStatus
 * — see the comment above LOAN_STATUSES in the model for why this is
 * computed rather than stored.
 */
const toPublicLoan = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const effectiveStatus = typeof doc.getEffectiveStatus === 'function' ? doc.getEffectiveStatus() : obj.status;

  return {
    id: obj._id,
    item: shapeItemRef(obj.item),
    borrower: shapeUserRef(obj.borrower),
    owner: shapeUserRef(obj.owner),
    communityId: obj.communityId,
    borrowRequest: obj.borrowRequest,
    startDate: obj.startDate,
    endDate: obj.endDate,
    status: obj.status,
    effectiveStatus,
    actualReturnDate: obj.actualReturnDate,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const POPULATE_FIELDS = [
  { path: 'item', select: 'title images creditCost' },
  { path: 'borrower', select: 'name avatarUrl' },
  { path: 'owner', select: 'name avatarUrl' },
];

// Query-param status values accepted by the list endpoints. Includes
// the two virtual (non-persisted) labels "upcoming" and "overdue",
// translated into a persisted-status + date filter by buildLoanFilter.
const EFFECTIVE_STATUS_VALUES = ['upcoming', 'active', 'overdue', 'returned', 'cancelled'];

const buildLoanFilter = (baseFilter, effectiveStatus) => {
  const filter = { ...baseFilter };
  if (!effectiveStatus) return filter;

  const now = new Date();
  switch (effectiveStatus) {
    case 'returned':
      filter.status = 'returned';
      break;
    case 'cancelled':
      filter.status = 'cancelled';
      break;
    case 'upcoming':
      filter.status = 'active';
      filter.startDate = { $gt: now };
      break;
    case 'overdue':
      filter.status = 'active';
      filter.endDate = { $lt: now };
      break;
    case 'active':
      // "Currently in progress" — persisted active AND today falls
      // inside the date range (excludes upcoming and overdue).
      filter.status = 'active';
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
      break;
    default:
      break;
  }
  return filter;
};

// @route   GET /api/loans/my
// @access  Private (borrower's own loans)
const getMyLoans = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'startDate', 'endDate']);
  const statusResult = parseStatusFilter(req.query, EFFECTIVE_STATUS_VALUES);
  const errors = [...sortResult.errors, ...statusResult.errors];
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  const filter = buildLoanFilter({ borrower: req.user._id }, statusResult.status);
  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    Loan.find(filter).populate(POPULATE_FIELDS).sort(sortResult.sort).skip(skip).limit(limit),
    Loan.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      loans: loans.map(toPublicLoan),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/loans/lending
// @access  Private (owner's/lender's loans)
const getLendingLoans = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'startDate', 'endDate']);
  const statusResult = parseStatusFilter(req.query, EFFECTIVE_STATUS_VALUES);
  const errors = [...sortResult.errors, ...statusResult.errors];
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  const filter = buildLoanFilter({ owner: req.user._id }, statusResult.status);
  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    Loan.find(filter).populate(POPULATE_FIELDS).sort(sortResult.sort).skip(skip).limit(limit),
    Loan.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      loans: loans.map(toPublicLoan),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/loans/:id
// @access  Private (borrower or owner only)
const getLoanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid loan id.');

  const loan = await Loan.findById(id).populate(POPULATE_FIELDS);
  if (!loan) throw new ApiError(404, 'Loan not found.');

  const isBorrower = loan.borrower._id.toString() === req.user._id.toString();
  const isOwner = loan.owner._id.toString() === req.user._id.toString();

  if (!isBorrower && !isOwner) {
    throw new ApiError(404, 'Loan not found.');
  }

  return res.status(200).json({
    success: true,
    data: { loan: toPublicLoan(loan) },
  });
});

// @route   PATCH /api/loans/:id/return
// @access  Private (borrower OR owner)
//
// Authorization rule, explained: either the borrower ("I'm returning
// this") or the owner ("I received it back") can mark a loan
// returned. In a closed, trust-based community there's no dispute-
// resolution flow yet, so requiring only the borrower would leave a
// loan stuck if the borrower forgets or loses access, and requiring
// only the owner would do the same in reverse. Whichever side acts
// first wins; the other side's later attempt on an already-returned
// loan gets a clean 409.
const returnLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid loan id.');

  const loan = await Loan.findById(id);
  if (!loan || loan.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Loan not found.');
  }

  const isBorrower = loan.borrower.toString() === req.user._id.toString();
  const isOwner = loan.owner.toString() === req.user._id.toString();
  if (!isBorrower && !isOwner) {
    throw new ApiError(403, 'Only the borrower or the item owner can mark this loan as returned.');
  }

  if (loan.status === 'returned') {
    throw new ApiError(409, 'This loan has already been returned.');
  }
  if (loan.status === 'cancelled') {
    throw new ApiError(409, 'This loan was cancelled and cannot be returned.');
  }

  loan.status = 'returned';
  loan.actualReturnDate = new Date();
  await loan.save();
  await loan.populate(POPULATE_FIELDS);

  // Per the brief, only the owner is notified on return (the borrower
  // is the one performing — or at least aware of — the action).
  await safeNotify({
    recipient: loan.owner._id || loan.owner,
    type: 'item_returned',
    title: 'Item returned',
    message: 'Your item has been marked as returned.',
    relatedEntityType: 'Loan',
    relatedEntityId: loan._id,
  });

  return res.status(200).json({
    success: true,
    message: 'Item marked as returned.',
    data: { loan: toPublicLoan(loan) },
  });
});

module.exports = { getMyLoans, getLendingLoans, getLoanById, returnLoan, toPublicLoan };
