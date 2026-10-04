import { describe, expect, it } from 'vitest';
import { summarize, signal, label } from './balance';

const target: any = {
  valid_from: '2026-08-01', valid_to: null, deleted_at: null,
  weekly_growth_min_cm: 10, weekly_growth_max_cm: 20,
  stem_diameter_min_mm: 8, stem_diameter_max_mm: 11,
  flowering_height_min_cm: 10, flowering_height_max_cm: 20,
};
const m = (o: any) => ({ reference_plant_id: o.p ?? 'a', ...o }) as any;

describe('balance (mirrors SQL view results from the DB test)', () => {
  it('week 40 → vegetative, score 3', () => {
    const s = summarize(
      [m({ p: 'a', weekly_growth_cm: 25, stem_diameter_mm: 12, flowering_truss_height_cm: 24, fruit_set_pct: 83.3 }),
       m({ p: 'b', weekly_growth_cm: 23, stem_diameter_mm: 11.5, flowering_truss_height_cm: 22, fruit_set_pct: 80 })],
      target);
    expect(s.weeklyGrowth).toBe(24);
    expect(s.stemDiameter).toBe(11.8);
    expect(s.score).toBe(3);
    expect(s.status).toBe('vegetative');
  });
  it('week 41 → balanced', () => {
    const s = summarize([m({ weekly_growth_cm: 15, stem_diameter_mm: 9.5, flowering_truss_height_cm: 14 })], target);
    expect(s.status).toBe('balanced');
  });
  it('no targets → undetermined', () => {
    expect(summarize([m({ weekly_growth_cm: 15 })], null).status).toBe('undetermined');
  });
  it('growth falls back to height difference', () => {
    const s = summarize([m({ plant_height_cm: 130 })], target, [m({ plant_height_cm: 112 })]);
    expect(s.weeklyGrowth).toBe(18);
  });
  it('signal/label edges', () => {
    expect(signal(20, 10, 20)).toBe(0);
    expect(signal(7, 8, null)).toBe(-1);
    expect(label(-3, 3)).toBe('generative');
  });
});
