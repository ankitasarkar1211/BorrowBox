const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the Bearer JWT on the Authorization header and attaches the
 * corresponding user (minus password) to req.user. Rejects with 401 on
 * any failure (missing header, invalid/expired token, deleted user).
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized. Token is invalid or expired.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized. User no longer exists.');
  }

  // Added for the admin module: a deactivated account can hold a
  // still-valid JWT (issued before deactivation) — checking here, on
  // every request, is what actually stops it from taking further
  // action, not just at login. Historical data isn't touched by this;
  // only the ability to keep acting is.
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.');
  }

  req.user = user;
  next();
});

/**
 * Restricts access to users with role === 'admin'. Must run after
 * `protect`, since it relies on req.user being set.
 *
 * This module does not expose any admin-only routes yet — it only
 * establishes the middleware so future modules (e.g. moderating
 * listings) can reuse it by adding `adminOnly` after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin privileges required.');
  }
  next();
};

module.exports = { protect, adminOnly };
