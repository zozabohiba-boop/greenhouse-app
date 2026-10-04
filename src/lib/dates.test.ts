import { describe, expect, it } from 'vitest';
import { isoWeek } from './dates';

describe('isoWeek matches PostgreSQL extract(isoyear/week)', () => {
  it.each([
    ['2026-01-01', 2026, 1],
    ['2025-12-29', 2026, 1],
    ['2027-01-01', 2026, 53],
    ['2026-09-28', 2026, 40],
    ['2026-10-04', 2026, 40],
    ['2026-10-05', 2026, 41],
    ['2024-12-30', 2025, 1],
  ])('%s', (d, y, w) => {
    expect(isoWeek(d)).toEqual({ year: y, week: w });
  });
});
