// تعريف حقول التسجيل الأسبوعي — بترتيب القياس الفعلي أمام النبات
import type { Row } from '../lib/schema';

export type MKey = keyof Pick<
  Row<'plant_measurements'>,
  | 'weekly_growth_cm' | 'stem_diameter_mm' | 'plant_height_cm'
  | 'flowering_truss_no' | 'flowering_truss_height_cm' | 'open_flowers_count'
  | 'set_truss_no' | 'set_truss_flowers' | 'set_truss_fruits' | 'fruits_on_plant' | 'harvest_truss_no'
  | 'leaf_count_total' | 'leaf_count_remaining'
>;

export interface FieldDef {
  key: MKey;
  label: string;
  unit: string;
  decimals: 0 | 1;
  min: number;
  max: number;
  /** فرق أسبوعي غير معتاد يستحق تنبيه "راجع القيمة" */
  jump?: number;
  /** القيمة لا يمكن أن تقل عن الأسبوع الماضي (أرقام العناقيد) */
  monotonic?: boolean;
}

export interface Group {
  title: string;
  fields: FieldDef[];
}

export const GROUPS: Group[] = [
  {
    title: 'النمو والقوة',
    fields: [
      { key: 'weekly_growth_cm', label: 'الاستطالة الأسبوعية', unit: 'سم', decimals: 1, min: 0, max: 100, jump: 15 },
      { key: 'stem_diameter_mm', label: 'سمك الساق', unit: 'مم', decimals: 1, min: 0, max: 40, jump: 3 },
      { key: 'plant_height_cm', label: 'طول النبات', unit: 'سم', decimals: 1, min: 0, max: 2000 },
    ],
  },
  {
    title: 'التزهير',
    fields: [
      { key: 'flowering_truss_no', label: 'رقم العنقود المزهر', unit: 'عنقود', decimals: 0, min: 0, max: 80, jump: 3, monotonic: true },
      { key: 'flowering_truss_height_cm', label: 'بُعده عن القمة', unit: 'سم', decimals: 1, min: 0, max: 150, jump: 12 },
      { key: 'open_flowers_count', label: 'الأزهار المتفتحة', unit: 'زهرة', decimals: 0, min: 0, max: 200 },
    ],
  },
  {
    title: 'العقد والثمار',
    fields: [
      { key: 'set_truss_no', label: 'رقم آخر عنقود عاقد', unit: 'عنقود', decimals: 0, min: 0, max: 80, jump: 3, monotonic: true },
      { key: 'set_truss_flowers', label: 'أزهار العنقود العاقد', unit: 'زهرة', decimals: 0, min: 0, max: 200 },
      { key: 'set_truss_fruits', label: 'ثمار العنقود العاقد', unit: 'ثمرة', decimals: 0, min: 0, max: 200 },
      { key: 'fruits_on_plant', label: 'إجمالي الثمار على النبات', unit: 'ثمرة', decimals: 0, min: 0, max: 1000 },
      { key: 'harvest_truss_no', label: 'رقم عنقود الحصاد', unit: 'عنقود', decimals: 0, min: 0, max: 80, monotonic: true },
    ],
  },
  {
    title: 'الأوراق',
    fields: [
      { key: 'leaf_count_total', label: 'عدد الأوراق الكلي', unit: 'ورقة', decimals: 0, min: 0, max: 120 },
      { key: 'leaf_count_remaining', label: 'المتبقية بعد التوريق', unit: 'ورقة', decimals: 0, min: 0, max: 120 },
    ],
  },
];

export const FIELDS: FieldDef[] = GROUPS.flatMap((g) => g.fields);
export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<MKey, FieldDef>;

export type Draft = Partial<Record<MKey, string>>;

export interface Check {
  error?: string;
  warn?: string;
}

