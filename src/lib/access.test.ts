import { describe, expect, it } from 'vitest';
import { accessFor, ACTIVITY_DOMAIN, splitRoles } from './access';
import { computeBalances } from './store';
import { mixWarnings, groupsOf } from './mixing';
import { indexRegistry, complianceFor, cropKey } from './catalog';
import { passwordProblem } from './password';

describe('access (لكل مقام مقال)', () => {
  it('system admin sees and does everything', () => {
    const a = accessFor(null, true);
    expect(a.role).toBe('admin');
    expect(a.admin && a.full && a.invite && a.manage && a.advise && a.store).toBe(true);
  });
  it('company manager: full project access, no system admin powers', () => {
    const a = accessFor('farm_manager', false);
    expect(a.full && a.invite && a.manage && a.approvePurchases).toBe(true);
    expect(a.admin).toBe(false);
  });
  it('consultant has the same powers as the company manager', () => {
    const c = accessFor('consultant', false);
    const m = accessFor('farm_manager', false);
    for (const k of ['full', 'invite', 'manage', 'advise', 'supervise', 'approvePurchases', 'addCatalog', 'upload', 'requestPurchase', 'store'] as const) expect(c[k]).toBe(m[k]);
    expect(c.admin).toBe(false);
  });
  it('a member with several roles gets the union of their permissions', () => {
    const a = accessFor(['scout', 'irrigation'], false);
    expect(a.canRecord('ipm') && a.canRecord('fertigation')).toBe(true);
    expect(a.canRecord('operations') || a.canRead('store') || a.full).toBe(false);
    expect(a.roles).toEqual(['scout', 'irrigation']);
    const s = accessFor(['storekeeper', 'purchasing'], false);
    expect(s.canRecord('store') && s.canRecord('purchasing')).toBe(true);
    // «متابعة فقط» مع دور ميداني: يقرأ الكل ويسجّل في مجال الدور الميداني فقط
    const e = accessFor(['executive', 'scout'], false);
    expect(e.full && e.canRead('fertigation') && e.canRecord('ipm') && !e.canRecord('fertigation')).toBe(true);
    expect(accessFor(['executive'], false).record).toBe(false);
  });
  it('splitRoles picks the highest role as primary', () => {
    expect(splitRoles(['purchasing', 'storekeeper', 'scout'])).toEqual({ role: 'scout', extra: ['storekeeper', 'purchasing'] });
    expect(splitRoles([])).toBeNull();
  });
  it('specialist engineers only read/write their own domain', () => {
    const s = accessFor('scout', false);
    expect(s.canRecord('ipm')).toBe(true);
    expect(s.canRead('fertigation')).toBe(false);
    expect(s.canRecord('operations')).toBe(false);
    expect(s.full || s.manage || s.invite).toBe(false);
    const i = accessFor('irrigation', false);
    expect(i.canRecord('fertigation') && !i.canRead('ipm')).toBe(true);
    const o = accessFor('operations', false);
    expect(o.canRecord('operations') && !o.canRead('ipm') && !o.canRead('fertigation')).toBe(true);
  });
  it('store & purchasing roles', () => {
    const k = accessFor('storekeeper', false);
    expect(k.store && k.canRecord('store') && !k.canRecord('purchasing') && k.canRead('purchasing') && !k.record).toBe(true);
    const p = accessFor('purchasing', false);
    expect(p.canRecord('purchasing') && !p.canRecord('store') && p.canRead('store')).toBe(true);
  });
  it('executive reads all and writes nothing', () => {
    const e = accessFor('executive', false);
    expect(e.full && e.canRead('ipm') && !e.canRecord('ipm') && !e.record && !e.upload).toBe(true);
  });
  it('activity type → domain matches the server', () => {
    expect(ACTIVITY_DOMAIN.foliar_nutrition).toBe('fertigation');
    expect(ACTIVITY_DOMAIN.bio_release).toBe('ipm');
    expect(ACTIVITY_DOMAIN.cultural_operation).toBe('operations');
  });
});

