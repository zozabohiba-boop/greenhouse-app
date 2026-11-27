import * as FX from './fixtures';
import { describe, expect, it } from 'vitest';
import { assess, enhance, laplacianVariance, toGray } from './image';
import { buildScan, matchBook, bookDose, type BookIndex } from './match';
import { findBio, findConcentration, findIupac, findRegNo, parseDose, typeFromWords } from './parse';
import { lev, similarity } from './text';
import book from '../../data/eg_trade_index.json';
import type { Substance } from '../catalog';

const B = book as unknown as BookIndex;
const sub = (name_en: string, name_ar: string, classes: string[], moa_code: string | null = null) =>
  ({ id: name_en, name_en, name_ar, classes, moa_code, farm_id: null, deleted_at: null }) as unknown as Substance;
const SUBS = [
  sub('fosthiazate', 'فوستيازيت', ['nematicide', 'insecticide'], '1B'),
  sub('cymoxanil', 'سيموكسانيل', ['fungicide'], '27'),
  sub('mancozeb', 'مانكوزيب', ['fungicide'], 'M3'),
  sub('thiamethoxam', 'ثيامثوكسام', ['insecticide'], '4A'),
];
const fx = (n: 'cabsol' | 'chairman') => FX[n];

describe('نص', () => {
  it('مسافة التحرير والتشابه', () => {
    expect(lev('كابسولبر', 'كابسولبرو')).toBe(1);
    expect(similarity('abc', 'abc')).toBe(1);
  });
});

describe('تحليل الحقول', () => {
  it('التركيز والمستحضر', () => {
    expect(findConcentration('Chairman Bro 25 %WP').concentration).toBe('25% WP');
    expect(findConcentration('٣٠٪ EC').concentration).toBe('30% EC');
    expect(findConcentration('المستحضر في صورة مسحوق قابلللبلل').formulation).toBe('WP');
    expect(findConcentration('30 كبسولاتمعلقة').formulation).toBe('CS');
  });
  it('رقم التسجيل', () => expect(findRegNo('رقم التسجيل: 3162')).toBe('3162'));
  it('الجرعات', () => {
    expect(parseDose('20 جم/100 لتر ماء (صوب)')).toMatchObject({ value: 20, unit: 'g_per_100l' });
    expect(parseDose('2 لتر/فدان')).toMatchObject({ value: 2, unit: 'l_per_feddan' });
    expect(parseDose('0.5 جم/1 لتر ماء')).toMatchObject({ value: 0.5, unit: 'g_per_l' });
    expect(parseDose('240 سم3/فدان')).toMatchObject({ value: 240, unit: 'ml_per_feddan' });
    expect(parseDose('1 سم3/كجم تقاوى')).toBeUndefined();
  });
  it('الكائنات الحيوية', () => {
    expect(findBio('SWIRSbio Amblyseius swirskii')).toMatchObject({ species: 'Amblyseius swirskii', type: 'biocontrol_agent' });
    expect(findBio('عبوة مبيد')).toEqual({});
  });
  it('الأسماء الكيميائية', () => {
    expect(findIupac(fx('chairman'))).toEqual(['cymoxanil', 'metalaxyl']);
  });
  it('نوع المنتج من الكلمات (حتى لو الـOCR أكل المسافة)', () => expect(typeFromWords('مبيدفطري')).toBe('fungicide'));
});

