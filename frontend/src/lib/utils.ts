import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert nanosecond timestamp (bigint) to JS Date
export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1_000_000)));
}

// Convert JS Date to nanosecond timestamp (bigint)
export function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

// Format date for display
export function formatDate(ns: bigint): string {
  return nsToDate(ns).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date for input[type=date]
export function formatDateInput(ns: bigint): string {
  const d = nsToDate(ns);
  return d.toISOString().split('T')[0];
}

// Get start of week (Monday)
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Sunday)
export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Format currency
export function formatCurrency(amount: bigint): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Check whether a given Date falls within the specified month/year.
 * If specificDate is provided, checks for an exact calendar-day match instead.
 */
export function isDateInPeriod(
  date: Date,
  month: number,   // 1-12
  year: number,
  specificDate?: Date | null
): boolean {
  if (specificDate) {
    return (
      date.getFullYear() === specificDate.getFullYear() &&
      date.getMonth() === specificDate.getMonth() &&
      date.getDate() === specificDate.getDate()
    );
  }
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

/** Format a period label like "Jul 2025" or "Jul 15, 2025" */
export function formatPeriodLabel(
  month: number,
  year: number,
  specificDate?: Date | null
): string {
  if (specificDate) {
    return specificDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
