/**
 * Strict data formatting helpers.
 * Per Task-Info.md: Never silently substitute missing data (null / undefined) with 0.
 */

export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  fallback = 'Unavailable',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(
  value: number | null | undefined,
  currency = 'USD',
  fallback = 'Unavailable',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  if (Math.abs(value) >= 10000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatCurrency(value, currency, fallback);
}

export function formatNumber(
  value: number | null | undefined,
  fallback = 'Unavailable',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercentage(
  value: number | null | undefined,
  decimals = 2,
  fallback = 'N/A',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(
  input: string | number | null | undefined,
  fallback = 'N/A',
): string {
  if (input === null || input === undefined || input === '') {
    return fallback;
  }
  const num = Number(input);
  const date =
    Number.isFinite(num) && num > 1000000000
      ? new Date(num)
      : new Date(String(input));

  if (Number.isNaN(date.getTime())) {
    return String(input);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(
  input: string | number | null | undefined,
  fallback = 'N/A',
): string {
  if (input === null || input === undefined || input === '') {
    return fallback;
  }
  const num = Number(input);
  const date =
    Number.isFinite(num) && num > 1000000000
      ? new Date(num)
      : new Date(String(input));

  if (Number.isNaN(date.getTime())) {
    return String(input);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDurationMs(
  ms: number | null | undefined,
  fallback = 'N/A',
): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) {
    return fallback;
  }
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) {
    return `${totalSec}s`;
  }
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}
