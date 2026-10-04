// لوحة المتابعة للإدارة والاستشاري: كل شيء محسوب على الجهاز من البيانات المتزامنة (تعمل أوفلاين)

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { formatDate, todayLocal, weekKey } from '../lib/dates';
import { lastWeeks, phiByGreenhouse, pressureGrid } from '../lib/ipm';
import { activeTarget, BALANCE_LABEL, summarize, type WeekSummary } from '../lib/balance';
import { activeCycle, usePests } from '../lib/hooks';
import { SEVERITY } from '../lib/labels';
import { Icon } from '../components/Icon';
import { phiText } from './Activities';
import { SevChip } from './Scout';
import { byCode } from './Home';
import type { Row } from '../lib/schema';

const RANGES = [4, 8, 12] as const;

export function Dashboard() {
  const { farmId } = useApp();
  const nav = useNavigate();
  const today = todayLocal();
  const [n, setN] = useState<(typeof RANGES)[number]>(8);
  const [pestFilter, setPestFilter] = useState('');
  const [chartGh, setChartGh] = useState<string | null>(null);
  const pests = usePests(farmId);
  const weeks = useMemo(() => lastWeeks(today, n), [today, n]);
  const thisWeek = weeks[weeks.length - 1];

  const raw = useLiveQuery(async () => {
    const t = (name: 'greenhouses' | 'crop_cycles' | 'scouting_sessions' | 'scouting_observations' | 'plant_measurements' | 'balance_targets' | 'reference_plants' | 'activities' | 'activity_greenhouses' | 'activity_products' | 'recommendations') =>
      db.tableOf(name).where('farm_id').equals(farmId!).toArray();
    const [ghs, cycles, sessions, obs, meas, targets, plants, acts, ags, aps, recs, prods, crops] = await Promise.all([
      t('greenhouses'), t('crop_cycles'), t('scouting_sessions'), t('scouting_observations'), t('plant_measurements'),
      t('balance_targets'), t('reference_plants'), t('activities'), t('activity_greenhouses'), t('activity_products'),
      t('recommendations'), db.products.toArray(), db.crops.toArray(),
    ]);
    return { ghs, cycles, sessions, obs, meas, targets, plants, acts, ags, aps, recs, prods, crops };
  }, [farmId]);

  const v = useMemo(() => {
    if (!raw) return null;
    const ghs = (raw.ghs as Row<'greenhouses'>[]).filter(alive).sort(byCode);
    const cycles = (raw.cycles as Row<'crop_cycles'>[]).filter(alive);
    const cropName = new Map((raw.crops as Row<'crops'>[]).map((c) => [c.id, c.name_ar]));
    const from = weeks[0].start;
    const sessions = (raw.sessions as Row<'scouting_sessions'>[]).filter((s) => alive(s) && s.scouted_on >= from);
    const sIds = new Set(sessions.map((s) => s.id));
    const obs = (raw.obs as Row<'scouting_observations'>[]).filter((o) => alive(o) && sIds.has(o.session_id));
    const grid = pressureGrid(sessions, obs, pestFilter || null);
    const phi = phiByGreenhouse(raw.acts as any, raw.ags as any, raw.aps as any, raw.prods as any, today);

    // توازن النبات أسبوعيًا لكل صوبة (الدورة القائمة)
    const meas = (raw.meas as Row<'plant_measurements'>[]).filter(alive);
    const targets = (raw.targets as Row<'balance_targets'>[]).filter(alive);
    const plants = (raw.plants as Row<'reference_plants'>[]).filter((p) => alive(p) && p.is_active);
    const rows = ghs.map((g) => {
      const cycle = activeCycle(cycles, g.id);
      const balance = new Map<number, WeekSummary>();
      const series: { key: number; week: number; s: WeekSummary | null; lo: { g: [number | null, number | null]; d: [number | null, number | null] } }[] = [];
      let measuredThisWeek = 0;
      if (cycle) {
        const cm = meas.filter((m) => m.crop_cycle_id === cycle.id);
        const byWeek = new Map<number, Row<'plant_measurements'>[]>();
        for (const m of cm) {
          const k = weekKey(m.iso_year ?? 0, m.iso_week ?? 0);
          if (!byWeek.has(k)) byWeek.set(k, []);
          byWeek.get(k)!.push(m);
        }
        const keys = [...byWeek.keys()].sort((a, b) => a - b);
        const ct = targets.filter((x) => x.crop_cycle_id === cycle.id);
        keys.forEach((k, i) => {
          const list = byWeek.get(k)!;
          const d = list.map((m) => m.measured_on).sort()[0];
          balance.set(k, summarize(list, activeTarget(ct, d), i > 0 ? byWeek.get(keys[i - 1])! : []));
        });
        for (const w of weeks) {
          const s = balance.get(w.key) ?? null;
          const t = activeTarget(ct, w.start);
          series.push({ key: w.key, week: w.week, s, lo: { g: [t?.weekly_growth_min_cm ?? null, t?.weekly_growth_max_cm ?? null], d: [t?.stem_diameter_min_mm ?? null, t?.stem_diameter_max_mm ?? null] } });
        }
        measuredThisWeek = (byWeek.get(thisWeek.key) ?? []).length;
      }
      const plantCount = cycle ? plants.filter((p) => p.crop_cycle_id === cycle.id).length : 0;
      // المعاملات في الفترة
      const actIds = new Set((raw.ags as Row<'activity_greenhouses'>[]).filter((x) => alive(x) && x.greenhouse_id === g.id).map((x) => x.activity_id));
      const acts = (raw.acts as Row<'activities'>[]).filter((a) => alive(a) && actIds.has(a.id) && a.performed_on >= from);
      const count = { chemical_spray: 0, fertigation_injection: 0, bio_release: 0, cultural_operation: 0 } as Record<Row<'activities'>['activity_type'], number>;
      acts.forEach((a) => count[a.activity_type]++);
      const prod = new Map((raw.prods as Row<'products'>[]).map((p) => [p.id, p]));
      const moa = new Map<string, number>();
      const chem = new Set(acts.filter((a) => a.activity_type === 'chemical_spray' || a.activity_type === 'fertigation_injection').map((a) => a.id));
      for (const ap of raw.aps as Row<'activity_products'>[]) {
        if (!alive(ap) || !chem.has(ap.activity_id)) continue;
        const code = prod.get(ap.product_id)?.moa_code;
        if (code) moa.set(code, (moa.get(code) ?? 0) + 1);
      }
      return { g, cycle, crop: cycle ? cropName.get(cycle.crop_id) : undefined, balance, series, measuredThisWeek, plantCount, count, moa };
    });

    const withCycle = rows.filter((r) => r.cycle && r.plantCount > 0);
    const registered = withCycle.filter((r) => r.measuredThisWeek >= r.plantCount).length;
    const scouted = ghs.filter((g) => grid.has(`${g.id}|${thisWeek.key}`)).length;
    const recs = (raw.recs as Row<'recommendations'>[]).filter((r) => alive(r) && (r.status === 'open' || r.status === 'in_progress'));
    const executed = new Set((raw.acts as Row<'activities'>[]).filter((a) => alive(a) && a.recommendation_id).map((a) => a.recommendation_id));
    const openRecs = recs.filter((r) => !executed.has(r.id));
    const overdue = openRecs.filter((r) => r.due_on && r.due_on < today).length;

    // أكثر الآفات انتشارًا في الفترة: عدد (صوبة × أسبوع) بشدة ≥ 2
    const pestSpread = new Map<string, { cells: number; max: number }>();
    for (const c of pressureGrid(sessions, obs).values()) {
      for (const [pid, sev] of c.pests) {
        const cur = pestSpread.get(pid) ?? { cells: 0, max: 0 };
        if (sev >= 2) cur.cells++;
        cur.max = Math.max(cur.max, sev);
        pestSpread.set(pid, cur);
      }
    }
    const topPests = [...pestSpread.entries()].filter(([, x]) => x.max > 0).sort((a, b) => b[1].cells - a[1].cells || b[1].max - a[1].max).slice(0, 6);
    return { ghs, rows, grid, phi, withCycle, registered, scouted, openRecs, overdue, topPests };
  }, [raw, weeks, pestFilter, today, thisWeek.key]);

  if (!v) return null;
  const pestName = new Map((pests ?? []).map((p) => [p.id, p.name_ar]));
  const chartRow = v.rows.find((r) => r.g.id === chartGh) ?? v.rows.find((r) => r.cycle && r.balance.size) ?? null;

  return (
    <main className="page dash">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>لوحة المتابعة</h1><p>الأسبوع {thisWeek.week} — {formatDate(today)}</p></div>
        <div className="seg" role="group" aria-label="الفترة">
          {RANGES.map((r) => <button key={r} aria-pressed={n === r} onClick={() => setN(r)}>{r} أسابيع</button>)}
        </div>
      </div>

      <div className="kpis">
        <Kpi k="تسجيل المحصول هذا الأسبوع" v={`${v.registered} / ${v.withCycle.length}`} sub="صوبة اكتمل تسجيلها" tone={v.registered < v.withCycle.length ? 'warn' : 'ok'} to="/register" />
        <Kpi k="الفحص الحشري هذا الأسبوع" v={`${v.scouted} / ${v.ghs.length}`} sub="صوبة فُحصت" tone={v.scouted < v.ghs.length ? 'warn' : 'ok'} to="/scout" />
        <Kpi k="ممنوع الحصاد اليوم" v={String(v.phi.size)} sub={v.phi.size ? 'صوبة في فترة أمان' : 'كل الصوب مسموح حصادها'} tone={v.phi.size ? 'bad' : 'ok'} to="/activities" />
        <Kpi k="توصيات مفتوحة" v={String(v.openRecs.length)} sub={v.overdue ? `${v.overdue} متأخرة` : 'لا توجد متأخرة'} tone={v.overdue ? 'bad' : v.openRecs.length ? 'warn' : 'ok'} to="/recs" />
      </div>

      {v.phi.size > 0 && (
        <div className="phi-board" style={{ marginTop: 14 }}>
          {[...v.phi.entries()].map(([gid, s]) => (
            <div key={gid} className="phi-card"><Icon name="shield" size={22} /><span><b className="num">{v.ghs.find((g) => g.id === gid)?.code}</b><small>{phiText(s.until, today)} — {s.product}</small></span></div>
          ))}
        </div>
      )}

      {/* خريطة ضغط الآفات — العنصر الأهم في اللوحة */}
      <section className="panel panel-pad" style={{ marginTop: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div><h2 className="h2">ضغط الآفات</h2><p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>أعلى شدة إصابة لكل صوبة في كل أسبوع. اضغط على الخلية لعرض جولات الصوبة.</p></div>
          <select className="select" style={{ width: 'auto', minWidth: 200 }} value={pestFilter} onChange={(e) => setPestFilter(e.target.value)} aria-label="الآفة">
            <option value="">كل الآفات والأمراض</option>
            {(pests ?? []).map((p) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
          </select>
        </div>
        <LatestFirst>
          <table className="heat">
            <thead>
              <tr><th scope="col">الصوبة</th>{weeks.map((w) => <th key={w.key} scope="col">{w.week}</th>)}</tr>
            </thead>
            <tbody>
              {v.ghs.map((g) => (
                <tr key={g.id}>
                  <th scope="row"><span className="num">{g.code}</span></th>
                  {weeks.map((w) => {
                    const c = v.grid.get(`${g.id}|${w.key}`);
                    const tip = c
                      ? c.observations === 0 ? 'فُحصت — نظيفة'
                        : [...c.pests.entries()].sort((a, b) => b[1] - a[1]).map(([pid, s]) => `${pestName.get(pid) ?? ''}: ${SEVERITY[s].label}`).join('\n')
                      : 'لم تُفحص';
                    return (
                      <td key={w.key}>
                        <button className="hcell" data-v={c ? c.max : 'none'} title={`${g.code} — الأسبوع ${w.week}\n${tip}`}
                          aria-label={`${g.code} الأسبوع ${w.week}: ${tip}`} onClick={() => nav(`/scout/gh/${g.id}`)}>
                          {c ? (c.observations ? c.max : '✓') : ''}
                          {c && c.hotspots > 0 && <i />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </LatestFirst>
        <div className="sev-legend" style={{ marginTop: 10 }}>
          <span><i data-v="none" />لم تُفحص</span>
          <span><i data-v="0" />نظيفة</span>
          {SEVERITY.slice(1).map((x) => <span key={x.v}><i data-v={x.v} />{x.v} {x.label}</span>)}
          <span><i className="dot" />بؤرة</span>
        </div>
      </section>

      {v.topPests.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <h2 className="section-title">أكثر الآفات انتشارًا في الفترة</h2>
          <div className="top-pests">
            {v.topPests.map(([pid, x]) => (
              <button key={pid} className="panel top-pest" onClick={() => setPestFilter(pid)}>
                <b>{pestName.get(pid) ?? 'آفة'}</b>
                <span className="row" style={{ gap: 6 }}><SevChip v={x.max} /><small className="muted">{x.cells ? `${x.cells} صوبة×أسبوع بشدة متوسطة فأعلى` : 'إصابات خفيفة فقط'}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel panel-pad" style={{ marginTop: 22 }}>
        <h2 className="h2">توازن النبات</h2>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 12 }}>حكم كل أسبوع من مقارنة الاستطالة وسمك الساق وارتفاع العنقود المزهر بالقيم المستهدفة.</p>
        <LatestFirst>
          <table className="heat bal">
            <thead><tr><th>الصوبة</th>{weeks.map((w) => <th key={w.key} scope="col">{w.week}</th>)}</tr></thead>
            <tbody>
              {v.rows.filter((r) => r.cycle).map((r) => (
                <tr key={r.g.id}>
                  <th scope="row"><span className="num">{r.g.code}</span> <small className="faint">{r.crop}</small></th>
                  {weeks.map((w) => {
                    const s = r.balance.get(w.key);
                    return (
                      <td key={w.key}>
                        <button className="bcell" data-b={s?.status ?? 'none'} title={s ? `${BALANCE_LABEL[s.status]} — ${s.plants} نبات` : 'لا يوجد تسجيل'}
                          onClick={() => r.cycle && nav(`/register/${r.cycle.id}/summary?d=${w.start}`)} aria-label={`${r.g.code} الأسبوع ${w.week}: ${s ? BALANCE_LABEL[s.status] : 'لا يوجد تسجيل'}`}>
                          {s ? BAL_SHORT[s.status] : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </LatestFirst>
        <div className="sev-legend" style={{ marginTop: 10 }}>
          {(['generative', 'tending_generative', 'balanced', 'tending_vegetative', 'vegetative', 'undetermined'] as const).map((b) => (
            <span key={b}><i data-b={b} />{BALANCE_LABEL[b]}</span>
          ))}
        </div>
      </section>

      {chartRow && chartRow.cycle && (
        <section className="panel panel-pad" style={{ marginTop: 22 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 className="h2">منحنيات النمو — <span className="num">{chartRow.g.code}</span></h2>
            <select className="select" style={{ width: 'auto' }} value={chartRow.g.id} onChange={(e) => setChartGh(e.target.value)} aria-label="الصوبة">
              {v.rows.filter((r) => r.cycle).map((r) => <option key={r.g.id} value={r.g.id}>{r.g.code} — {r.crop}</option>)}
            </select>
          </div>
          <div className="charts">
            <LineChart title="الاستطالة الأسبوعية" unit="سم" points={chartRow.series.map((p) => ({ x: p.week, y: p.s?.weeklyGrowth ?? null, band: p.lo.g }))} />
            <LineChart title="سمك الساق" unit="مم" points={chartRow.series.map((p) => ({ x: p.week, y: p.s?.stemDiameter ?? null, band: p.lo.d }))} />
            <LineChart title="ارتفاع العنقود المزهر" unit="سم" points={chartRow.series.map((p) => ({ x: p.week, y: p.s?.floweringHeight ?? null, band: [null, null] }))} />
            <LineChart title="نسبة العقد" unit="%" points={chartRow.series.map((p) => ({ x: p.week, y: p.s?.fruitSet ?? null, band: [null, null] }))} />
          </div>
        </section>
      )}

      <h2 className="section-title">المعاملات في آخر {n} أسابيع</h2>
      <div className="panel scroll-x">
        <table className="tbl">
          <thead><tr><th>الصوبة</th><th>رش</th><th>حقن</th><th>إطلاق حيوي</th><th>عمليات</th><th>مجموعات المقاومة المستخدمة</th></tr></thead>
          <tbody>
            {v.rows.map((r) => (
              <tr key={r.g.id}>
                <td><Link to={`/activities?gh=${r.g.id}`} className="num"><b>{r.g.code}</b></Link></td>
                <td className="n">{r.count.chemical_spray || '—'}</td>
                <td className="n">{r.count.fertigation_injection || '—'}</td>
                <td className="n">{r.count.bio_release || '—'}</td>
                <td className="n">{r.count.cultural_operation || '—'}</td>
                <td>
                  {[...r.moa.entries()].sort((a, b) => b[1] - a[1]).map(([code, c]) => (
                    <span key={code} className={`chip ${c >= 3 ? 'warn' : ''}`} style={{ marginInlineEnd: 4 }}><span className="num">{code}</span> × {c}</span>
                  ))}
                  {r.moa.size === 0 && <span className="faint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>مجموعة استُخدمت 3 مرات أو أكثر في الفترة تظهر بلون التنبيه — راجع التبديل بين المجموعات.</p>
    </main>
  );
}

const BAL_SHORT: Record<string, string> = {
  vegetative: 'خ', tending_vegetative: 'خ-', balanced: '✓', tending_generative: 'ث-', generative: 'ث', undetermined: '؟',
};

function Kpi({ k, v, sub, tone, to }: { k: string; v: string; sub: string; tone: 'ok' | 'warn' | 'bad'; to: string }) {
  return (
    <Link to={to} className="kpi" data-tone={tone}>
      <span className="k">{k}</span>
      <span className="v num">{v}</span>
      <span className="s">{tone !== 'ok' && <Icon name="alert" size={14} />}{sub}</span>
    </Link>
  );
}

/** منحنى بسيط لسلسلة واحدة + نطاق المستهدف (إن وُجد). العنوان يسمّي السلسلة فلا حاجة لمفتاح. */
function LineChart({ title, unit, points }: { title: string; unit: string; points: { x: number; y: number | null; band: [number | null, number | null] }[] }) {
  const W = 420, H = 200, L = 36, R = 14, T = 18, B = 26;
  const ys = points.flatMap((p) => [p.y, p.band[0], p.band[1]]).filter((x): x is number => x != null);
  const has = points.some((p) => p.y != null);
  if (!has) {
    return <figure className="chart"><figcaption>{title} <small>({unit})</small></figcaption><p className="faint chart-empty">لا توجد قياسات في الفترة</p></figure>;
  }
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.12;
  lo = Math.max(0, lo - pad); hi += pad;
  const step = niceStep((hi - lo) / 4);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const xAt = (i: number) => L + (points.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const yAt = (y: number) => T + ((hi - y) * (H - T - B)) / (hi - lo);
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100);
  // نطاق المستهدف: مضلع بين الحد الأدنى والأعلى للأسابيع التي لها نطاق كامل
  const bandIdx = points.map((p, i) => (p.band[0] != null && p.band[1] != null ? i : -1)).filter((i) => i >= 0);
  const band = bandIdx.length
    ? [...bandIdx.map((i) => `${xAt(i)},${yAt(points[i].band[1]!)}`), ...bandIdx.slice().reverse().map((i) => `${xAt(i)},${yAt(points[i].band[0]!)}`)].join(' ')
    : null;
  // الخط: يُقطع عند الأسابيع الناقصة
  const segs: string[] = [];
  let cur: string[] = [];
  points.forEach((p, i) => {
    if (p.y == null) { if (cur.length) segs.push(cur.join(' ')); cur = []; return; }
    cur.push(`${xAt(i)},${yAt(p.y)}`);
  });
  if (cur.length) segs.push(cur.join(' '));
  const last = [...points].reverse().find((p) => p.y != null)!;
  const lastI = points.lastIndexOf(last);

  return (
    <figure className="chart">
      <figcaption>{title} <small>({unit})</small></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${points.filter((p) => p.y != null).map((p) => `أسبوع ${p.x} ${p.y}`).join('، ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} className="grid" />
            <text x={L - 6} y={yAt(t) + 4} className="ax" textAnchor="end">{t}</text>
          </g>
        ))}
        {band && points.length > 1 && <polygon points={band} className="band" />}
        {band && points.length > 1 && bandIdx.length > 0 && <text x={xAt(bandIdx[0]) + 4} y={yAt(points[bandIdx[0]].band[1]!) - 4} className="ax band-l">المستهدف</text>}
        {segs.map((s, i) => (s.includes(' ') ? <polyline key={i} points={s} className="ln" /> : null))}
        {points.map((p, i) => (
          <g key={i}>
            <text x={xAt(i)} y={H - 8} className="ax" textAnchor="middle">{p.x}</text>
            {p.y != null && (
              <g className="pt" tabIndex={0}>
                <circle cx={xAt(i)} cy={yAt(p.y)} r={14} className="hit" />
                <circle cx={xAt(i)} cy={yAt(p.y)} r={4.5} className="dotp" />
                <title>{`الأسبوع ${p.x}: ${p.y} ${unit}${p.band[0] != null || p.band[1] != null ? ` (المستهدف ${p.band[0] ?? '…'}–${p.band[1] ?? '…'})` : ''}`}</title>
              </g>
            )}
          </g>
        ))}
        <text x={xAt(lastI)} y={yAt(last.y!) - 10} className="val" textAnchor="middle">{last.y}</text>
      </svg>
    </figure>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}


/** حاوية تمرير أفقي تبدأ عند أحدث أسبوع (آخر عمود — يسار الشاشة في العربي) */
function LatestFirst({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = -(el.scrollWidth - el.clientWidth);
  }, []);
  return <div className="scroll-x" ref={ref}>{children}</div>;
}
