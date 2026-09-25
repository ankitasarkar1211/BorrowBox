const Loan = require('../models/Loan');
const Notification = require('../models/Notification');
const { safeNotify } = require('./notificationService');
const { normalizeToUTCDate } = require('../utils/dateValidators');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Has a `type` notification already been sent for this loan? Checked
 * before creating either a due-soon or an overdue notification so
 * running this job more than once (or twice in the same day, or after
 * a crash/restart) never creates duplicates — this is the entire
 * "prevent duplicate reminders" requirement, enforced by a plain query
 * rather than any separate lock/flag on the Loan itself.
 */
const alreadyNotified = (loan, type) =>
  Notification.exists({
    recipient: loan.borrower,
    type,
    relatedEntityType: 'Loan',
    relatedEntityId: loan._id,
  });

/**
 * Scans active loans and creates:
 * - a `loan_due_soon` notification for loans whose endDate is
 *   tomorrow (UTC calendar day),
 * - a `loan_overdue` notification for loans whose endDate has already
 *   passed and are still `status: 'active'` (i.e. not yet returned —
 *   see Loan model comments on why "overdue" is a computed label, not
 *   a persisted status; this job never writes to Loan.status).
 *
 * Only ever reads Loan and writes Notification — it never marks a
 * loan returned or otherwise changes borrowing state, preserving the
 * existing Loan state machine exactly as documented.
 *
 * Returns a small summary object, useful both for the manual trigger
 * endpoint's response and for logging when run on a schedule.
 */
const runReturnReminders = async () => {
  const today = normalizeToUTCDate(new Date());
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);

  const summary = { dueSoonChecked: 0, dueSoonCreated: 0, overdueChecked: 0, overdueCreated: 0 };

  const dueSoonLoans = await Loan.find({ status: 'active', endDate: tomorrow }).populate('item', 'title');
  summary.dueSoonChecked = dueSoonLoans.length;

  for (const loan of dueSoonLoans) {
    // eslint-disable-next-line no-await-in-loop
    if (await alreadyNotified(loan, 'loan_due_soon')) continue;
    const itemTitle = loan.item && loan.item.title ? ` "${loan.item.title}"` : '';
    // eslint-disable-next-line no-await-in-loop
    await safeNotify({
      recipient: loan.borrower,
      type: 'loan_due_soon',
      title: 'Return due tomorrow',
      message: `Your borrowed item${itemTitle} is due back tomorrow.`,
      relatedEntityType: 'Loan',
      relatedEntityId: loan._id,
    });
    summary.dueSoonCreated += 1;
  }

  const overdueLoans = await Loan.find({ status: 'active', endDate: { $lt: today } }).populate('item', 'title');
  summary.overdueChecked = overdueLoans.length;

  for (const loan of overdueLoans) {
    // eslint-disable-next-line no-await-in-loop
    if (await alreadyNotified(loan, 'loan_overdue')) continue;
    const itemTitle = loan.item && loan.item.title ? ` "${loan.item.title}"` : '';
    // eslint-disable-next-line no-await-in-loop
    await safeNotify({
      recipient: loan.borrower,
      type: 'loan_overdue',
      title: 'Item overdue',
      message: `Your borrowed item${itemTitle} is overdue for return.`,
      relatedEntityType: 'Loan',
      relatedEntityId: loan._id,
    });
    summary.overdueCreated += 1;
  }

  return summary;
};

module.exports = { runReturnReminders };
