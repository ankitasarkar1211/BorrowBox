const mongoose = require('mongoose');
const BorrowRequest = require('../models/BorrowRequest');
const Loan = require('../models/Loan');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { validateBorrowDates } = require('../utils/dateValidators');
const { isItemAvailable } = require('../utils/availability');
const withTransaction = require('../utils/withTransaction');
const {
  validateCreateBorrowRequestInput,
  validateRejectionReason,
} = require('../utils/borrowRequestValidators');
const {
  parsePagination,
  parseSort,
  parseStatusFilter,
} = require('../utils/listQueryHelpers');
const { BORROW_REQUEST_STATUSES } = require('../models/BorrowRequest');
const { toPublicLoan } = require('./loanController');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Shapes a possibly-populated ref (item/borrower/owner) into a small
 * public object, or passes through the raw ObjectId when not
 * populated — same pattern itemController.toPublicItem uses.
 */
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

const toPublicBorrowRequest = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    item: shapeItemRef(obj.item),
    borrower: shapeUserRef(obj.borrower),
    owner: shapeUserRef(obj.owner),
    communityId: obj.communityId,
    startDate: obj.startDate,
    endDate: obj.endDate,
    status: obj.status,
    message: obj.message,
    rejectionReason: obj.rejectionReason,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const POPULATE_FIELDS = [
  { path: 'item', select: 'title images creditCost availabilityStatus' },
  { path: 'borrower', select: 'name avatarUrl' },
  { path: 'owner', select: 'name avatarUrl' },
];

// @route   POST /api/borrow-requests
// @access  Private
const createBorrowRequest = asyncHandler(async (req, res) => {
  const bodyErrors = validateCreateBorrowRequestInput(req.body);
  const dateResult = validateBorrowDates(req.body);
  const errors = [...bodyErrors, ...dateResult.errors];
  if (errors.length > 0) {
    throw new ApiError(400, errors.join(' '));
  }

  const { itemId } = req.body;
  const { startDate, endDate } = dateResult;

  const item = await Item.findById(itemId);
  if (!item || item.communityId !== req.user.communityId) {
    // Same convention as itemController: 404, not 403/400, so a
    // client can't confirm an item id from another community exists.
    throw new ApiError(404, 'Item not found.');
  }

  if (item.owner.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot request to borrow your own item.');
  }

  // availabilityStatus is a manual owner-controlled pause, independent
  // of dates (see Item model / README section on availabilityStatus
  // vs. Loan dates). It's checked here because it's not something the
  // date-overlap check below can express.
  if (item.availabilityStatus === 'unavailable') {
    throw new ApiError(409, 'This item is currently unavailable.');
  }

  const available = await isItemAvailable({ itemId: item._id, startDate, endDate });
  if (!available) {
    throw new ApiError(409, 'This item is already reserved for part or all of the requested dates.');
  }

  const { message } = req.body;

  const borrowRequest = await BorrowRequest.create({
    item: item._id,
    borrower: req.user._id,
    owner: item.owner,
    communityId: req.user.communityId,
    startDate,
    endDate,
    message: message ? message.trim() : null,
  });

  await borrowRequest.populate(POPULATE_FIELDS);

  return res.status(201).json({
    success: true,
    message: 'Borrow request submitted.',
    data: { borrowRequest: toPublicBorrowRequest(borrowRequest) },
  });
});

// @route   GET /api/borrow-requests/my
// @access  Private
const getMyBorrowRequests = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'startDate', 'endDate']);
  const statusResult = parseStatusFilter(req.query, BORROW_REQUEST_STATUSES);
  const errors = [...sortResult.errors, ...statusResult.errors];
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  const filter = { borrower: req.user._id };
  if (statusResult.status) filter.status = statusResult.status;

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    BorrowRequest.find(filter).populate(POPULATE_FIELDS).sort(sortResult.sort).skip(skip).limit(limit),
    BorrowRequest.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      borrowRequests: requests.map(toPublicBorrowRequest),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/borrow-requests/received
// @access  Private
const getReceivedBorrowRequests = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'startDate', 'endDate']);
  const statusResult = parseStatusFilter(req.query, BORROW_REQUEST_STATUSES);
  const errors = [...sortResult.errors, ...statusResult.errors];
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  const filter = { owner: req.user._id };
  if (statusResult.status) filter.status = statusResult.status;

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    BorrowRequest.find(filter).populate(POPULATE_FIELDS).sort(sortResult.sort).skip(skip).limit(limit),
    BorrowRequest.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      borrowRequests: requests.map(toPublicBorrowRequest),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/borrow-requests/:id
// @access  Private (borrower or owner only)
const getBorrowRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid borrow request id.');

  const request = await BorrowRequest.findById(id).populate(POPULATE_FIELDS);
  if (!request) throw new ApiError(404, 'Borrow request not found.');

  const isBorrower = request.borrower._id.toString() === req.user._id.toString();
  const isOwner = request.owner._id.toString() === req.user._id.toString();

  if (!isBorrower && !isOwner) {
    // 404, not 403 — consistent with the rest of this codebase's
    // convention of never confirming a resource exists to someone
    // who isn't entitled to see it.
    throw new ApiError(404, 'Borrow request not found.');
  }

  return res.status(200).json({
    success: true,
    data: { borrowRequest: toPublicBorrowRequest(request) },
  });
});

