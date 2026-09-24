const mongoose = require('mongoose');

const MAX_RETRIES = 3;

/**
 * Runs `fn(session)` inside a MongoDB multi-document transaction,
 * retrying the whole transaction on a TransientTransactionError and
 * retrying just the commit on an UnknownTransactionCommitResult, per
 * MongoDB's official recommended transaction retry pattern. `fn` must
 * pass `session` into every read/write it wants included in the
 * transaction.
 *
 * REQUIREMENT: multi-document transactions only work when MongoDB is
 * running as a replica set. MongoDB Atlas clusters are replica sets by
 * default, so this works there with no extra setup. A local standalone
 * `mongod` (e.g. `mongodb://localhost:27017/...`) does NOT support
 * transactions and will throw "Transaction numbers are only allowed on
 * a replica set member or mongos" — see README "Common errors" for how
 * to run a local single-node replica set instead.
 */
const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });
        const result = await fn(session);
        await commitWithRetry(session);
        return result;
      } catch (err) {
        await session.abortTransaction().catch(() => {});
        const isTransient = Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError');
        if (isTransient && attempt < MAX_RETRIES) {
          continue; // retry the whole transaction from scratch
        }
        throw err;
      }
    }
  } finally {
    session.endSession();
  }
};

const commitWithRetry = async (session) => {
  for (;;) {
    try {
      await session.commitTransaction();
      return;
    } catch (err) {
      const isUnknownResult = Array.isArray(err.errorLabels) && err.errorLabels.includes('UnknownTransactionCommitResult');
      if (isUnknownResult) {
        continue; // safe to retry commitTransaction itself
      }
      throw err;
    }
  }
};

module.exports = withTransaction;
