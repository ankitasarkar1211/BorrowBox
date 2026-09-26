const mongoose = require('mongoose');
const Item = require('../models/Item');
const Loan = require('../models/Loan');
const BorrowRequest = require('../models/BorrowRequest');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const {
  validateCreateItemInput,
  validateUpdateItemInput,
  parseListQuery,
} = require('../utils/itemValidators');
const { validateBorrowDates } = require('../utils/dateValidators');
const { findOverlappingLoans } = require('../utils/availability');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Shapes an Item document (optionally with a populated owner) into the
 * object returned to clients.
 */
const toPublicItem = (item) => {
  const obj = item.toObject ? item.toObject() : item;
  const owner =
    obj.owner && typeof obj.owner === 'object' && obj.owner.name !== undefined
      ? { id: obj.owner._id, name: obj.owner.name, avatarUrl: obj.owner.avatarUrl }
      : obj.owner;

  return {
    id: obj._id,
    title: obj.title,
    description: obj.description,
    category: obj.category,
    condition: obj.condition,
    images: obj.images,
    owner,
    communityId: obj.communityId,
    creditCost: obj.creditCost,
    purchasePrice: obj.purchasePrice,
    rentalPricePerDay: obj.rentalPricePerDay,
    availabilityStatus: obj.availabilityStatus,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// @route   POST /api/items
// @access  Private
const createItem = asyncHandler(async (req, res) => {
  const validationErrors = validateCreateItemInput(req.body);
  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(' '));
  }

  const { title, description, category, condition, images, creditCost, purchasePrice, rentalPricePerDay } = req.body;

  // Ownership and community are NEVER taken from the request body —
  // always derived from the authenticated user (req.user, set by the
  // `protect` middleware). This prevents a client from creating an
  // item "owned" by someone else or planting it in another community.
  const item = await Item.create({
    title: title.trim(),
    description: description.trim(),
    category,
    condition,
    images: Array.isArray(images) ? images.map((url) => url.trim()) : [],
    owner: req.user._id,
    communityId: req.user.communityId,
    creditCost,
    purchasePrice: purchasePrice === undefined ? null : purchasePrice,
    rentalPricePerDay: rentalPricePerDay === undefined ? null : rentalPricePerDay,
  });

  return res.status(201).json({
    success: true,
    message: 'Item created successfully.',
    data: { item: toPublicItem(item) },
  });
});

// @route   GET /api/items
// @access  Private
const getItems = asyncHandler(async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.errors.length > 0) {
    throw new ApiError(400, parsed.errors.join(' '));
  }

  const { search, category, condition, page, limit, sort } = parsed;

  // Community scoping is mandatory and always comes from the
  // authenticated user — never from a query param — so a member of
  // one community can never discover another community's items.
  const filter = { communityId: req.user.communityId };

  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Item.find(filter)
      .populate('owner', 'name avatarUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Item.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: items.map(toPublicItem),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    },
  });
});

// @route   GET /api/items/:id
// @access  Private
const getItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id.');
  }

  const item = await Item.findById(id).populate('owner', 'name avatarUrl');

  // Return 404 (not 403) when the item exists but belongs to a
  // different community — this avoids confirming to a client that an
  // item id from another community exists at all.
  if (!item || item.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Item not found.');
  }

  return res.status(200).json({
    success: true,
    data: { item: toPublicItem(item) },
  });
});

// @route   PUT /api/items/:id
// @access  Private (owner only)
const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id.');
  }

  // owner and communityId can never be changed via this endpoint,
  // regardless of what the client sends.
  const { owner, communityId, ...updatableFields } = req.body;

  const validationErrors = validateUpdateItemInput(updatableFields);
  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(' '));
  }

  const item = await Item.findById(id);

  if (!item || item.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Item not found.');
  }

  if (item.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own listings.');
  }

  const allowedFields = [
    'title',
    'description',
    'category',
    'condition',
    'images',
    'creditCost',
    'purchasePrice',
    'rentalPricePerDay',
    'availabilityStatus',
  ];

  allowedFields.forEach((field) => {
    if (updatableFields[field] !== undefined) {
      item[field] = typeof updatableFields[field] === 'string' ? updatableFields[field].trim() : updatableFields[field];
    }
  });

  await item.save();

  return res.status(200).json({
    success: true,
    message: 'Item updated successfully.',
    data: { item: toPublicItem(item) },
  });
});

// @route   DELETE /api/items/:id
// @access  Private (owner only)
const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id.');
  }

  const item = await Item.findById(id);

  if (!item || item.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Item not found.');
  }

  if (item.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own listings.');
  }

  // Edge case fixed in the final security audit: deleting an item out
  // from under a borrower who currently has it (or is waiting to hear
  // back on a request for it) would orphan an active transaction. This
  // mirrors the same check the admin item-removal endpoint uses.
  // Historical (returned) loans and resolved (non-pending) requests
  // don't block deletion — every toPublic* shaper in this codebase
  // already tolerates a since-deleted item reference gracefully.
  const [hasActiveLoan, hasPendingRequest] = await Promise.all([
    Loan.exists({ item: item._id, status: 'active' }),
    BorrowRequest.exists({ item: item._id, status: 'pending' }),
  ]);
  if (hasActiveLoan) {
    throw new ApiError(409, 'Cannot delete an item with an active loan — wait for it to be returned first.');
  }
  if (hasPendingRequest) {
    throw new ApiError(409, 'Cannot delete an item with pending borrow requests — reject or wait for them to resolve first.');
  }

  await item.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Item deleted successfully.',
  });
});

// @route   GET /api/items/:id/availability
// @access  Private
//
// Added for the borrowing module. Reuses the same date validation and
// overlap logic the borrow-request endpoints use, so "can I request
// this?" and "will approval succeed?" are always answered by the same
// rule. Does not require or create a borrow request.
const checkItemAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id.');
  }

  const item = await Item.findById(id);
  if (!item || item.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Item not found.');
  }

  const dateResult = validateBorrowDates(req.query);
  if (dateResult.errors.length > 0) {
    throw new ApiError(400, dateResult.errors.join(' '));
  }
  const { startDate, endDate } = dateResult;

  const overlapping = await findOverlappingLoans({ itemId: item._id, startDate, endDate });
  const isManuallyPaused = item.availabilityStatus === 'unavailable';
  const available = !isManuallyPaused && overlapping.length === 0;

  const data = { itemId: item._id, startDate, endDate, available };

  if (!available) {
    // Enough to act on, without exposing who holds the conflicting
    // loan or any other private detail.
    data.reason = isManuallyPaused ? 'unavailable' : 'date_conflict';
  }

  return res.status(200).json({ success: true, data });
});

module.exports = { createItem, getItems, getItemById, updateItem, deleteItem, checkItemAvailability };
