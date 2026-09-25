// MVP decision (see README "Borrowing workflow" section for the full
// write-up): a 30-day cap keeps an item from being locked away
// indefinitely by a single request, while comfortably covering a
// semester-project-length loan. Tune via this constant only.
const MAX_BORROW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses any Date-ish input (ISO string, Date, timestamp) and
 * normalizes it to UTC midnight of that calendar day. Returns null on
 * an invalid/unparseable input.
 *
 * Normalizing to UTC midnight means "2026-10-01" and
 * "2026-10-01T23:59:00+05:30" both become the same stored value, so
 * the client's timezone can never shift a booking onto a different
 * calendar day than the one the user picked, and every date
 * comparison in this module (overlap checks, "is it overdue", etc.)
 * is comparing whole calendar days, not instants.
 */
const normalizeToUTCDate = (input) => {
  if (input === undefined || input === null || input === '') return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const todayUTC = () => normalizeToUTCDate(new Date());

/**
 * Whole-day duration between two already-normalized (UTC midnight)
 * Date objects. Used by the borrowing credit calculation
 * (borrowCost = item.creditCost × durationDays) so that module and
 * this one can never disagree on what "N days" means. Safe to call
 * only with dates that have already passed validateBorrowDates (so
 * endDate > startDate and both are UTC-midnight-aligned) — the result
 * is otherwise not guaranteed to be a whole number.
 */
const getDurationDays = (startDate, endDate) => Math.round((endDate - startDate) / MS_PER_DAY);

/**
 * Validates and normalizes startDate/endDate from a request body or
 * query object. Returns { errors, startDate, endDate }; startDate and
 * endDate are normalized Date objects when valid, otherwise null.
 *
 * Decisions:
 * - Same-day borrowing is NOT supported: endDate must be strictly
 *   after startDate, so every loan spans at least 1 full day. This
 *   keeps the overlap math (`newStart < existingEnd && newEnd >
 *   existingStart`) unambiguous — a zero-width range would trivially
 *   never overlap anything and could bypass availability checks.
 * - startDate cannot be before today (UTC calendar day); today itself
 *   is a valid start.
 * - Maximum duration is MAX_BORROW_DAYS (30) days.
 */
const validateBorrowDates = (source) => {
  const errors = [];
  const { startDate: rawStart, endDate: rawEnd } = source || {};

  if (!rawStart) errors.push('startDate is required.');
  if (!rawEnd) errors.push('endDate is required.');
  if (errors.length > 0) return { errors, startDate: null, endDate: null };

  const startDate = normalizeToUTCDate(rawStart);
  const endDate = normalizeToUTCDate(rawEnd);

  if (!startDate) errors.push('startDate is not a valid date.');
  if (!endDate) errors.push('endDate is not a valid date.');
  if (errors.length > 0) return { errors, startDate: null, endDate: null };

  if (startDate < todayUTC()) {
    errors.push('startDate cannot be in the past.');
  }

  if (endDate <= startDate) {
    errors.push(
      'endDate must be after startDate (same-day borrowing is not supported; minimum duration is 1 day).'
    );
  }

  const durationDays = (endDate - startDate) / MS_PER_DAY;
  if (durationDays > MAX_BORROW_DAYS) {
    errors.push(`Borrowing period cannot exceed ${MAX_BORROW_DAYS} days.`);
  }

  if (errors.length > 0) return { errors, startDate: null, endDate: null };

  return { errors: [], startDate, endDate };
};

module.exports = { validateBorrowDates, normalizeToUTCDate, getDurationDays, MAX_BORROW_DAYS };
