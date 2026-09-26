const { MAX_BORROW_DAYS } = require('../utils/dateValidators');

// Tunable MVP thresholds — deliberately simple, explicit constants
// rather than anything learned/fitted, so every recommendation this
// service produces can be explained by pointing at one of these
// numbers plus the `factors` array returned alongside it.
const FREQUENT_USES_PER_MONTH = 8; // roughly twice a week or more
const OCCASIONAL_USES_PER_MONTH_WHEN_UNAVAILABLE = 4;
const BUY_BREAKEVEN_MONTHS = 3;
// Close to (but a bit under) this platform's own 30-day max borrowing
// period (see dateValidators.MAX_BORROW_DAYS) — a need this long-term
// starts to look more like ownership than a short-term borrow anyway.
const LONG_TERM_DAYS_THRESHOLD = 20;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Produces a rule-based BORROW / RENT / BUY recommendation for one
 * item and one usage pattern. Pure function — no I/O, no randomness,
 * no learned parameters — so it's trivially unit-testable and every
 * output is reproducible from its inputs alone.
 *
 * IMPORTANT, HONEST LIMITATION: `creditCost` is denominated in Borrow
 * Credits (this platform's internal, non-monetary currency — earned by
 * lending, never bought), while `purchasePrice` and
 * `rentalPricePerDay` are presumably real currency. This service does
 * NOT invent an exchange rate between the two to force them into one
 * number — that would be a fabricated conversion, not a real one. All
 * three costs are reported side by side in `costComparison`, and the
 * recommendation logic reasons about them as separate signals rather
 * than collapsing them into a single "cheapest" figure.
 *
 * @param {object} params
 * @param {object} params.item - an Item document (or plain object)
 *   with creditCost, purchasePrice, rentalPricePerDay, availabilityStatus
 * @param {number} params.expectedDaysOfUse - length of a single use, in days
 * @param {number} params.expectedUsesPerMonth - how often this need recurs
 * @returns {object} { recommendation, reason, available, costComparison, factors, inputs }
 */
const getRecommendation = ({ item, expectedDaysOfUse, expectedUsesPerMonth }) => {
  const { creditCost, purchasePrice, rentalPricePerDay, availabilityStatus } = item;

  const isAvailable = availabilityStatus === 'available';

  const borrowCost = round2(creditCost * expectedDaysOfUse); // Borrow Credits, per use
  const rentalCostPerUse = rentalPricePerDay != null ? round2(rentalPricePerDay * expectedDaysOfUse) : null;
  const purchaseCost = purchasePrice != null ? round2(purchasePrice) : null; // one-time

  const borrowCostPerMonth = round2(borrowCost * expectedUsesPerMonth);
  const rentalCostPerMonth = rentalCostPerUse != null ? round2(rentalCostPerUse * expectedUsesPerMonth) : null;

  const costComparison = {
    borrowCost,
    borrowCostPerMonth,
    rentalCostPerUse,
    rentalCostPerMonth,
    purchaseCost,
  };
  const inputs = { expectedDaysOfUse, expectedUsesPerMonth };
  const factors = [];

  // --- Item currently unavailable to borrow ---
  if (!isAvailable) {
    factors.push('item.availabilityStatus is not "available"');

    if (purchaseCost != null && expectedUsesPerMonth >= OCCASIONAL_USES_PER_MONTH_WHEN_UNAVAILABLE) {
      factors.push(`expectedUsesPerMonth (${expectedUsesPerMonth}) >= ${OCCASIONAL_USES_PER_MONTH_WHEN_UNAVAILABLE}`);
      return {
        recommendation: 'BUY',
        reason: `This item isn't available to borrow right now, and you expect to use something like it ${expectedUsesPerMonth}+ times a month — buying avoids waiting on availability.`,
        available: false,
        costComparison,
        factors,
        inputs,
      };
    }

    if (rentalCostPerUse != null) {
      return {
        recommendation: 'RENT',
        reason: "This item isn't available to borrow right now, so renting is the next-best option for occasional use.",
        available: false,
        costComparison,
        factors,
        inputs,
      };
    }

    if (purchaseCost != null) {
      factors.push('no rentalPricePerDay set on this item');
      return {
        recommendation: 'BUY',
        reason: "This item isn't available to borrow right now, and no rental price is listed for it, so buying is the only concrete option available.",
        available: false,
        costComparison,
        factors,
        inputs,
      };
    }

    factors.push('no rentalPricePerDay or purchasePrice set on this item');
    return {
      recommendation: 'BORROW',
      reason: 'This item is not currently available to borrow, and no rental or purchase price is listed for it either. Check back later or look for a similar item in the community.',
      available: false,
      costComparison,
      factors,
      inputs,
    };
  }

  // --- Item is available to borrow ---
  factors.push('item.availabilityStatus is "available"');

  if (expectedDaysOfUse >= LONG_TERM_DAYS_THRESHOLD && purchaseCost != null) {
    factors.push(
      `expectedDaysOfUse (${expectedDaysOfUse}) >= ${LONG_TERM_DAYS_THRESHOLD}`,
      `close to this platform's ${MAX_BORROW_DAYS}-day maximum borrowing period`
    );
    return {
      recommendation: 'BUY',
      reason: `The expected usage period (${expectedDaysOfUse} days) is close to or would exceed this platform's ${MAX_BORROW_DAYS}-day maximum borrowing period, so buying is likely more practical for a need this long-term.`,
      available: true,
      costComparison,
      factors,
      inputs,
    };
  }

  if (expectedUsesPerMonth >= FREQUENT_USES_PER_MONTH && purchaseCost != null) {
    const comparablePerUseCost = rentalCostPerUse != null ? rentalCostPerUse : borrowCost;
    const monthlyComparableCost = comparablePerUseCost * expectedUsesPerMonth;
    const breakEvenMonths = monthlyComparableCost > 0 ? purchaseCost / monthlyComparableCost : Infinity;

    factors.push(`expectedUsesPerMonth (${expectedUsesPerMonth}) >= ${FREQUENT_USES_PER_MONTH}`);

    if (breakEvenMonths <= BUY_BREAKEVEN_MONTHS) {
      factors.push(`estimated buy break-even: ~${round2(breakEvenMonths)} month(s) <= ${BUY_BREAKEVEN_MONTHS}`);
      return {
        recommendation: 'BUY',
        reason: `At ${expectedUsesPerMonth} uses/month, buying would pay for itself in about ${Math.max(Math.ceil(breakEvenMonths), 1)} month(s) compared to repeatedly borrowing or renting.`,
        available: true,
        costComparison,
        factors,
        inputs,
      };
    }

    factors.push(`estimated buy break-even: ~${round2(breakEvenMonths)} month(s) > ${BUY_BREAKEVEN_MONTHS}`);
  }

  return {
    recommendation: 'BORROW',
    reason: 'This item is available to borrow right now, which only costs Borrow Credits — not money — making it the cheapest real option for your expected usage.',
    available: true,
    costComparison,
    factors,
    inputs,
  };
};

module.exports = {
  getRecommendation,
  FREQUENT_USES_PER_MONTH,
  OCCASIONAL_USES_PER_MONTH_WHEN_UNAVAILABLE,
  BUY_BREAKEVEN_MONTHS,
  LONG_TERM_DAYS_THRESHOLD,
};
