// منطق الفحص الحشري والمعاملات — دوال نقية تُحسب على الجهاز (تعمل أوفلاين)
// وتطابق منطق الـ views على السيرفر: v_pest_weekly و v_greenhouse_phi_status و v_spray_moa_counts.

import { isoWeek, weekKey } from './dates';

const alive = <T extends { deleted_at?: string | null }>(r: T | undefined | null): r is T => !!r && !r.deleted_at;

/** يضيف أيامًا لتاريخ YYYY-MM-DD */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** آخر n أسبوع ISO حتى الأسبوع الذي يحتوي today (الأقدم أولًا) */
export function lastWeeks(today: string, n: number): { year: number; week: number; key: number; start: string }[] {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(today, -7 * i);
    const { year, week } = isoWeek(d);
    // بداية الأسبوع (الاثنين)
    const [y, m, dd] = d.split('-').map(Number);
    const dow = new Date(Date.UTC(y, m - 1, dd)).getUTCDay() || 7;
    out.push({ year, week, key: weekKey(year, week), start: addDays(d, 1 - dow) });
  }
  return out;
}

// ── فترة الأمان (PHI) ───────────────────────────────────────────────
interface Act { id: string; performed_on: string; deleted_at?: string | null; activity_type: string }
interface ActGh { activity_id: string; greenhouse_id: string; deleted_at?: string | null }
interface ActProd { activity_id: string; product_id: string; deleted_at?: string | null }
interface Prod { id: string; name: string; phi_days: number | null; moa_code: string | null }

export interface PhiState {
  /** أول يوم مسموح فيه بالحصاد */
  until: string;
  product: string;
  performedOn: string;
}

/** لكل صوبة: آخر تاريخ يُسمح فيه بالحصاد بناءً على فترات الأمان — فقط الصوب الممنوعة اليوم */
export function phiByGreenhouse(
  acts: Act[], ags: ActGh[], aps: ActProd[], prods: Prod[], today: string,
): Map<string, PhiState> {
  const prod = new Map(prods.map((p) => [p.id, p]));
  const actById = new Map(acts.filter(alive).map((a) => [a.id, a]));
  // أطول فترة أمان لكل معاملة
  const perAct = new Map<string, PhiState>();
  for (const ap of aps) {
    if (!alive(ap)) continue;
    const a = actById.get(ap.activity_id);
    const p = prod.get(ap.product_id);
    if (!a || !p || p.phi_days == null) continue;
    const until = addDays(a.performed_on, p.phi_days);
    const cur = perAct.get(a.id);
    if (!cur || until > cur.until) perAct.set(a.id, { until, product: p.name, performedOn: a.performed_on });
  }
  const out = new Map<string, PhiState>();
  for (const ag of ags) {
    if (!alive(ag)) continue;
    const s = perAct.get(ag.activity_id);
    if (!s || s.until <= today) continue;
    const cur = out.get(ag.greenhouse_id);
    if (!cur || s.until > cur.until) out.set(ag.greenhouse_id, s);
  }
  return out;
}

// ── إدارة المقاومة (MOA) ────────────────────────────────────────────
export interface MoaUse { performed_on: string; moa: string }

/** تاريخ استخدام مجموعات طريقة التأثير على صوبة (الأحدث أولًا) */
export function moaHistory(ghId: string, acts: Act[], ags: ActGh[], aps: ActProd[], prods: Prod[], excludeActivity?: string): MoaUse[] {
  const prod = new Map(prods.map((p) => [p.id, p]));
  const onGh = new Set(ags.filter((x) => alive(x) && x.greenhouse_id === ghId).map((x) => x.activity_id));
  const actById = new Map(acts.filter((a) => alive(a) && onGh.has(a.id) && a.id !== excludeActivity
    && (a.activity_type === 'chemical_spray' || a.activity_type === 'fertigation_injection')).map((a) => [a.id, a]));
  const out: MoaUse[] = [];
  for (const ap of aps) {
    if (!alive(ap)) continue;
    const a = actById.get(ap.activity_id);
    const moa = prod.get(ap.product_id)?.moa_code?.trim();
    if (a && moa) out.push({ performed_on: a.performed_on, moa });
  }
  return out.sort((x, y) => (x.performed_on < y.performed_on ? 1 : -1));
}

/**
 * عدد مرات استخدام نفس المجموعة متتاليًا قبل هذه المعاملة.
 * القاعدة العملية: لا تُكرر نفس مجموعة IRAC/FRAC أكثر من مرتين متتاليتين على نفس الجيل من الآفة.
 */
export function consecutiveMoa(history: MoaUse[], moa: string, before: string): number {
  // نجمع حسب يوم المعاملة: معاملة واحدة قد تحتوي أكثر من مادة
  const days = new Map<string, Set<string>>();
  for (const h of history) {
    if (h.performed_on > before) continue;
    if (!days.has(h.performed_on)) days.set(h.performed_on, new Set());
    days.get(h.performed_on)!.add(h.moa);
  }
  const ordered = [...days.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  let n = 0;
  for (const [, set] of ordered) {
    if (set.has(moa)) n++;
    else break;
  }
  return n;
}

// ── ضغط الآفات ──────────────────────────────────────────────────────
interface Sess { id: string; greenhouse_id: string; scouted_on: string; iso_year: number | null; iso_week: number | null; deleted_at?: string | null }
interface Obs { session_id: string; pest_id: string; severity: number; is_hotspot: boolean; row_no: number | null; deleted_at?: string | null }

export interface PressureCell {
  max: number;
  hotspots: number;
  observations: number;
  /** أعلى شدة لكل آفة */
  pests: Map<string, number>;
  scouted: boolean;
}

/** شبكة ضغط الآفات: صوبة × أسبوع → أعلى شدة. خلية scouted=true بلا ملاحظات = صوبة نظيفة */
export function pressureGrid(sessions: Sess[], obs: Obs[], pestFilter?: string | null): Map<string, PressureCell> {
  const sById = new Map(sessions.filter(alive).map((s) => [s.id, s]));
  const grid = new Map<string, PressureCell>();
  const cell = (s: Sess) => {
    const k = `${s.greenhouse_id}|${weekKey(s.iso_year ?? 0, s.iso_week ?? 0)}`;
    let c = grid.get(k);
    if (!c) grid.set(k, (c = { max: 0, hotspots: 0, observations: 0, pests: new Map(), scouted: true }));
    return c;
  };
  for (const s of sById.values()) cell(s);
  for (const o of obs) {
    if (!alive(o)) continue;
    if (pestFilter && o.pest_id !== pestFilter) continue;
    const s = sById.get(o.session_id);
    if (!s) continue;
    const c = cell(s);
    c.observations++;
    c.max = Math.max(c.max, o.severity);
    if (o.is_hotspot) c.hotspots++;
    c.pests.set(o.pest_id, Math.max(c.pests.get(o.pest_id) ?? 0, o.severity));
  }
  return grid;
}

/** أعلى شدة لكل خط داخل جولة — لخريطة الصوبة */
export function severityByRow(obs: Obs[]): Map<number, { max: number; hotspot: boolean }> {
  const out = new Map<number, { max: number; hotspot: boolean }>();
  for (const o of obs) {
    if (!alive(o) || o.row_no == null) continue;
    const cur = out.get(o.row_no) ?? { max: 0, hotspot: false };
    out.set(o.row_no, { max: Math.max(cur.max, o.severity), hotspot: cur.hotspot || o.is_hotspot });
  }
  return out;
}
