// التوصية التلقائية: من ملاحظة فحص (آفة + شدة) إلى خيارات مكافحة مرتبة
// دوال خالصة قابلة للاختبار — المعرفة نفسها في قاعدة البيانات (pests + products + pest_controls).

import { DOSE_UNIT_LABEL, SEVERITY } from './labels';
import { consecutiveMoa, type MoaUse } from './ipm';
import type { Row } from './schema';

type Pest = Pick<Row<'pests'>, 'id' | 'name_ar' | 'action_severity' | 'crops' | 'guidance'>;
type Product = Pick<Row<'products'>, 'id' | 'name' | 'is_bio' | 'moa_code' | 'default_dose' | 'default_dose_unit' | 'phi_days' | 'active_ingredient' | 'is_active' | 'deleted_at'>;
type Control = Pick<Row<'pest_controls'>, 'pest_id' | 'product_id' | 'approach' | 'priority' | 'note' | 'farm_id' | 'deleted_at'>;

export type Approach = 'biological' | 'natural' | 'trap' | 'nutrition' | 'chemical';

export const APPROACH_LABEL: Record<Approach, string> = {
  biological: 'مكافحة حيوية',
  natural: 'مركبات حيوية وطبيعية',
  trap: 'مصائد ورصد',
  nutrition: 'تغذية وتصحيح',
  chemical: 'كيميائي (عند الحاجة، مع تبديل المجموعات)',
};
const ORDER: Approach[] = ['biological', 'natural', 'trap', 'nutrition', 'chemical'];

/** حد التدخل الافتراضي لو الآفة بدون حد مسجل */
export const DEFAULT_ACTION = 2;

export interface AdviceItem {
  product: Product;
  dose: string | null;
  /** عدد مرات استخدام نفس المجموعة متتاليًا في هذه الصوبة (للتنبيه) */
  repeated: number;
  note: string | null;
}

export interface Advice {
  threshold: number;
  needsAction: boolean;
  /** الآفة غير معتادة على هذا المحصول */
  offCrop: boolean;
  guidance: string | null;
  groups: { approach: Approach; label: string; items: AdviceItem[] }[];
}

export function doseText(p: Pick<Product, 'default_dose' | 'default_dose_unit'>): string | null {
  if (p.default_dose == null) return null;
  const n = Number(p.default_dose);
  const unit = p.default_dose_unit ? DOSE_UNIT_LABEL[p.default_dose_unit] : '';
  return `${Number.isInteger(n) ? n : n.toString()} ${unit}`.trim();
}

/** أكبر عدد استخدام متتالٍ لأي مجموعة في كود مركب مثل "11+3" */
export function repeatedMoa(moa: string | null | undefined, history: MoaUse[], before: string): number {
  if (!moa) return 0;
  const parts = moa.split('+').map((x) => x.trim()).filter(Boolean);
  const split: MoaUse[] = history.flatMap((h) => h.moa.split('+').map((m) => ({ performed_on: h.performed_on, moa: m.trim() })));
  return Math.max(0, ...parts.map((m) => consecutiveMoa(split, m, before)));
}

export function buildAdvice(args: {
  pest: Pest;
  severity: number | null;
  controls: Control[];
  products: Product[];
  farmId: string | null;
  cropCode?: string | null;
  history?: MoaUse[];
  today: string;
}): Advice {
  const { pest, severity, controls, products, farmId, cropCode, history = [], today } = args;
  const threshold = pest.action_severity ?? DEFAULT_ACTION;
  const byId = new Map(products.filter((p) => !p.deleted_at && p.is_active).map((p) => [p.id, p]));
  const mine = controls.filter((c) => !c.deleted_at && c.pest_id === pest.id && (c.farm_id == null || c.farm_id === farmId));
  const groups = ORDER.map((approach) => {
    const items = mine
      .filter((c) => c.approach === approach)
      .sort((a, b) => a.priority - b.priority)
      .map((c) => {
        const product = byId.get(c.product_id);
        if (!product) return null;
        return { product, dose: doseText(product), repeated: repeatedMoa(product.moa_code, history, today), note: c.note } as AdviceItem;
      })
      .filter((x): x is AdviceItem => !!x);
    // المجموعات المتكررة تنزل لآخر القائمة
    items.sort((a, b) => Number(a.repeated >= 2) - Number(b.repeated >= 2));
    return { approach, label: APPROACH_LABEL[approach], items };
  }).filter((g) => g.items.length);
  return {
    threshold,
    needsAction: severity != null && severity >= threshold,
    offCrop: !!(cropCode && pest.crops?.length && !pest.crops.includes(cropCode)),
    guidance: pest.guidance ?? null,
    groups,
  };
}

/** نص توصية جاهز للاستشاري (يعدّله قبل الحفظ) */
export function adviceText(pest: Pick<Pest, 'name_ar'>, severity: number | null, a: Advice, perGroup = 3): string {
  const lines: string[] = [];
  const sev = severity != null ? SEVERITY[severity]?.label : null;
  lines.push(`${pest.name_ar}${sev ? ` — شدة ${sev}` : ''}${a.needsAction ? ' (تجاوزت حد التدخل)' : ''}.`);
  for (const g of a.groups) {
    const ok = g.items.filter((i) => i.repeated < 2).slice(0, perGroup);
    if (!ok.length) continue;
    lines.push(`• ${g.label}: ${ok.map((i) => i.product.name + (i.dose ? ` (${i.dose})` : '')).join('، ')}`);
  }
  if (a.groups.some((g) => g.approach === 'chemical'))
    lines.push('• لا تكرر نفس مجموعة IRAC/FRAC أكثر من مرتين متتاليتين، والتزم بفترة الأمان المدونة على العبوة.');
  if (a.guidance) lines.push(`إجراءات زراعية: ${a.guidance}`);
  return lines.join('\n');
}
