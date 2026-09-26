import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM d, yyyy · h:mm a');
  } catch {
    return dateString;
  }
}

export function getDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  try {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((e - s) / msPerDay);
  } catch {
    return 0;
  }
}

export function formatCredits(amount) {
  if (amount === undefined || amount === null) return '0 Credits';
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount} ${Math.abs(amount) === 1 ? 'Credit' : 'Credits'}`;
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