/** فحص قيمة حقل: أخطاء تمنع الحفظ (نفس قيود قاعدة البيانات) وتنبيهات للمراجعة فقط */
export function checkField(f: FieldDef, draft: Draft, prev?: Partial<Row<'plant_measurements'>> | null): Check {
  const raw = draft[f.key];
  if (raw == null || raw === '') return {};
  const v = Number(raw);
  if (!Number.isFinite(v)) return { error: 'رقم غير صالح' };
  if (v < f.min || v > f.max) return { error: `خارج النطاق (${f.min}–${f.max})` };
  if (f.decimals === 0 && !Number.isInteger(v)) return { error: 'رقم صحيح فقط' };
  const n = (k: MKey) => (draft[k] != null && draft[k] !== '' ? Number(draft[k]) : null);
  if (f.key === 'leaf_count_remaining' && n('leaf_count_total') != null && v > n('leaf_count_total')!)
    return { error: 'أكبر من عدد الأوراق الكلي' };
  if (f.key === 'set_truss_fruits' && n('set_truss_flowers') != null && v > n('set_truss_flowers')!)
    return { error: 'أكبر من عدد الأزهار' };
  const p = prev?.[f.key];
  if (p != null) {
    const pv = Number(p);
    if (f.monotonic && v < pv) return { warn: `أقل من الأسبوع الماضي (${pv})` };
    if (f.jump != null && Math.abs(v - pv) > f.jump) return { warn: `فرق كبير عن الأسبوع الماضي (${pv})` };
  }
  return {};
}

export function hasAny(m: Partial<Record<MKey, unknown>> | null | undefined): boolean {
  return !!m && FIELDS.some((f) => m[f.key] != null && m[f.key] !== '');
}

// ── حقول كل محصول ───────────────────────────────────────────────
// الطماطم: كل الحقول (نظام العناقيد). الفلفل والباذنجان والخيار والكنتالوب والفراولة
// ليس لها عناقيد مرقمة، فتظهر لها الحقول المناسبة فقط وبأسماء مفهومة.
interface Profile { keys: MKey[]; labels?: Partial<Record<MKey, string>>; units?: Partial<Record<MKey, string>> }
const FRUITING: Profile = {
  keys: ['weekly_growth_cm', 'stem_diameter_mm', 'plant_height_cm', 'flowering_truss_height_cm', 'open_flowers_count',
    'set_truss_fruits', 'fruits_on_plant', 'leaf_count_total'],
  labels: {
    flowering_truss_height_cm: 'بُعد الزهرة المتفتحة عن القمة',
    set_truss_fruits: 'ثمار عاقدة جديدة هذا الأسبوع',
  },
};
const CUCURBIT: Profile = {
  keys: ['weekly_growth_cm', 'stem_diameter_mm', 'plant_height_cm', 'open_flowers_count', 'set_truss_fruits',
    'fruits_on_plant', 'leaf_count_total', 'leaf_count_remaining'],
  labels: {
    open_flowers_count: 'أزهار أنثى متفتحة',
    set_truss_fruits: 'ثمار عاقدة جديدة هذا الأسبوع',
  },
};
const PROFILES: Record<string, Profile> = {
  pepper: FRUITING,
  eggplant: FRUITING,
  cucumber: CUCURBIT,
  melon: CUCURBIT,
  strawberry: {
    keys: ['stem_diameter_mm', 'leaf_count_total', 'open_flowers_count', 'set_truss_fruits', 'fruits_on_plant'],
    labels: { stem_diameter_mm: 'قطر التاج', set_truss_fruits: 'ثمار عاقدة جديدة هذا الأسبوع' },
  },
};

/** مجموعات الحقول المناسبة للمحصول (الطماطم أو غير المعروف = كل الحقول) */
export function groupsFor(cropCode: string | null | undefined): Group[] {
  const prof = cropCode ? PROFILES[cropCode] : undefined;
  if (!prof) return GROUPS;
  return GROUPS.map((g) => ({
    title: g.title,
    fields: g.fields
      .filter((f) => prof.keys.includes(f.key))
      .map((f) => ({ ...f, label: prof.labels?.[f.key] ?? f.label, unit: prof.units?.[f.key] ?? f.unit })),
  })).filter((g) => g.fields.length);
}
