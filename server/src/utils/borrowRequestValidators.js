const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validates the non-date fields of a create-borrow-request body
 * (itemId, message). Date validation is handled separately by
 * validateBorrowDates in dateValidators.js so it can be reused by the
 * availability-check endpoint too.
 */
const validateCreateBorrowRequestInput = (body) => {
  const errors = [];
  const { itemId, message } = body;

  if (!itemId || typeof itemId !== 'string' || !isValidObjectId(itemId)) {
    errors.push('A valid itemId is required.');
  }

  if (message !== undefined && message !== null) {
    if (typeof message !== 'string') {
      errors.push('message must be a string.');
    } else if (message.trim().length > 500) {
      errors.push('message must be at most 500 characters.');
    }
  }

  return errors;
};

const validateRejectionReason = (body) => {
  const errors = [];
  const { rejectionReason } = body;

  if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 1) {
    errors.push('rejectionReason is required.');
  } else if (rejectionReason.trim().length > 500) {
    errors.push('rejectionReason must be at most 500 characters.');
  }

  return errors;
};

module.exports = { validateCreateBorrowRequestInput, validateRejectionReason, isValidObjectId };
