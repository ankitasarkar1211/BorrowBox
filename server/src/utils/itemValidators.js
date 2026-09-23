const { ITEM_CONDITIONS, AVAILABILITY_STATUSES, CATEGORIES } = require('../models/Item');

const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;
const isValidUrl = (val) => typeof val === 'string' && /^https?:\/\/.+/i.test(val.trim());

/**
 * Validates the body for creating an item. Returns an array of
 * human-readable error strings (empty if valid).
 */
const validateCreateItemInput = (body) => {
  const { title, description, category, condition, images, creditCost, purchasePrice, rentalPricePerDay } = body;
  const errors = [];

  if (!isNonEmptyString(title) || title.trim().length < 2 || title.trim().length > 100) {
    errors.push('title is required and must be 2-100 characters long.');
  }

  if (!isNonEmptyString(description) || description.trim().length < 10 || description.trim().length > 2000) {
    errors.push('description is required and must be 10-2000 characters long.');
  }

  if (!isNonEmptyString(category) || !CATEGORIES.includes(category)) {
    errors.push(`category is required and must be one of: ${CATEGORIES.join(', ')}.`);
  }

  if (!isNonEmptyString(condition) || !ITEM_CONDITIONS.includes(condition)) {
    errors.push(`condition is required and must be one of: ${ITEM_CONDITIONS.join(', ')}.`);
  }

  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('images must be an array of URL strings.');
    } else if (images.length > 5) {
      errors.push('images can contain at most 5 URLs.');
    } else if (!images.every(isValidUrl)) {
      errors.push('every entry in images must be a valid http(s) URL.');
    }
  }

  if (creditCost === undefined || creditCost === null || typeof creditCost !== 'number' || Number.isNaN(creditCost) || creditCost < 0) {
    errors.push('creditCost is required and must be a number >= 0.');
  }

  if (purchasePrice !== undefined && purchasePrice !== null) {
    if (typeof purchasePrice !== 'number' || Number.isNaN(purchasePrice) || purchasePrice < 0) {
      errors.push('purchasePrice must be a number >= 0 when provided.');
    }
  }

  if (rentalPricePerDay !== undefined && rentalPricePerDay !== null) {
    if (typeof rentalPricePerDay !== 'number' || Number.isNaN(rentalPricePerDay) || rentalPricePerDay < 0) {
      errors.push('rentalPricePerDay must be a number >= 0 when provided.');
    }
  }

  return errors;
};

/**
 * Validates the body for updating an item. All fields are optional,
 * but whatever is provided must be valid. Ownership, community, and
 * disallowed fields (owner, communityId) are checked separately in the
 * controller, not here.
 */
const validateUpdateItemInput = (body) => {
  const { title, description, category, condition, images, creditCost, purchasePrice, rentalPricePerDay, availabilityStatus } = body;
  const errors = [];

  if (title !== undefined && (!isNonEmptyString(title) || title.trim().length < 2 || title.trim().length > 100)) {
    errors.push('title must be 2-100 characters long.');
  }

  if (description !== undefined && (!isNonEmptyString(description) || description.trim().length < 10 || description.trim().length > 2000)) {
    errors.push('description must be 10-2000 characters long.');
  }

  if (category !== undefined && !CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}.`);
  }

  if (condition !== undefined && !ITEM_CONDITIONS.includes(condition)) {
    errors.push(`condition must be one of: ${ITEM_CONDITIONS.join(', ')}.`);
  }

  if (availabilityStatus !== undefined && !AVAILABILITY_STATUSES.includes(availabilityStatus)) {
    errors.push(`availabilityStatus must be one of: ${AVAILABILITY_STATUSES.join(', ')}.`);
  }

  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('images must be an array of URL strings.');
    } else if (images.length > 5) {
      errors.push('images can contain at most 5 URLs.');
    } else if (!images.every(isValidUrl)) {
      errors.push('every entry in images must be a valid http(s) URL.');
    }
  }

  if (creditCost !== undefined && (typeof creditCost !== 'number' || Number.isNaN(creditCost) || creditCost < 0)) {
    errors.push('creditCost must be a number >= 0.');
  }

  if (purchasePrice !== undefined && purchasePrice !== null) {
    if (typeof purchasePrice !== 'number' || Number.isNaN(purchasePrice) || purchasePrice < 0) {
      errors.push('purchasePrice must be a number >= 0 when provided.');
    }
  }

  if (rentalPricePerDay !== undefined && rentalPricePerDay !== null) {
    if (typeof rentalPricePerDay !== 'number' || Number.isNaN(rentalPricePerDay) || rentalPricePerDay < 0) {
      errors.push('rentalPricePerDay must be a number >= 0 when provided.');
    }
  }

  return errors;
};

/**
 * Parses and clamps list-query params (search, category, condition,
 * page, limit, sort) into a safe shape. Never trusts raw client input
 * for pagination bounds or sort fields.
 */
const ALLOWED_SORT_FIELDS = ['createdAt', 'creditCost', 'title'];
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const parseListQuery = (query) => {
  const errors = [];

  const { search, category, condition } = query;

  if (category !== undefined && !CATEGORIES.includes(category)) {
    errors.push(`category filter must be one of: ${CATEGORIES.join(', ')}.`);
  }

  if (condition !== undefined && !ITEM_CONDITIONS.includes(condition)) {
    errors.push(`condition filter must be one of: ${ITEM_CONDITIONS.join(', ')}.`);
  }

  let page = parseInt(query.page, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  // sort param format: "field" (ascending) or "-field" (descending).
  let sortField = 'createdAt';
  let sortDirection = -1; // newest first by default
  if (typeof query.sort === 'string' && query.sort.trim().length > 0) {
    const raw = query.sort.trim();
    const descending = raw.startsWith('-');
    const field = descending ? raw.slice(1) : raw;
    if (!ALLOWED_SORT_FIELDS.includes(field)) {
      errors.push(`sort must be one of: ${ALLOWED_SORT_FIELDS.join(', ')} (optionally prefixed with "-" for descending).`);
    } else {
      sortField = field;
      sortDirection = descending ? -1 : 1;
    }
  }

  return {
    errors,
    search: typeof search === 'string' && search.trim().length > 0 ? search.trim() : null,
    category: category || null,
    condition: condition || null,
    page,
    limit,
    sort: { [sortField]: sortDirection },
  };
};

module.exports = { validateCreateItemInput, validateUpdateItemInput, parseListQuery };
