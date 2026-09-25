const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');

/**
 * Shapes a Mongoose user document into the safe object we return to
 * clients. Password is already excluded via select:false / toJSON, but
 * we build this explicitly so the response shape is easy to reason
 * about and stays correct even if the schema changes later.
 */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  communityId: user.communityId,
  creditsBalance: user.creditsBalance,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, communityId, avatarUrl } = req.body;

  const validationErrors = validateRegisterInput({ name, email, password, communityId });
  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(' '));
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    // 409 Conflict is the more precise status for "resource already exists".
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password, // hashed by the pre-save hook in the model
    communityId: communityId.trim(),
    avatarUrl: avatarUrl || null,
  });

  // Record the welcome balance the User schema's `creditsBalance`
  // default already granted, so it shows up in the user's credit
  // history (GET /api/credits/transactions) rather than appearing as
  // an unexplained starting balance. Guarded against duplicates (in
  // case this ever runs twice for the same user id) and never allowed
  // to fail registration itself — this is bookkeeping for an action
  // that has already succeeded, not a precondition for it.
  try {
    const alreadyHasBonus = await CreditTransaction.exists({ user: user._id, type: 'signup_bonus' });
    if (!alreadyHasBonus) {
      await CreditTransaction.create({
        user: user._id,
        amount: user.creditsBalance,
        type: 'signup_bonus',
        balanceBefore: 0,
        balanceAfter: user.creditsBalance,
        description: 'Welcome bonus for joining BorrowBox.',
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to record signup_bonus transaction:', err.message);
  }

  const token = generateToken(user._id);

  return res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      user: toPublicUser(user),
      token,
    },
  });
});

// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const validationErrors = validateLoginInput({ email, password });
  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(' '));
  }

  const normalizedEmail = email.trim().toLowerCase();

  // password has select:false on the schema, so it must be explicitly requested.
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Deliberately use the same generic message whether the email doesn't
  // exist or the password is wrong, so we never reveal which emails are
  // registered.
  const invalidCredentialsError = new ApiError(401, 'Invalid email or password.');

  if (!user) {
    throw invalidCredentialsError;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw invalidCredentialsError;
  }

  const token = generateToken(user._id);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: toPublicUser(user),
      token,
    },
  });
});

// @route   GET /api/auth/me
// @access  Private (requires valid JWT)
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` auth middleware.
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res.status(200).json({
    success: true,
    data: {
      user: toPublicUser(user),
    },
  });
});

module.exports = { register, login, getMe };
