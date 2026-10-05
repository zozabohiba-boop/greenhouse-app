// هيكل الموقع: قطاع ← قطعة ← بلوك ← صف ← صوبة (بعمق حر)
// دوال خالصة (قابلة للاختبار) + hook يقرأ الهيكل من القاعدة المحلية.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { alive } from './repo';
import type { Row } from './schema';

export type Zone = Row<'farm_zones'>;
export type ZoneKind = 'sector' | 'plot' | 'block' | 'row' | 'other';

export const ZONE_KINDS: { v: ZoneKind; label: string; hint: string }[] = [
  { v: 'sector', label: 'قطاع', hint: 'تقسيم كبير داخل الموقع' },
  { v: 'plot', label: 'قطعة', hint: 'قطعة أرض داخل القطاع' },
  { v: 'block', label: 'بلوك', hint: 'مجموعة صوب متجاورة' },
  { v: 'row', label: 'صف', hint: 'صف صوب (A، B، 1، 2 ...)' },
  { v: 'other', label: 'مكان', hint: 'أي تقسيم آخر' },
];
export const KIND_LABEL: Record<string, string> = Object.fromEntries(ZONE_KINDS.map((k) => [k.v, k.label]));

const ROOT = '';
const natural = (a: string, b: string) => a.localeCompare(b, 'ar', { numeric: true });

/** اسم المكان كما يُعرض: "قطاع 1" — ولو الاسم فيه نوعه أصلًا ("القطاع الأول") يُعرض كما هو */
export function zoneTitle(z: Pick<Zone, 'kind' | 'name'>): string {
  const label = KIND_LABEL[z.kind] ?? '';
  const name = z.name.trim();
  if (!label || z.kind === 'other') return name;
  const bare = label.replace(/^ال/, '');
  return name.includes(bare) ? name : `${label} ${name}`;
}

export interface ZoneIndex {
  list: Zone[];
  byId: Map<string, Zone>;
  /** أبناء كل مكان ('' = جذر الموقع) مرتبين */
  children: Map<string, Zone[]>;
}

export function indexZones(zones: Zone[]): ZoneIndex {
  const live = zones.filter((z) => alive(z));
  const byId = new Map(live.map((z) => [z.id, z]));
  const children = new Map<string, Zone[]>();
  for (const z of live) {
    // أب محذوف أو مفقود → يظهر في الجذر بدل ما يختفي
    const p = z.parent_id && byId.has(z.parent_id) ? z.parent_id : ROOT;
    const arr = children.get(p) ?? [];
    arr.push(z);
    children.set(p, arr);
  }
  for (const arr of children.values()) arr.sort((a, b) => a.sort_order - b.sort_order || natural(zoneTitle(a), zoneTitle(b)));
  return { list: live, byId, children };
}

/** المسار من الجذر حتى المكان (شامل) */
export function zonePath(idx: ZoneIndex, id: string | null | undefined): Zone[] {
  const out: Zone[] = [];
  const seen = new Set<string>();
  for (let cur = id ? idx.byId.get(id) : undefined; cur && !seen.has(cur.id); cur = cur.parent_id ? idx.byId.get(cur.parent_id) : undefined) {
    seen.add(cur.id);
    out.unshift(cur);
  }
  return out;
}

export const pathText = (idx: ZoneIndex, id: string | null | undefined, sep = ' › ') =>
  zonePath(idx, id).map(zoneTitle).join(sep);

