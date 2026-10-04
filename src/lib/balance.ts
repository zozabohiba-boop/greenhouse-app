// حساب توازن النبات (خضري ↔ ثمري) — نفس منطق v_crop_weekly_summary في قاعدة البيانات

import type { Row } from './schema';

export type Measurement = Row<'plant_measurements'>;
export type Target = Row<'balance_targets'>;

export type BalanceStatus =
  | 'vegetative' | 'tending_vegetative' | 'balanced' | 'tending_generative' | 'generative' | 'undetermined';

export const BALANCE_LABEL: Record<BalanceStatus, string> = {
  vegetative: 'خضري',
  tending_vegetative: 'مائل للخضري',
  balanced: 'متوازن',
  tending_generative: 'مائل للثمري',
  generative: 'ثمري',
  undetermined: 'غير محدد',
};

/** +1 خضري (فوق المستهدف) | -1 ثمري (تحت المستهدف) | 0 داخل النطاق | null لا يمكن الحكم */
export function signal(val: number | null, lo: number | null, hi: number | null): -1 | 0 | 1 | null {
  if (val == null || (lo == null && hi == null)) return null;
  if (hi != null && val > hi) return 1;
  if (lo != null && val < lo) return -1;
  return 0;
}

export function label(score: number, used: number): BalanceStatus {
  if (!used) return 'undetermined';
  if (score >= 2) return 'vegetative';
  if (score === 1) return 'tending_vegetative';
  if (score === 0) return 'balanced';
  if (score === -1) return 'tending_generative';
  return 'generative';
}

const avg = (xs: (number | null | undefined)[]): number | null => {
  const v = xs.filter((x): x is number => x != null && !Number.isNaN(Number(x))).map(Number);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

export interface WeekSummary {
  plants: number;
  weeklyGrowth: number | null;
  stemDiameter: number | null;
  floweringHeight: number | null;
  floweringTruss: number | null;
  openFlowers: number | null;
  fruitSet: number | null;
  fruitsOnPlant: number | null;
  leavesRemaining: number | null;
  leavesRemoved: number | null;
  harvestTruss: number | null;
  signals: { growth: number | null; diameter: number | null; floweringHeight: number | null };
  score: number;
  status: BalanceStatus;
}

export function activeTarget(targets: Target[], onDate: string): Target | null {
  return (
    targets
      .filter((t) => !t.deleted_at && t.valid_from <= onDate && (!t.valid_to || t.valid_to >= onDate))
      .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))[0] ?? null
  );
}

/**
 * @param week   قياسات الأسبوع
 * @param prev   قياسات الأسبوع السابق (لحساب الاستطالة من فرق الطول لو لم تُدخل مباشرة)
 */
export function summarize(week: Measurement[], target: Target | null, prev: Measurement[] = []): WeekSummary {
  const prevByPlant = new Map(prev.map((m) => [m.reference_plant_id, m]));
  const growth = week.map((m) => {
    if (m.weekly_growth_cm != null) return Number(m.weekly_growth_cm);
    const p = prevByPlant.get(m.reference_plant_id);
    return p?.plant_height_cm != null && m.plant_height_cm != null
      ? Number(m.plant_height_cm) - Number(p.plant_height_cm)
      : null;
  });
  const s: Omit<WeekSummary, 'signals' | 'score' | 'status'> = {
    plants: week.length,
    weeklyGrowth: avg(growth),
    stemDiameter: avg(week.map((m) => m.stem_diameter_mm)),
    floweringHeight: avg(week.map((m) => m.flowering_truss_height_cm)),
    floweringTruss: avg(week.map((m) => m.flowering_truss_no)),
    openFlowers: avg(week.map((m) => m.open_flowers_count)),
    fruitSet: avg(week.map((m) => m.fruit_set_pct)),
    fruitsOnPlant: avg(week.map((m) => m.fruits_on_plant)),
    leavesRemaining: avg(week.map((m) => m.leaf_count_remaining)),
    leavesRemoved: avg(week.map((m) => m.leaves_removed)),
    harvestTruss: avg(week.map((m) => m.harvest_truss_no)),
  };
  const t = target;
  const signals = {
    growth: signal(s.weeklyGrowth, num(t?.weekly_growth_min_cm), num(t?.weekly_growth_max_cm)),
    diameter: signal(s.stemDiameter, num(t?.stem_diameter_min_mm), num(t?.stem_diameter_max_mm)),
    floweringHeight: signal(s.floweringHeight, num(t?.flowering_height_min_cm), num(t?.flowering_height_max_cm)),
  };
  const vals = Object.values(signals);
  const score = vals.reduce<number>((a, v) => a + (v ?? 0), 0);
  const used = vals.filter((v) => v != null).length;
  return { ...s, signals, score, status: label(score, used) };
}

const num = (v: unknown): number | null => (v == null ? null : Number(v));
