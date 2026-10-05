import { describe, expect, it } from 'vitest';
import { formatDay, isoWeek, weekBounds, weekSpan, weekTitle } from './dates';

describe('weekBounds / weekSpan', () => {
  it('Monday to Sunday of the ISO week', () => {
    expect(weekBounds('2026-10-05')).toEqual({ start: '2026-10-05', end: '2026-10-11' });
    expect(weekBounds('2026-10-11')).toEqual({ start: '2026-10-05', end: '2026-10-11' });
    expect(weekBounds('2026-10-04')).toEqual({ start: '2026-09-28', end: '2026-10-04' });
  });
  it('same month', () => expect(weekSpan('2026-10-07')).toBe('من 5 إلى 11 أكتوبر 2026'));
  it('across months', () => expect(weekSpan('2026-10-01')).toBe('من 28 سبتمبر إلى 4 أكتوبر 2026'));
  it('across years', () => expect(weekSpan('2026-01-01')).toBe('من 29 ديسمبر 2025 إلى 4 يناير 2026'));
  it('without year', () => expect(weekSpan('2026-10-07', false)).toBe('من 5 إلى 11 أكتوبر'));
  it('day', () => expect(formatDay('2026-10-05')).toBe('الإثنين 5 أكتوبر'));
  it('title', () => expect(weekTitle('2026-10-05')).toBe('الأسبوع 41: من 5 إلى 11 أكتوبر 2026'));
});

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
