const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const BorrowRequest = require('../models/BorrowRequest');
const Loan = require('../models/Loan');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, parseSort } = require('../utils/listQueryHelpers');
const { parseListQuery } = require('../utils/itemValidators');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Escapes regex metacharacters in a user-supplied search term before
// it's used inside a $regex filter — without this, a term like ".*"
// would be interpreted as a regex pattern instead of a literal string
// (a classic ReDoS/unsafe-query surface for any free-text search box).
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toAdminUser = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    communityId: obj.communityId,
    creditsBalance: obj.creditsBalance,
    isActive: obj.isActive,
    avatarUrl: obj.avatarUrl,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    // password is excluded by the schema's select:false default and is
    // never explicitly selected anywhere in this controller.
  };
};

const toAdminItem = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const owner =
    obj.owner && typeof obj.owner === 'object' && obj.owner.name !== undefined
      ? { id: obj.owner._id, name: obj.owner.name, email: obj.owner.email }
      : obj.owner;
  return {
    id: obj._id,
    title: obj.title,
    category: obj.category,
    condition: obj.condition,
    communityId: obj.communityId,
    creditCost: obj.creditCost,
    availabilityStatus: obj.availabilityStatus,
    owner,
    createdAt: obj.createdAt,
  };
};

// @route   GET /api/admin/users
// @access  Private (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt', 'name', 'email'], 'createdAt', -1);
  if (sortResult.errors.length > 0) throw new ApiError(400, sortResult.errors.join(' '));

  const filter = {};

  if (req.query.search !== undefined) {
    const term = String(req.query.search).trim();
    if (term.length > 0) {
      const pattern = escapeRegex(term);
      filter.$or = [{ name: { $regex: pattern, $options: 'i' } }, { email: { $regex: pattern, $options: 'i' } }];
    }
  }

  if (req.query.communityId !== undefined) {
    filter.communityId = String(req.query.communityId).trim();
  }

  if (req.query.isActive !== undefined) {
    if (req.query.isActive !== 'true' && req.query.isActive !== 'false') {
      throw new ApiError(400, 'isActive must be "true" or "false".');
    }
    filter.isActive = req.query.isActive === 'true';
  }

  if (req.query.role !== undefined) {
    if (!['user', 'admin'].includes(req.query.role)) {
      throw new ApiError(400, 'role must be "user" or "admin".');
    }
    filter.role = req.query.role;
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort(sortResult.sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users: users.map(toAdminUser),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   GET /api/admin/users/:id
// @access  Private (admin only)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid user id.');

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');

  return res.status(200).json({ success: true, data: { user: toAdminUser(user) } });
});

// @route   PATCH /api/admin/users/:id/status
// @access  Private (admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid user id.');

  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive is required and must be true or false.');
  }

  // Prevents an admin from locking themselves out — a small, deliberate
  // guard rather than a generic rule against deactivating other admins,
  // since the brief doesn't ask for the latter.
  if (id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own active status.');
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');

  user.isActive = isActive;
  await user.save();

  return res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'}.`,
    data: { user: toAdminUser(user) },
  });
});

// @route   GET /api/admin/items
// @access  Private (admin only)
//
// The one deliberate exception to community scoping in this codebase:
// every other item endpoint filters by req.user.communityId, but an
// admin needs to see and moderate items across every community. That's
// safe here specifically because this route is gated by `adminOnly`.
const getAdminItems = asyncHandler(async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.errors.length > 0) throw new ApiError(400, parsed.errors.join(' '));

  const { search, category, condition, page, limit, sort } = parsed;

  const filter = {};
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (search) filter.$text = { $search: search };
  if (req.query.communityId !== undefined) {
    filter.communityId = String(req.query.communityId).trim();
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Item.find(filter).populate('owner', 'name email').sort(sort).skip(skip).limit(limit),
    Item.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: items.map(toAdminItem),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

// @route   DELETE /api/admin/items/:id
// @access  Private (admin only)
const deleteAdminItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid item id.');

  const item = await Item.findById(id);
  if (!item) throw new ApiError(404, 'Item not found.');

  // Safety check before removal: don't orphan a currently-active
  // borrowing or a request someone is still waiting on. Historical
  // (returned) loans and resolved (non-pending) requests don't block
  // this — they already tolerate a missing item reference gracefully
  // (every toPublic* shaper in this codebase checks truthiness before
  // reading populated fields), so removing the item just means those
  // old records show a null `item` from then on, which is expected.
  const [hasActiveLoan, hasPendingRequest] = await Promise.all([
    Loan.exists({ item: id, status: 'active' }),
    BorrowRequest.exists({ item: id, status: 'pending' }),
  ]);

  if (hasActiveLoan) {
    throw new ApiError(409, 'Cannot remove an item with an active loan — wait for it to be returned first.');
  }
  if (hasPendingRequest) {
    throw new ApiError(409, 'Cannot remove an item with pending borrow requests — resolve them first.');
  }

  await item.deleteOne();

  return res.status(200).json({ success: true, message: 'Item removed.' });
});

// @route   GET /api/admin/stats
// @access  Private (admin only)
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalItems,
    totalBorrowRequests,
    activeLoans,
    returnedLoans,
    totalReviews,
    creditAgg,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Item.countDocuments({}),
    BorrowRequest.countDocuments({}),
    Loan.countDocuments({ status: 'active' }),
    Loan.countDocuments({ status: 'returned' }),
    Review.countDocuments({}),
    // Sum of every user's current balance — a safely calculable,
    // always-consistent figure (never stored/cached) since it's just
    // an aggregate over the same `creditsBalance` field every credit
    // operation already maintains.
    User.aggregate([{ $group: { _id: null, total: { $sum: '$creditsBalance' } } }]),
  ]);

  const totalCreditsInCirculation = creditAgg.length > 0 ? creditAgg[0].total : 0;

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalItems,
      totalBorrowRequests,
      activeLoans,
      returnedLoans,
      totalReviews,
      totalCreditsInCirculation,
    },
  });
});

module.exports = { getUsers, getUserById, updateUserStatus, getAdminItems, deleteAdminItem, getStats };
