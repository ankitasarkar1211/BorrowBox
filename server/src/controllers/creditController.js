const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, parseSort } = require('../utils/listQueryHelpers');
const { CREDIT_TRANSACTION_TYPES } = require('../models/CreditTransaction');

const toPublicTransaction = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    amount: obj.amount,
    type: obj.type,
    balanceBefore: obj.balanceBefore,
    balanceAfter: obj.balanceAfter,
    loan: obj.loan,
    description: obj.description,
    createdAt: obj.createdAt,
  };
};

// @route   GET /api/credits/balance
// @access  Private
const getBalance = asyncHandler(async (req, res) => {
  // Read fresh from the database rather than trusting req.user (which
  // was loaded once by the `protect` middleware at the start of this
  // request) — a balance figure is exactly the kind of value that
  // should never be served from a possibly-stale in-memory copy.
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found.');

  return res.status(200).json({
    success: true,
    data: { creditsBalance: user.creditsBalance },
  });
});

// @route   GET /api/credits/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const sortResult = parseSort(req.query, ['createdAt'], 'createdAt', -1);

  const errors = [...sortResult.errors];
  let type = null;
  if (req.query.type !== undefined) {
    if (!CREDIT_TRANSACTION_TYPES.includes(req.query.type)) {
      errors.push(`type must be one of: ${CREDIT_TRANSACTION_TYPES.join(', ')}.`);
    } else {
      type = req.query.type;
    }
  }
  if (errors.length > 0) throw new ApiError(400, errors.join(' '));

  // Users may only ever access their own credit history — there is no
  // query parameter or admin override in this module that can widen
  // this filter.
  const filter = { user: req.user._id };
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    CreditTransaction.find(filter).sort(sortResult.sort).skip(skip).limit(limit),
    CreditTransaction.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      transactions: transactions.map(toPublicTransaction),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

module.exports = { getBalance, getTransactions, toPublicTransaction };
