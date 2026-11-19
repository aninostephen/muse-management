import { BadRequestException } from '@nestjs/common';

export interface DateWindowChunk {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startMs: string; // Unix timestamp in milliseconds
  endMs: string; // Unix timestamp in milliseconds
}

/**
 * Converts a value in the smallest currency unit (cents) to standard decimal dollars.
 * Preserves null/undefined so missing data is never silently converted to 0.
 */
export function centsToDollars(
  cents: string | number | null | undefined,
): number | null {
  if (cents === null || cents === undefined || cents === '') {
    return null;
  }
  const num = typeof cents === 'number' ? cents : Number(cents);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.round(num) / 100;
}

/**
 * Parses a numeric cents value safely into integer cents, returning null if missing/invalid.
 */
export function parseCents(
  cents: string | number | null | undefined,
): number | null {
  if (cents === null || cents === undefined || cents === '') {
    return null;
  }
  const num = typeof cents === 'number' ? cents : Number(cents);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.round(num);
}

/**
 * Formats a Date object as YYYY-MM-DD in UTC.
 */
export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Resolves optional startDate and endDate (YYYY-MM-DD) into a validated range
 * (defaulting to the last 30 days ending today in UTC) and splits ranges > 31 days
 * into contiguous chunks of at most 30 days to satisfy Infloww's 31-day query limit.
 */
export function resolveDateWindows(
  startDateInput?: string,
  endDateInput?: string,
  defaultDays = 30,
): {
  startDate: string;
  endDate: string;
  windows: DateWindowChunk[];
} {
  const now = new Date();
  const nowMs = now.getTime();
  const todayStr = toUtcDateString(now);

  if (endDateInput && Number.isNaN(new Date(`${endDateInput}T00:00:00.000Z`).getTime())) {
    throw new BadRequestException(`Invalid endDate: ${endDateInput}`);
  }
  if (
    startDateInput &&
    Number.isNaN(new Date(`${startDateInput}T00:00:00.000Z`).getTime())
  ) {
    throw new BadRequestException(`Invalid startDate: ${startDateInput}`);
  }
  if (startDateInput && endDateInput && startDateInput > endDateInput) {
    throw new BadRequestException('startDate must be before or equal to endDate');
  }

  // Clamp endDate to today (UTC) so Infloww never receives a future endTime
  const endDateStr =
    !endDateInput || endDateInput > todayStr ? todayStr : endDateInput;
  const endUtc = new Date(`${endDateStr}T23:59:59.999Z`);

  let startDateStr = startDateInput;
  if (!startDateStr) {
    const defaultStart = new Date(
      endUtc.getTime() - (defaultDays - 1) * 86400 * 1000,
    );
    startDateStr = toUtcDateString(defaultStart);
  } else if (startDateStr > endDateStr) {
    startDateStr = endDateStr;
  }

  const startUtc = new Date(`${startDateStr}T00:00:00.000Z`);

  if (startUtc.getTime() > endUtc.getTime()) {
    throw new BadRequestException('startDate must be before or equal to endDate');
  }

  // Max historical range in Infloww API is 366 days
  const maxSpanDays = 365;
  const totalDays = Math.ceil(
    (endUtc.getTime() - startUtc.getTime()) / (86400 * 1000),
  );
  if (totalDays > maxSpanDays) {
    throw new BadRequestException(
      `Date range cannot exceed ${maxSpanDays} days (Infloww API historical limit).`,
    );
  }

  // Split into chunks of <= 30 days (Infloww max window is 31 days per request)
  const windows: DateWindowChunk[] = [];
  const maxWindowMs = 30 * 86400 * 1000;
  let cursorStart = new Date(startUtc.getTime());

  while (cursorStart.getTime() <= endUtc.getTime()) {
    const chunkStartStr = toUtcDateString(cursorStart);
    const chunkStartUtc = new Date(`${chunkStartStr}T00:00:00.000Z`);

    const rawChunkEnd = new Date(chunkStartUtc.getTime() + maxWindowMs - 1);
    const chunkEndUtc =
      rawChunkEnd.getTime() < endUtc.getTime() ? rawChunkEnd : endUtc;
    const chunkEndStr = toUtcDateString(chunkEndUtc);
    const normalizedChunkEndUtc = new Date(`${chunkEndStr}T23:59:59.999Z`);

    // Infloww API rejects endTime timestamps in the future ("Parameter 'endTime' must be a past or present time").
    // Clamp endMs so it never exceeds the current timestamp (nowMs).
    const clampedEndMs = Math.min(normalizedChunkEndUtc.getTime(), nowMs);
    const safeStartMs = Math.min(chunkStartUtc.getTime(), clampedEndMs);

    windows.push({
      startDate: chunkStartStr,
      endDate: chunkEndStr,
      startMs: String(safeStartMs),
      endMs: String(clampedEndMs),
    });

    cursorStart = new Date(normalizedChunkEndUtc.getTime() + 1);
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    windows,
  };
}

/**
 * Splits an array into chunks of size `chunkSize` (e.g. 10 IDs for Infloww report endpoints).
 */
export function chunkArray<T>(items: T[], chunkSize = 10): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}
