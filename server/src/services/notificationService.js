const Notification = require('../models/Notification');

/**
 * Creates a single notification. Callers should invoke this only
 * after the action that triggered it has already succeeded (and, for
 * transactional call sites like borrow-request approval, only after
 * the transaction has committed) — a notification is a side effect of
 * a state change, never a precondition for one.
 */
const createNotification = async ({ recipient, type, title, message, relatedEntityType, relatedEntityId }) => {
  return Notification.create({
    recipient,
    type,
    title,
    message,
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });
};

/**
 * Same as createNotification, but never throws. Every workflow
 * integration point in this module (request created, approved,
 * rejected, cancelled, returned, reviewed, credits moved) calls this
 * instead of createNotification directly, so a transient failure to
 * write a notification can never turn into a failed borrow-request
 * approval, review, etc. — the primary action has already committed
 * by the time this runs.
 */
const safeNotify = async (params) => {
  try {
    await createNotification(params);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to create "${params && params.type}" notification:`, err.message);
  }
};

module.exports = { createNotification, safeNotify };