/** المكان وكل ما تحته */
export function descendants(idx: ZoneIndex, id: string): Set<string> {
  const out = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    for (const c of idx.children.get(stack.pop()!) ?? []) {
      if (!out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

/** مكان الصوبة الفعلي (لو مكانها اتحذف ترجع للجذر) */
export const ghZone = (idx: ZoneIndex, g: { zone_id: string | null }): string =>
  g.zone_id && idx.byId.has(g.zone_id) ? g.zone_id : ROOT;

/** الصوب داخل مكان معيّن وكل ما تحته */
export function ghsUnder<T extends { zone_id: string | null }>(idx: ZoneIndex, zoneId: string, ghs: T[]): T[] {
  if (!zoneId) return ghs;
  const set = descendants(idx, zoneId);
  return ghs.filter((g) => set.has(ghZone(idx, g)));
}

/**
 * اسم مختصر لكل صوبة: الكود وحده لو مش متكرر في الموقع،
 * ولو متكرر (صوبة 1 في كل صف) يُضاف اسم المكان: "صف A / 1"
 */
export function ghLabels(idx: ZoneIndex, ghs: { id: string; code: string; zone_id: string | null }[]): Map<string, string> {
  const count = new Map<string, number>();
  for (const g of ghs) count.set(g.code, (count.get(g.code) ?? 0) + 1);
  const out = new Map<string, string>();
  for (const g of ghs) {
    if ((count.get(g.code) ?? 0) <= 1) out.set(g.id, g.code);
    else {
      const path = zonePath(idx, ghZone(idx, g)).map(zoneTitle);
      out.set(g.id, path.length ? `${path.join(' / ')} / ${g.code}` : g.code);
    }
  }
  return out;
}

/** ترتيب الصوب حسب مكانها في الشجرة ثم الكود — للقوائم المسطحة */
export function sortByTree<T extends { code: string; zone_id: string | null }>(idx: ZoneIndex, ghs: T[]): T[] {
  const order = new Map<string, number>();
  let i = 0;
  const walk = (p: string) => {
    order.set(p, i++);
    for (const c of idx.children.get(p) ?? []) walk(c.id);
  };
  walk(ROOT);
  return [...ghs].sort((a, b) => (order.get(ghZone(idx, a)) ?? 0) - (order.get(ghZone(idx, b)) ?? 0) || natural(a.code, b.code));
}

/** مجموعات للعرض: كل مكان فيه صوب مباشرة + عنوان مساره */
export function groupByZone<T extends { code: string; zone_id: string | null }>(idx: ZoneIndex, ghs: T[]): { zoneId: string; title: string; items: T[] }[] {
  const sorted = sortByTree(idx, ghs);
  const groups: { zoneId: string; title: string; items: T[] }[] = [];
  for (const g of sorted) {
    const z = ghZone(idx, g);
    let last = groups[groups.length - 1];
    if (!last || last.zoneId !== z) {
      last = { zoneId: z, title: z ? pathText(idx, z) : 'بدون تقسيم', items: [] };
      groups.push(last);
    }
    last.items.push(g);
  }
  return groups;
}

/** المكان المسموح يكون أبًا لمكان معيّن (أي مكان ليس هو ولا تحته) */
export function validParents(idx: ZoneIndex, zoneId: string | null): Zone[] {
  const banned = zoneId ? descendants(idx, zoneId) : new Set<string>();
  return idx.list.filter((z) => !banned.has(z.id));
}

/** كل الأماكن مرتبة كشجرة مع العمق — للقوائم المنسدلة */
export function flatTree(idx: ZoneIndex, filter?: (z: Zone) => boolean): { z: Zone; depth: number }[] {
  const out: { z: Zone; depth: number }[] = [];
  const walk = (p: string, depth: number) => {
    for (const c of idx.children.get(p) ?? []) {
      if (!filter || filter(c)) out.push({ z: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(ROOT, 0);
  return out;
}

/**
 * تسلسل أسماء: من "1" إلى "20" (مع أصفار لو لزم) أو من "A" إلى "H".
 * يرجّع null لو المدخلات غير صالحة.
 */
export function nameSequence(from: string, to: string, prefix = '', pad = true): string[] | null {
  const a = from.trim();
  const b = to.trim();
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    const x = Number(a);
    const y = Number(b);
    if (y < x || y - x >= 200) return null;
    const width = pad ? Math.max(a.length, b.length) : 0;
    const out: string[] = [];
    for (let n = x; n <= y; n++) out.push(prefix + String(n).padStart(width, '0'));
    return out;
  }
  if (/^[A-Za-z]$/.test(a) && /^[A-Za-z]$/.test(b)) {
    const x = a.toUpperCase().charCodeAt(0);
    const y = b.toUpperCase().charCodeAt(0);
    if (y < x) return null;
    const out: string[] = [];
    for (let c = x; c <= y; c++) out.push(prefix + String.fromCharCode(c));
    return out;
  }
  return null;
}

const EMPTY: ZoneIndex = { list: [], byId: new Map(), children: new Map() };

/** هيكل الموقع الحالي من القاعدة المحلية */
export function useZones(farmId: string | null): ZoneIndex | undefined {
  return useLiveQuery(async () => {
    if (!farmId) return EMPTY;
    return indexZones(await db.farm_zones.where('farm_id').equals(farmId).toArray());
  }, [farmId]);
}

/** اسم مختصر لكل صوبة في الموقع (الكود، أو المكان/الكود لو الكود متكرر) */
export function useGhLabels(farmId: string | null): Map<string, string> | undefined {
  return useLiveQuery(async () => {
    if (!farmId) return new Map<string, string>();
    const [zs, ghs] = await Promise.all([
      db.farm_zones.where('farm_id').equals(farmId).toArray(),
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
    ]);
    return ghLabels(indexZones(zs), ghs.filter((g) => alive(g)));
  }, [farmId]);
}