describe('مطابقة كتاب التوصيات', () => {
  it('كابسول برو ← تسجيل 3162 بجرعة وفترة أمان الكتاب', () => {
    const c = matchBook(fx('cabsol'), B, SUBS);
    expect(c[0].product.reg).toBe('3162');
    const r = buildScan({ texts: [fx('cabsol')], book: B, substances: SUBS });
    expect(r.chosen?.product.reg).toBe('3162');
    expect(r.fields).toMatchObject({ name: 'كابسول برو', eg_reg_no: '3162', concentration: '30% CS', phi_days: 45, default_dose: 2, default_dose_unit: 'l_per_feddan', product_type: 'nematicide' });
    expect(r.sources.phi_days).toBe('book');
  });
  it('اختيار «ولا واحد» يلغي التعبئة من الكتاب', () => {
    const r = buildScan({ texts: [fx('cabsol')], book: B, substances: SUBS, chosenReg: '' });
    expect(r.chosen).toBeNull();
    expect(r.fields.phi_days).toBeUndefined();
  });
  it('منتج غير موجود بالكتاب (Chairman Bro): يقرأ من العبوة فقط ولا يخترع فترة أمان أو جرعة', () => {
    const r = buildScan({ texts: [fx('chairman')], book: B, substances: SUBS });
    expect(r.chosen).toBeNull();
    expect(r.fields).toMatchObject({ concentration: '25% WP', product_type: 'fungicide' });
    expect(r.fields.active_ingredient).toContain('سيموكسانيل');
    expect(r.fields.phi_days).toBeUndefined();
    expect(r.fields.default_dose).toBeUndefined();
    expect(r.fields.moa_code).toBeUndefined(); // مادتان: لا نختار مجموعة واحدة
    expect(r.missing).toContain('فترة الأمان');
  });
  it('منتج حيوي (SWIRSbio): نوع عدو حيوي واسم علمي بدون فترة أمان', () => {
    const r = buildScan({ texts: ['SWIRSbio 50.000 Swirski\nAmblyseius swirskii'], book: B, substances: SUBS });
    expect(r.fields).toMatchObject({ product_type: 'biocontrol_agent', bio_species: 'Amblyseius swirskii', is_bio: true });
    expect(r.fields.phi_days).toBeUndefined();
  });
  it('تنبيه تكرار الاسم', () => {
    const r = buildScan({ texts: [fx('cabsol')], book: B, substances: SUBS, existing: [{ name: 'كابسول برو', eg_reg_no: null }] });
    expect(r.warnings.some((w) => w.includes('بنفس الاسم'))).toBe(true);
  });
  it('نص فارغ أو عشوائي لا يطابق شيئًا', () => {
    expect(matchBook('xx 12 yy', B, SUBS)).toEqual([]);
    expect(buildScan({ texts: [''], book: B, substances: SUBS }).chosen).toBeNull();
  });
  it('الجرعة الأشهر من الكتاب تستثني معاملة البذور', () => {
    const seed = B.products.find((p) => p.reg === '1871')!;
    expect(bookDose(seed).dose).toBeUndefined();
  });
});

describe('جودة الصورة', () => {
  const flat = (v: number, n = 64) => new Uint8Array(n * n).fill(v);
  it('صورة مسطحة ضبابية', () => {
    expect(laplacianVariance(flat(120), 64, 64)).toBe(0);
    expect(assess(1200, 1600, 0, 120, 0).verdict).toBe('bad');
  });
  it('صورة حادة وجيدة', () => expect(assess(1200, 1600, 370, 145, 0).verdict).toBe('good'));
  it('إضاءة ضعيفة ووهج ودقة قليلة', () => {
    expect(assess(1200, 1600, 300, 30, 0).verdict).toBe('bad');
    expect(assess(1200, 1600, 300, 140, 0.1).issues.join()).toContain('وهج');
    expect(assess(500, 700, 300, 140, 0).issues.join()).toContain('الدقة');
  });
  it('تحسين التباين يوسّع المدى ويحافظ على الحجم', () => {
    const n = 32;
    const g = new Uint8Array(n * n).map((_, i) => 100 + (i % 2 ? 20 : 0));
    const out = enhance(g, n, n);
    expect(out.length).toBe(g.length);
    expect(Math.max(...out) - Math.min(...out)).toBeGreaterThan(40);
    expect(toGray(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1)[0]).toBe(255);
  });
});
