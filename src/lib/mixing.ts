// توافق الخلط في التنك — قواعد مستخرجة من دليلي "الخلط المتوافق بين المبيدات والمركبات الغذائية"
// (الإصدار الثالث "أخضر" والإصدار الرابع) — scripts/knowledge/mixing_rules.json
import rules from '../data/mixing_rules.json';
import type { CatalogIndex, Product } from './catalog';

interface Match {
  any?: boolean;
  active_ingredient_keywords?: string[];
  product_name_keywords?: string[];
  category_codes_hint?: string[];
  moa_codes?: string[];
  product_types?: string[];
  exclude_keywords?: string[];
  exclude_category_codes?: string[];
  includes_groups?: string[];
  formulation_codes?: string[];
}
interface Group { code: string; name_ar: string; match: Match; tank_order_step?: number }
interface Rule {
  id: string; a: string; b: string; verdict: 'incompatible' | 'caution' | 'compatible';
  message_ar: string; condition_ar?: string | null; interval_days?: number | null;
  source?: string; source_page?: number; ambiguity_ar?: string;
}
const R = rules as unknown as { groups: Group[]; rules: Rule[]; general?: { topic: string; text_ar: string; source?: string; source_page?: number }[]; ph?: unknown[] };
const SOURCE_LABEL: Record<string, string> = { guide_green: 'دليل الخلط (الإصدار الثالث)', guide_v4: 'دليل الخلط (الإصدار الرابع)' };

/** التطبيع حسب match_semantics في ملف القواعد */
export function mixNorm(s: string | null | undefined): string {
  return ` ${(s ?? '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}%.]+/gu, ' ')
    .split(' ').filter(Boolean)
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w))
    .join(' ')} `;
}
const hasWords = (text: string, kw: string) => {
  const k = mixNorm(kw).trim();
  return k.length > 0 && text.includes(` ${k} `);
};

const byCode = new Map((R.groups ?? []).map((g) => [g.code, g]));

function directMatch(g: Group, p: Product, catCode: string | undefined): boolean {
  const m = g.match ?? {};
  if (m.any) return true;
  if (m.product_types?.length && !m.product_types.includes(p.product_type)) return false;
  const name = mixNorm(p.name);
  const ai = mixNorm(p.active_ingredient);
  const conc = mixNorm(p.concentration);
  if ((m.exclude_keywords ?? []).some((k) => hasWords(name, k) || hasWords(ai, k))) return false;
  if (catCode && (m.exclude_category_codes ?? []).includes(catCode)) return false;
  const moa = (p.moa_code ?? '').toUpperCase().trim();
  const parts = moa.split(/[+,/ ]+/).filter(Boolean);
  return (!!catCode && (m.category_codes_hint ?? []).includes(catCode))
    || (m.moa_codes ?? []).some((c) => { const u = c.toUpperCase(); return u === moa || parts.includes(u); })
    || (m.active_ingredient_keywords ?? []).some((k) => hasWords(ai, k) || hasWords(name, k))
    || (m.product_name_keywords ?? []).some((k) => hasWords(name, k))
    || (m.formulation_codes ?? []).some((k) => hasWords(conc, k) || hasWords(name, k));
}

export function groupsOf(p: Product, cat?: CatalogIndex | null): Set<string> {
  const catCode = p.category_id ? cat?.byId.get(p.category_id)?.code : undefined;
  const out = new Set<string>();
  for (const g of R.groups ?? []) if (directMatch(g, p, catCode)) out.add(g.code);
  // includes_groups: عضو في مجموعة فرعية ⇒ عضو في المجموعة الأم
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of R.groups ?? []) {
      if (out.has(g.code)) continue;
      if ((g.match?.includes_groups ?? []).some((c) => out.has(c))) { out.add(g.code); changed = true; }
    }
  }
  return out;
}

export interface MixWarning { level: 'bad' | 'warn'; text: string; source?: string }

/** تحذيرات الخلط لكل زوج من المواد في نفس المحلول — يُعرض الحكم الأشد مع ذكر المصدر */
export function mixWarnings(products: Product[], cat?: CatalogIndex | null): MixWarning[] {
  if (!R.rules?.length || products.length < 2) return [];
  const gs = products.map((p) => ({ p, g: groupsOf(p, cat) }));
  const out: MixWarning[] = [];
  for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
    const A = gs[i], B = gs[j];
    const hits = R.rules.filter((r) => (A.g.has(r.a) && B.g.has(r.b)) || (A.g.has(r.b) && B.g.has(r.a)));
    const bad = hits.filter((r) => r.verdict === 'incompatible');
    const caution = hits.filter((r) => r.verdict === 'caution');
    const pick = bad.length ? bad : caution;
    if (!pick.length) continue;
    // رسالة واحدة لكل زوج: أهم قاعدة (المجموعات الأكثر تحديدًا أولًا)
    const specific = (r: Rule) => (r.a.startsWith('any_') ? 1 : 0) + (r.b.startsWith('any_') ? 1 : 0);
    const r = [...pick].sort((x, y) => specific(x) - specific(y))[0];
    const src = [r.source && `${SOURCE_LABEL[r.source] ?? r.source}${r.source_page ? ` ص${r.source_page}` : ''}`].filter(Boolean).join('');
    out.push({
      level: r.verdict === 'incompatible' ? 'bad' : 'warn',
      text: `${A.p.name} + ${B.p.name}: ${r.message_ar}${r.condition_ar ? ` — ${r.condition_ar}` : ''}${r.interval_days ? ` (فاصل ${r.interval_days} يوم)` : ''}${r.ambiguity_ar ? ` ⚠ ${r.ambiguity_ar}` : ''}`,
      source: src,
    });
  }
  // حد عدد المواد في التنك (قاعدة الدليلين)
  const pesticides = gs.filter((x) => x.g.has('any_pesticide')).length;
  const nutrients = gs.filter((x) => x.g.has('any_nutrient')).length;
  if (nutrients >= 2) out.push({ level: 'bad', text: 'مركّبان غذائيان في نفس الرشة: الدليل يمنع خلط سمادين ورقيين معًا.' });
  if (pesticides > 3 || (pesticides > 1 && nutrients >= 1)) out.push({ level: 'warn', text: 'الحد الأقصى في التنك: مبيد واحد + مركّب غذائي واحد، أو ثلاثة مبيدات بدون سماد.' });
  return out;
}

/** ترتيب الإضافة في التنك حسب صورة المستحضر (إن أمكن) */
export function tankOrder(products: Product[], cat?: CatalogIndex | null): { p: Product; step: number | null }[] {
  return products.map((p) => {
    const steps = [...groupsOf(p, cat)].map((c) => byCode.get(c)?.tank_order_step).filter((x): x is number => typeof x === 'number');
    return { p, step: steps.length ? Math.min(...steps) : null };
  }).sort((a, b) => (a.step ?? 99) - (b.step ?? 99));
}

export const MIXING_GENERAL = R.general ?? [];
export const mixGroupName = (code: string) => byCode.get(code)?.name_ar ?? code;
