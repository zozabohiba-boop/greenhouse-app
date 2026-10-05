import { describe, expect, it } from 'vitest';
import { adviceText, buildAdvice, doseText, repeatedMoa } from './advice';
import { targetWarnings } from './crops';
import { groupsFor } from '../screens/fields';

const pest = { id: 'mite', name_ar: 'العنكبوت الأحمر', action_severity: 2, crops: null, guidance: 'عالج البؤرة موضعيًا' };
const prod = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, is_bio: false, moa_code: null, default_dose: null, default_dose_unit: null, phi_days: null,
  active_ingredient: null, is_active: true, deleted_at: null, ...extra,
});
const products = [
  prod('p1', 'Phytoseiulus persimilis', { is_bio: true }),
  prod('p2', 'كبريت ميكروني', { is_bio: true, moa_code: 'M02', default_dose: 2.5, default_dose_unit: 'g_per_l' }),
  prod('p3', 'فيرتيمك', { moa_code: '6', default_dose: 0.5, default_dose_unit: 'ml_per_l' }),
  prod('p4', 'كاني مايت', { moa_code: '20B', default_dose: 0.5, default_dose_unit: 'ml_per_l' }),
  prod('p5', 'مادة موقوفة', { is_active: false }),
] as any[];
const ctl = (product_id: string, approach: string, priority: number, farm_id: string | null = null) =>
  ({ pest_id: 'mite', product_id, approach, priority, note: null, farm_id, deleted_at: null });
const controls = [ctl('p3', 'chemical', 501), ctl('p4', 'chemical', 502), ctl('p2', 'natural', 201), ctl('p1', 'biological', 101), ctl('p5', 'natural', 202)] as any[];

describe('buildAdvice', () => {
  it('orders approaches: biological → natural → chemical, skips inactive products', () => {
    const a = buildAdvice({ pest, severity: 3, controls, products, farmId: 'f1', today: '2026-10-05' });
    expect(a.needsAction).toBe(true);
    expect(a.groups.map((g) => g.approach)).toEqual(['biological', 'natural', 'chemical']);
    expect(a.groups[1].items.map((i) => i.product.name)).toEqual(['كبريت ميكروني']);
    expect(a.groups[1].items[0].dose).toBe('2.5 جم/لتر');
  });
  it('below threshold → no action needed', () => {
    expect(buildAdvice({ pest, severity: 1, controls, products, farmId: 'f1', today: '2026-10-05' }).needsAction).toBe(false);
    expect(buildAdvice({ pest, severity: null, controls, products, farmId: 'f1', today: '2026-10-05' }).needsAction).toBe(false);
  });
  it('pushes a group used twice in a row to the end and flags it', () => {
    const history = [{ performed_on: '2026-10-01', moa: '6' }, { performed_on: '2026-09-24', moa: '6' }];
    const a = buildAdvice({ pest, severity: 3, controls, products, farmId: 'f1', today: '2026-10-05', history });
    const chem = a.groups.find((g) => g.approach === 'chemical')!;
    expect(chem.items.map((i) => i.product.name)).toEqual(['كاني مايت', 'فيرتيمك']);
    expect(chem.items[1].repeated).toBe(2);
    expect(adviceText(pest, 3, a)).not.toContain('فيرتيمك');
  });
  it('ignores other farms’ controls and flags off-crop pests', () => {
    const a = buildAdvice({ pest: { ...pest, crops: ['tomato'] }, severity: 2, controls: [...controls, ctl('p4', 'natural', 1, 'other')], products, farmId: 'f1', cropCode: 'cucumber', today: '2026-10-05' });
    expect(a.offCrop).toBe(true);
    expect(a.groups.find((g) => g.approach === 'natural')!.items).toHaveLength(1);
  });
  it('writes a ready recommendation text', () => {
    const a = buildAdvice({ pest, severity: 2, controls, products, farmId: 'f1', today: '2026-10-05' });
    const t = adviceText(pest, 2, a);
    expect(t).toContain('العنكبوت الأحمر — شدة متوسط (تجاوزت حد التدخل)');
    expect(t).toContain('Phytoseiulus persimilis');
    expect(t).toContain('إجراءات زراعية: عالج البؤرة موضعيًا');
  });
});

describe('repeatedMoa / doseText', () => {
  it('handles combined codes like 11+3', () => {
    const h = [{ performed_on: '2026-10-01', moa: '11+3' }, { performed_on: '2026-09-20', moa: '3' }];
    expect(repeatedMoa('3', h, '2026-10-05')).toBe(2);
    expect(repeatedMoa('11+4', h, '2026-10-05')).toBe(1);
    expect(repeatedMoa(null, h, '2026-10-05')).toBe(0);
  });
  it('formats doses', () => {
    expect(doseText({ default_dose: 0.25, default_dose_unit: 'g_per_l' })).toBe('0.25 جم/لتر');
    expect(doseText({ default_dose: null, default_dose_unit: 'g_per_l' })).toBeNull();
  });
});

describe('crop references', () => {
  it('flags the pepper target the user entered (60–75 cm/week)', () => {
    const w = targetWarnings('pepper', 'فلفل', { weekly_growth_min_cm: 60, weekly_growth_max_cm: 75 });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain('أعلى من المعتاد لمحصول فلفل');
  });
  it('accepts normal tomato targets', () => {
    expect(targetWarnings('tomato', 'طماطم', { weekly_growth_min_cm: 25, weekly_growth_max_cm: 30, stem_diameter_min_mm: 8, stem_diameter_max_mm: 12 })).toEqual([]);
  });
  it('crop-specific registration fields', () => {
    const keys = (c: string) => groupsFor(c).flatMap((g) => g.fields.map((f) => f.key));
    expect(keys('tomato')).toContain('flowering_truss_no');
    expect(keys('pepper')).not.toContain('flowering_truss_no');
    expect(keys('pepper')).toContain('set_truss_fruits');
    expect(groupsFor('pepper').flatMap((g) => g.fields).find((f) => f.key === 'set_truss_fruits')!.label).toBe('ثمار عاقدة جديدة هذا الأسبوع');
    expect(keys('strawberry')).not.toContain('weekly_growth_cm');
  });
});
