const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const parsePagination = (query) => {
  let page = parseInt(query.page, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit };
};

/**
 * sort param format: "field" (ascending) or "-field" (descending).
 */
const parseSort = (query, allowedFields, defaultField = 'createdAt', defaultDirection = -1) => {
  const errors = [];
  let field = defaultField;
  let direction = defaultDirection;

  if (typeof query.sort === 'string' && query.sort.trim().length > 0) {
    const raw = query.sort.trim();
    const descending = raw.startsWith('-');
    const requestedField = descending ? raw.slice(1) : raw;

    if (!allowedFields.includes(requestedField)) {
      errors.push(`sort must be one of: ${allowedFields.join(', ')} (optionally prefixed with "-" for descending).`);
    } else {
      field = requestedField;
      direction = descending ? -1 : 1;
    }
  }

  return { errors, sort: { [field]: direction } };
};

const parseStatusFilter = (query, allowedStatuses) => {
  const errors = [];
  let status = null;

  if (query.status !== undefined) {
    if (!allowedStatuses.includes(query.status)) {
      errors.push(`status must be one of: ${allowedStatuses.join(', ')}.`);
    } else {
      status = query.status;
    }
  }

  return { errors, status };
};

module.exports = { parsePagination, parseSort, parseStatusFilter, MAX_LIMIT, DEFAULT_LIMIT };
