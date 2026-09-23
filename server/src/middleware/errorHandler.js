const ApiError = require('../utils/ApiError');

/**
 * Catches requests to routes that don't exist and forwards a 404
 * ApiError to the centralized error handler below.
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized error handler. Must be registered last, after all routes.
 * Normalizes Mongoose validation/cast/duplicate-key errors into clean
 * 4xx responses, and never leaks stack traces or internal details in
 * production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';

  // Mongoose validation error (e.g. failed schema validators).
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  }

  // Mongoose bad ObjectId (e.g. malformed :id param).
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field "${err.path}".`;
  }

  // MongoDB duplicate key error (e.g. unique email collision that slips
  // past the explicit check due to a race condition).
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists.`;
  }

  // Malformed JSON body sent by the client.
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  if (statusCode === 500) {
    // Never leak internal error details for unexpected/server errors.
    console.error(err);
    message = 'Internal server error.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };
