// التصنيف العلمي للمواد (فئة كبرى ← فئة صغرى) + ربط المواد بالمواد الفعالة وحدود المتبقيات
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { alive } from './repo';
import { shadowProducts } from './hooks';
import type { Row } from './schema';
import type { ActivityType } from './access';

export type Category = Row<'product_categories'>;
export type Product = Row<'products'>;
export type Substance = Row<'active_substances'>;
export type Limit = Row<'substance_limits'>;

/** الفئات الكبرى المناسبة لكل نوع معاملة (بالترتيب) */
export const MAJORS_FOR: Record<ActivityType, string[]> = {
  chemical_spray: ['chemical_pesticides', 'microbial_biopesticides', 'botanicals_oils', 'mineral_protectants', 'biostimulants', 'spray_adjuvants'],
  bio_release: ['natural_enemies', 'microbial_biopesticides', 'pollination'],
  fertigation_injection: ['fertilizers', 'biostimulants', 'biofertilizers', 'microbial_biopesticides', 'chemical_pesticides'],
  foliar_nutrition: ['fertilizers', 'biostimulants', 'spray_adjuvants'],
  cultural_operation: ['land_preparation', 'traps_attractants', 'pollination', 'fertilizers'],
};

export interface CatalogIndex {
  all: Category[];
  majors: Category[];
  subs: (majorId: string) => Category[];
  byId: Map<string, Category>;
  byCode: Map<string, Category>;
  /** الفئة الكبرى لفئة صغرى */
  majorOf: (catId: string | null | undefined) => Category | undefined;
  path: (catId: string | null | undefined) => string;
}

export function indexCategories(rows: Category[], farmId: string | null): CatalogIndex {
  const all = rows.filter((c) => alive(c) && (c.farm_id == null || c.farm_id === farmId))
    .sort((a, b) => a.sort_order - b.sort_order || a.name_ar.localeCompare(b.name_ar, 'ar'));
  const byId = new Map(all.map((c) => [c.id, c]));
  const byCode = new Map(all.map((c) => [c.code, c]));
  const majors = all.filter((c) => !c.parent_id);
  const kids = new Map<string, Category[]>();
  for (const c of all) if (c.parent_id) {
    if (!kids.has(c.parent_id)) kids.set(c.parent_id, []);
    kids.get(c.parent_id)!.push(c);
  }
  const majorOf = (id: string | null | undefined) => {
    const c = id ? byId.get(id) : undefined;
    if (!c) return undefined;
    return c.parent_id ? byId.get(c.parent_id) : c;
  };
  return {
    all, majors, byId, byCode, majorOf,
    subs: (m) => kids.get(m) ?? [],
    path: (id) => {
      const c = id ? byId.get(id) : undefined;
      if (!c) return 'غير مصنّف';
      const m = c.parent_id ? byId.get(c.parent_id) : undefined;
      return m ? `${m.name_ar} ← ${c.name_ar}` : c.name_ar;
    },
  };
}

export function useCatalog(farmId: string | null) {
  return useLiveQuery(async () => indexCategories(await db.product_categories.toArray(), farmId), [farmId]);
}

/** المواد المتاحة للمشروع (نسخة المشروع تغطي العام بنفس الاسم) */
export function useCatalogProducts(farmId: string | null, includeInactive = false) {
  return useLiveQuery(async () => {
    const all = await db.products.toArray();
    return shadowProducts(all, farmId)
      .filter((p) => includeInactive || p.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [farmId, includeInactive]);
}

/** تطبيع عربي/إنجليزي للبحث */
export function norm(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[\s\-_.,/()]+/g, ' ')
    .trim();
}

export function productMatches(p: Product, term: string, cat?: CatalogIndex): boolean {
  if (!term) return true;
  const t = norm(term);
  return [p.name, p.active_ingredient, p.bio_species, p.targets, p.moa_code, p.manufacturer, cat?.path(p.category_id)]
    .some((x) => norm(x).includes(t));
}

// ── سجل المبيدات: المواد الفعالة للمنتج ─────────────────────────────
export interface RegistryIndex {
  substances: Substance[];
  byId: Map<string, Substance>;
  limits: (substanceId: string) => Limit[];
  /** المواد الفعالة في منتج: من الربط الصريح، وإلا بمطابقة اسم المادة الفعالة */
  substancesOf: (p: Product) => Substance[];
}

export function useRegistry(farmId: string | null) {
  return useLiveQuery(async () => {
    const [subs, lims, links] = await Promise.all([
      db.active_substances.toArray(), db.substance_limits.toArray(), db.product_actives.toArray(),
    ]);
    return indexRegistry(subs, lims, links, farmId);
  }, [farmId]);
}

export function indexRegistry(subs: Substance[], lims: Limit[], links: Row<'product_actives'>[], farmId: string | null): RegistryIndex {
  const substances = subs.filter((s) => alive(s) && (s.farm_id == null || s.farm_id === farmId))
    .sort((a, b) => (a.name_ar ?? a.name_en).localeCompare(b.name_ar ?? b.name_en, 'ar'));
  const byId = new Map(substances.map((s) => [s.id, s]));
  const limBy = new Map<string, Limit[]>();
  for (const l of lims) if (alive(l) && (l.farm_id == null || l.farm_id === farmId)) {
    if (!limBy.has(l.substance_id)) limBy.set(l.substance_id, []);
    limBy.get(l.substance_id)!.push(l);
  }
  const linkBy = new Map<string, string[]>();
  for (const k of links) if (alive(k)) {
    if (!linkBy.has(k.product_id)) linkBy.set(k.product_id, []);
    linkBy.get(k.product_id)!.push(k.substance_id);
  }
  // فهرس الأسماء لمطابقة نص المادة الفعالة (عربي/إنجليزي)
  const names: { n: string; s: Substance }[] = [];
  for (const s of substances) {
    for (const n of [s.name_en, s.name_ar]) if (n && norm(n).length >= 4) names.push({ n: norm(n), s });
  }
  names.sort((a, b) => b.n.length - a.n.length);
  return {
    substances, byId,
    limits: (id) => limBy.get(id) ?? [],
    substancesOf: (p) => {
      const linked = (linkBy.get(p.id) ?? []).map((id) => byId.get(id)).filter(Boolean) as Substance[];
      if (linked.length) return linked;
      const ai = norm(p.active_ingredient);
      if (!ai) return [];
      const out: Substance[] = [];
      let rest = ` ${ai} `;
      for (const { n, s } of names) {
        if (rest.includes(n) && !out.includes(s)) {
          out.push(s);
          rest = rest.replace(n, ' ');
        }
      }
      return out;
    },
  };
}

/** رموز المحاصيل في التطبيق ← رموز جداول المتبقيات */
export function cropKey(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (c.includes('tomato')) return 'tomato';
  if (c.includes('pepper') || c.includes('capsicum')) return 'pepper';
  if (c.includes('cucumber')) return 'cucumber';
  if (c.includes('strawberry')) return 'strawberry';
  if (c.includes('eggplant') || c.includes('aubergine')) return 'eggplant';
  if (c.includes('melon') || c.includes('cantaloupe')) return 'melon';
  if (c.includes('bean')) return 'green_bean';
  return c;
}

export interface ComplianceIssue {
  level: 'bad' | 'warn' | 'info';
  text: string;
}

/**
 * فحص التصدير لمادة على محصول وأسواق: اعتماد الاتحاد الأوروبي + حدود المتبقيات + فترة الأمان لكل سوق.
 * لا نخترع أرقامًا: لو مفيش بيانات للسوق/المحصول نقول ذلك صراحة.
 */
export function complianceFor(p: Product, reg: RegistryIndex, crop: string | null, markets: string[]): ComplianceIssue[] {
  const subs = reg.substancesOf(p);
  const out: ComplianceIssue[] = [];
  const exportEU = markets.includes('EU') || markets.includes('UK');
  if (!subs.length) {
    if (!p.is_bio && p.product_type !== 'fertilizer' && p.product_type !== 'biostimulant' && markets.length)
      out.push({ level: 'info', text: `${p.name}: المادة الفعالة غير مربوطة بسجل المبيدات — راجعها قبل التصدير.` });
    return out;
  }
  for (const s of subs) {
    const label = s.name_ar ? `${s.name_ar} (${s.name_en})` : s.name_en;
    if (exportEU && s.eu_status === 'not_approved')
      out.push({ level: 'bad', text: `${p.name}: ${label} غير معتمدة في الاتحاد الأوروبي — الحد غالبًا عند حد الكشف 0.01 مجم/كجم، والشحنة معرضة للرفض.` });
    else if (exportEU && s.eu_status === 'pending')
      out.push({ level: 'warn', text: `${p.name}: ${label} قيد المراجعة في الاتحاد الأوروبي.` });
    if (!crop) continue;
    for (const m of markets) {
      const l = reg.limits(s.id).find((x) => x.market === m && x.crop_code === crop);
      if (!l) continue;
      const parts = [l.mrl_mg_kg != null ? `MRL ${Number(l.mrl_mg_kg)} مجم/كجم${l.default_loq ? ' (حد الكشف الافتراضي)' : ''}` : null,
        l.phi_days != null ? `فترة أمان ${l.phi_days} يوم` : null].filter(Boolean).join('، ');
      if (parts) out.push({ level: l.default_loq ? 'bad' : 'info', text: `${p.name} — ${label} — ${m}: ${parts}` });
    }
  }
  return out;
}
