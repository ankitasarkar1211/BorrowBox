const mongoose = require('mongoose');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getRecommendation } = require('../services/recommendationService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST /api/recommendations
// @access  Private
const createRecommendation = asyncHandler(async (req, res) => {
  const { itemId, expectedDaysOfUse, expectedUsesPerMonth } = req.body;

  if (!itemId || typeof itemId !== 'string' || !isValidObjectId(itemId)) {
    throw new ApiError(400, 'A valid itemId is required.');
  }
  if (
    expectedDaysOfUse === undefined ||
    expectedDaysOfUse === null ||
    typeof expectedDaysOfUse !== 'number' ||
    !Number.isFinite(expectedDaysOfUse) ||
    expectedDaysOfUse <= 0
  ) {
    throw new ApiError(400, 'expectedDaysOfUse is required and must be a positive number.');
  }
  if (
    expectedUsesPerMonth === undefined ||
    expectedUsesPerMonth === null ||
    typeof expectedUsesPerMonth !== 'number' ||
    !Number.isFinite(expectedUsesPerMonth) ||
    expectedUsesPerMonth < 0
  ) {
    throw new ApiError(400, 'expectedUsesPerMonth is required and must be a non-negative number.');
  }

  const item = await Item.findById(itemId);
  // Same convention as every other item-scoped endpoint: 404, not 403,
  // for an item outside the caller's community — never confirms it exists.
  if (!item || item.communityId !== req.user.communityId) {
    throw new ApiError(404, 'Item not found.');
  }

  const result = getRecommendation({ item, expectedDaysOfUse, expectedUsesPerMonth });

  // Not persisted — the brief allows this, and a recommendation is
  // fully reproducible from its inputs (pure function), so storing it
  // would only ever be a cache, never a source of truth.
  return res.status(200).json({
    success: true,
    data: {
      itemId: item._id,
      itemTitle: item.title,
      ...result,
    },
  });
});

module.exports = { createRecommendation };
