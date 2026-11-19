import { BadRequestException } from '@nestjs/common';
import {
  centsToDollars,
  chunkArray,
  parseCents,
  resolveDateWindows,
} from './date-currency.util';

describe('date-currency.util', () => {
  describe('centsToDollars & parseCents (distinguishing 0 vs missing null)', () => {
    it('converts integer and string cents to dollars accurately', () => {
      expect(centsToDollars(7400)).toBe(74);
      expect(centsToDollars('13655')).toBe(136.55);
      expect(centsToDollars(0)).toBe(0);
      expect(centsToDollars('0')).toBe(0);
    });

    it('preserves null for missing/undefined/invalid data rather than substituting 0', () => {
      expect(centsToDollars(null)).toBeNull();
      expect(centsToDollars(undefined)).toBeNull();
      expect(centsToDollars('')).toBeNull();
      expect(centsToDollars('not-a-number')).toBeNull();
      expect(parseCents(null)).toBeNull();
      expect(parseCents(undefined)).toBeNull();
    });
  });

  describe('resolveDateWindows (31-day Infloww API window chunking)', () => {
    it('keeps a 15-day range in a single window', () => {
      const res = resolveDateWindows('2026-10-01', '2026-10-15');
      expect(res.windows).toHaveLength(1);
      expect(res.windows[0].startDate).toBe('2026-10-01');
      expect(res.windows[0].endDate).toBe('2026-10-15');
    });

    it('splits a 65-day range into 3 windows of <= 30 days each', () => {
      const res = resolveDateWindows('2026-09-01', '2026-11-04');
      expect(res.windows.length).toBe(3);
      expect(res.windows[0].startDate).toBe('2026-09-01');
      expect(res.windows[0].endDate).toBe('2026-09-30');
      expect(res.windows[1].startDate).toBe('2026-10-01');
      expect(res.windows[1].endDate).toBe('2026-10-30');
      expect(res.windows[2].startDate).toBe('2026-10-31');
      expect(res.windows[2].endDate).toBe('2026-11-04');
    });

    it('rejects startDate > endDate', () => {
      expect(() => resolveDateWindows('2026-11-10', '2026-11-01')).toThrow(
        BadRequestException,
      );
    });

    it('clamps endMs to present time (<= Date.now()) when endDate is today or in the future', () => {
      const beforeMs = Date.now();
      const res = resolveDateWindows();
      const afterMs = Date.now();
      const lastWindow = res.windows[res.windows.length - 1];
      const endMsNum = Number(lastWindow.endMs);
      expect(endMsNum).toBeGreaterThanOrEqual(beforeMs);
      expect(endMsNum).toBeLessThanOrEqual(afterMs);
    });
  });

  describe('chunkArray', () => {
    it('chunks an array of 23 IDs into batches of at most 10', () => {
      const ids = Array.from({ length: 23 }, (_, i) => i + 1);
      const batches = chunkArray(ids, 10);
      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(10);
      expect(batches[1]).toHaveLength(10);
      expect(batches[2]).toHaveLength(3);
    });
  });
});
