const Loan = require('../models/Loan');

/**
 * Two half-open date ranges [aStart, aEnd) and [bStart, bEnd) overlap
 * when aStart < bEnd AND aEnd > bStart. Half-open (not closed) is a
 * deliberate choice: a loan ending on day N and another starting on
 * day N do NOT count as overlapping, so an item can be returned and
 * re-borrowed the same day. See README for the documented boundary
 * test (e.g. Oct 1-5 followed by Oct 5-8 is allowed).
 */
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/**
 * Finds Loans that currently reserve the item and overlap the given
 * date range. Only loans with status "active" block availability —
 * that single persisted status covers the upcoming / in-progress /
 * overdue time-based sub-states (see Loan model), so nothing here
 * needs to know about "today" to decide whether a loan still counts
 * as a reservation. "returned" and "cancelled" loans never block.
 *
 * Pass `session` to run this read inside a MongoDB transaction (used
 * during borrow-request approval, so the check and the loan creation
 * happen against the same snapshot).
 */
const findOverlappingLoans = ({ itemId, startDate, endDate, session }) => {
  const query = {
    item: itemId,
    status: 'active',
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  const findQuery = Loan.find(query);
  if (session) findQuery.session(session);
  return findQuery;
};

const isItemAvailable = async ({ itemId, startDate, endDate, session }) => {
  const overlapping = await findOverlappingLoans({ itemId, startDate, endDate, session });
  return overlapping.length === 0;
};

module.exports = { rangesOverlap, findOverlappingLoans, isItemAvailable };