const mv = (o: Record<string, unknown>) => ({ id: Math.random().toString(), farm_id: 'f', warehouse_id: 'w', product_id: 'p', unit: 'لتر', moved_on: '2026-11-01', deleted_at: null, created_at: '', batch_no: null, expiry_date: null, ...o }) as any;
describe('store balances', () => {
  it('sums receipts and issues per batch, nearest expiry first', () => {
    const b = computeBalances([
      mv({ movement_type: 'receipt', qty: 10, batch_no: 'A', expiry_date: '2027-05-01' }),
      mv({ movement_type: 'receipt', qty: 5, batch_no: 'B', expiry_date: '2026-12-15', moved_on: '2026-11-02' }),
      mv({ movement_type: 'issue', qty: 3, batch_no: 'B', moved_on: '2026-11-03' }),
      mv({ movement_type: 'adjust_out', qty: 0.5, batch_no: 'A', moved_on: '2026-11-04' }),
    ]);
    expect(b).toHaveLength(1);
    expect(b[0].qty).toBe(11.5);
    expect(b[0].batches.map((x) => x.batch)).toEqual(['B', 'A']);
    expect(b[0].batches[0].qty).toBe(2);
  });
});

const prod = (o: Record<string, unknown>) => ({ id: Math.random().toString(), name: '', product_type: 'insecticide', active_ingredient: null, concentration: null, moa_code: null, category_id: null, is_bio: false, ...o }) as any;
describe('tank-mix compatibility (دليل الخلط المتوافق)', () => {
  it('flags calcium + phosphate as incompatible', () => {
    const ca = prod({ name: 'نترات الكالسيوم', product_type: 'fertilizer', active_ingredient: 'نترات الكالسيوم' });
    const ph = prod({ name: 'بوتاسيوم فوسفيت', product_type: 'fertilizer', active_ingredient: 'فوسفيت البوتاسيوم', moa_code: 'P07' });
    expect(groupsOf(ca).has('calcium_source')).toBe(true);
    const w = mixWarnings([ca, ph]);
    expect(w.some((x) => x.level === 'bad')).toBe(true);
  });
  it('flags two products of the same IRAC group', () => {
    const a = prod({ name: 'فيرتيمك', active_ingredient: 'أبامكتين', moa_code: '6' });
    const b = prod({ name: 'منتج آخر', active_ingredient: 'إيمامكتين بنزوات', moa_code: '6' });
    expect(mixWarnings([a, b]).some((x) => x.level === 'bad')).toBe(true);
  });
  it('no warning for a single product', () => {
    expect(mixWarnings([prod({ name: 'كبريت' })])).toEqual([]);
  });
});

describe('export compliance', () => {
  const subs = [
    { id: 's1', farm_id: null, name_en: 'chlorpyrifos', name_ar: 'كلوربيريفوس', eu_status: 'not_approved', deleted_at: null, classes: [] },
    { id: 's2', farm_id: null, name_en: 'abamectin', name_ar: 'أبامكتين', eu_status: 'approved', deleted_at: null, classes: [] },
  ] as any[];
  const lims = [{ id: 'l1', farm_id: null, substance_id: 's2', market: 'EU', crop_code: 'tomato', mrl_mg_kg: 0.09, default_loq: false, phi_days: null, deleted_at: null }] as any[];
  const reg = indexRegistry(subs, lims, [], 'f');
  it('matches the active ingredient text to substances', () => {
    expect(reg.substancesOf(prod({ active_ingredient: 'Abamectin 1.8% EC' })).map((s) => s.id)).toEqual(['s2']);
  });
  it('flags EU-non-approved substances for EU export and shows MRL', () => {
    const bad = complianceFor(prod({ name: 'X', active_ingredient: 'كلوربيريفوس' }), reg, 'tomato', ['EU']);
    expect(bad[0].level).toBe('bad');
    const ok = complianceFor(prod({ name: 'Y', active_ingredient: 'abamectin' }), reg, 'tomato', ['EU']);
    expect(ok.some((x) => x.text.includes('0.09'))).toBe(true);
  });
  it('crop codes', () => {
    expect(cropKey('sweet_pepper')).toBe('pepper');
    expect(cropKey('tomato_cherry')).toBe('tomato');
  });
});

describe('password rules', () => {
  it('rejects weak passwords', () => {
    expect(passwordProblem('short1')).not.toBeNull();
    expect(passwordProblem('onlyletters')).not.toBeNull();
    expect(passwordProblem('12345678')).not.toBeNull();
    expect(passwordProblem('ahmed2026x', 'ahmed@x.com')).not.toBeNull();
    expect(passwordProblem('Greenhouse#2026')).toBeNull();
  });
});