// @route   PATCH /api/borrow-requests/:id/approve
// @access  Private (item owner only)
const approveBorrowRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid borrow request id.');

  // Fast, non-transactional pre-checks so common errors (not found,
  // not the owner, already decided) return clean messages without
  // paying for a transaction. The authoritative checks are repeated
  // inside the transaction below, since this read can be stale by the
  // time the transaction runs.
  const existing = await BorrowRequest.findById(id);
  if (!existing || existing.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Borrow request not found.');
  }
  if (existing.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the item owner can approve this request.');
  }
  if (existing.status !== 'pending') {
    throw new ApiError(409, `This request has already been ${existing.status}.`);
  }

  let loan;
  try {
    loan = await withTransaction(async (session) => {
      // Touch the Item document inside the transaction. This is the
      // core of the double-booking protection: see README
      // "Concurrency / double-booking protection" for the full
      // explanation of why this line is what forces MongoDB to
      // detect a real write conflict between two concurrent approvals
      // for the same item.
      const item = await Item.findByIdAndUpdate(
        existing.item,
        { $inc: { bookingVersion: 1 } },
        { new: true, session }
      );
      if (!item) {
        throw new ApiError(404, 'The item for this request no longer exists.');
      }

      // Atomically claim the request: this update only succeeds if the
      // request is still "pending" at the instant it runs, which
      // prevents two concurrent approve calls on the SAME request from
      // both proceeding (independent of the transaction/bookingVersion
      // mechanism above, which handles the *different-request,
      // same-item* race instead).
      const claimed = await BorrowRequest.findOneAndUpdate(
        { _id: id, status: 'pending' },
        { $set: { status: 'approved' } },
        { new: true, session }
      );
      if (!claimed) {
        throw new ApiError(409, 'This request has already been processed.');
      }

      // Re-check availability against currently committed Loans. This
      // is the check that must never be skipped: the check performed
      // when the borrower originally submitted the request is not
      // trustworthy by approval time.
      const available = await isItemAvailable({
        itemId: claimed.item,
        startDate: claimed.startDate,
        endDate: claimed.endDate,
        session,
      });
      if (!available) {
        // Throwing here aborts the transaction, which rolls back both
        // the bookingVersion increment and the status:'approved'
        // write above — the request is left exactly as it was
        // ('pending'), so the owner can still reject it or approve a
        // different, non-conflicting request instead.
        throw new ApiError(
          409,
          'The requested dates are no longer available — another loan now overlaps them.'
        );
      }

      const [createdLoan] = await Loan.create(
        [
          {
            item: claimed.item,
            borrower: claimed.borrower,
            owner: claimed.owner,
            communityId: claimed.communityId,
            borrowRequest: claimed._id,
            startDate: claimed.startDate,
            endDate: claimed.endDate,
          },
        ],
        { session }
      );

      return createdLoan;
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.code === 20 || /Transaction numbers/i.test(err.message || '')) {
      throw new ApiError(
        500,
        'The database is not configured to support transactions. This requires MongoDB to run as a replica set (Atlas provides this by default) — see README "Common errors".'
      );
    }
    throw err;
  }

  await loan.populate(POPULATE_FIELDS);

  return res.status(200).json({
    success: true,
    message: 'Borrow request approved. A loan has been created.',
    data: { loan: toPublicLoan(loan) },
  });
});

// @route   PATCH /api/borrow-requests/:id/reject
// @access  Private (item owner only)
const rejectBorrowRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid borrow request id.');

  const errors = validateRejectionReason(req.body);
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  const request = await BorrowRequest.findById(id);
  if (!request || request.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Borrow request not found.');
  }
  if (request.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the item owner can reject this request.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, `This request has already been ${request.status}.`);
  }

  request.status = 'rejected';
  request.rejectionReason = req.body.rejectionReason.trim();
  await request.save();
  await request.populate(POPULATE_FIELDS);

  return res.status(200).json({
    success: true,
    message: 'Borrow request rejected.',
    data: { borrowRequest: toPublicBorrowRequest(request) },
  });
});

// @route   PATCH /api/borrow-requests/:id/cancel
// @access  Private (borrower only)
const cancelBorrowRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid borrow request id.');

  const request = await BorrowRequest.findById(id);
  if (!request || request.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Borrow request not found.');
  }
  if (request.borrower.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the borrower can cancel this request.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, `Only pending requests can be cancelled (this one is ${request.status}).`);
  }

  request.status = 'cancelled';
  await request.save();
  await request.populate(POPULATE_FIELDS);

  return res.status(200).json({
    success: true,
    message: 'Borrow request cancelled.',
    data: { borrowRequest: toPublicBorrowRequest(request) },
  });
});

module.exports = {
  createBorrowRequest,
  getMyBorrowRequests,
  getReceivedBorrowRequests,
  getBorrowRequestById,
  approveBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  toPublicBorrowRequest,
};
