const cron = require('node-cron');
const { runReturnReminders } = require('../services/reminderService');

/**
 * Schedules the return-reminder job to run once a day at 00:05 UTC —
 * just after midnight, so "tomorrow"/"today" in reminderService (which
 * normalizes everything to UTC calendar days) are freshly rolled over
 * for the whole day's run. Once a day is what the brief calls
 * sufficient for this MVP; no queue, no retry-on-failure beyond what
 * safeNotify already does internally.
 *
 * Call this once from server.js after the DB connection is up. It
 * intentionally does not run the job immediately on startup — use
 * `POST /api/notifications/run-reminders` (admin-only) to trigger it
 * on demand, e.g. for testing.
 */
const startReminderSchedule = () => {
  cron.schedule('5 0 * * *', async () => {
    try {
      const summary = await runReturnReminders();
      console.log(
        `[reminderService] due-soon: ${summary.dueSoonCreated}/${summary.dueSoonChecked}, overdue: ${summary.overdueCreated}/${summary.overdueChecked}`
      );
    } catch (err) {
      console.error('[reminderService] scheduled run failed:', err.message);
    }
  });
};

module.exports = startReminderSchedule;
