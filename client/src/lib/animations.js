import { animate, stagger } from 'animejs';

/**
 * Animates a numeric counter smoothly using Anime.js v4
 * @param {HTMLElement} element 
 * @param {number} start 
 * @param {number} end 
 * @param {number} duration 
 * @param {function} formatFn 
 */
export function animateCounter(element, start, end, duration = 1000, formatFn = (n) => Math.round(n)) {
  if (!element) return;
  const obj = { val: start };
  return animate(obj, {
    val: end,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      if (element) {
        element.textContent = formatFn(obj.val);
      }
    },
  });
}

/**
 * Micro-pop animation for interactive buttons, badge changes, or actions
 * @param {HTMLElement} target 
 */
export function animatePop(target) {
  if (!target) return;
  return animate(target, {
    scale: [
      { to: 1.15, duration: 140, ease: 'outQuad' },
      { to: 1, duration: 200, ease: 'outElastic(1, .6)' },
    ],
  });
}

/**
 * Staggered entrance for list cards, grid items, or table rows
 * @param {HTMLElement[] | string} targets 
 * @param {object} options 
 */
export function animateStagger(targets, options = {}) {
  if (!targets) return;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: options.duration || 600,
    delay: stagger(options.stagger || 60, { start: options.delay || 50 }),
    ease: 'outCubic',
  });
}

/**
 * Pulse glowing ring for highlighted items or urgent reminders
 * @param {HTMLElement} target 
 */
export function animatePulseRing(target) {
  if (!target) return;
  return animate(target, {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    duration: 1600,
    loop: true,
    ease: 'inOutSine',
  });
}
