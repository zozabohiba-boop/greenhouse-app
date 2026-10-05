import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { isoWeek, todayLocal, weekSpan } from '../lib/dates';
import { activeTarget, BALANCE_LABEL, summarize, type WeekSummary } from '../lib/balance';
import { Icon } from '../components/Icon';
import { PlaceLine } from '../components/ZoneBrowser';
import { FIELDS } from './fields';
import type { Row } from '../lib/schema';

type M = Row<'plant_measurements'>;

export function RegisterSummary() {
  const { cycleId } = useParams();
  const [sp] = useSearchParams();
  const date = sp.get('d') ?? todayLocal();
  const data = useLiveQuery(async () => {
    const cycle = await db.crop_cycles.get(cycleId!);
    if (!alive(cycle)) return null;
    const [gh, crop, plants, all, targets] = await Promise.all([
      db.greenhouses.get(cycle.greenhouse_id),
      db.crops.get(cycle.crop_id),
      db.reference_plants.where('crop_cycle_id').equals(cycle.id).toArray(),
      db.plant_measurements.where('crop_cycle_id').equals(cycle.id).toArray(),
      db.balance_targets.where('crop_cycle_id').equals(cycle.id).toArray(),
    ]);
    // تجميع القياسات حسب الأسبوع
    const weeks = new Map<number, M[]>();
    for (const m of all.filter(alive)) {
      const k = (m.iso_year ?? 0) * 100 + (m.iso_week ?? 0);
      if (!weeks.has(k)) weeks.set(k, []);
      weeks.get(k)!.push(m);
    }
    const keys = [...weeks.keys()].sort((a, b) => a - b);
    const summaries = keys.map((k, i) => {
      const list = weeks.get(k)!;
      const weekDate = list.map((m) => m.measured_on).sort()[0];
      const prev = i > 0 ? weeks.get(keys[i - 1])! : [];
      return { key: k, week: k % 100, date: weekDate, s: summarize(list, activeTarget(targets, weekDate), prev), list };
    });
    const { year, week } = isoWeek(date);
    const cur = summaries.find((x) => x.key === year * 100 + week) ?? null;
    const curIdx = cur ? summaries.indexOf(cur) : -1;
    const prev = curIdx > 0 ? summaries[curIdx - 1] : null;
    const plantLabel = new Map(plants.map((p) => [p.id, p]));
    const activePlants = plants.filter((p) => alive(p) && p.is_active).length;
    const target = activeTarget(targets, date);
    return { cycle, gh, crop, summaries, cur, prev, plantLabel, activePlants, target, week };
  }, [cycleId, date]);

  if (data === undefined) return null;
  if (data === null) return <main className="page"><div className="panel empty"><h3>الدورة غير موجودة</h3></div></main>;
  const { gh, crop, cur, prev, summaries, plantLabel, activePlants, target, week } = data;

  return (
    <main className="page">
      <Link to={`/register/${cycleId}${date !== todayLocal() ? `?d=${date}` : ''}`} className="back"><Icon name="back" size={18} /> الرجوع للتسجيل</Link>
      <div className="page-head">
        <div>
          <PlaceLine zoneId={gh?.zone_id} />
          <h1>ملخص الأسبوع {week} — <span className="num">{gh?.code}</span></h1>
          <p>{crop?.name_ar}، {weekSpan(date)}</p>
        </div>
        <Link to="/" className="btn"><Icon name="house" size={20} /> الرئيسية</Link>
      </div>

      {!cur ? (
        <div className="panel empty"><h3>لا توجد قياسات لهذا الأسبوع بعد</h3><Link className="btn primary" to={`/register/${cycleId}`}>ابدأ التسجيل</Link></div>
      ) : (
        <>
          {cur.s.plants < activePlants && (
            <div className="banner warn"><Icon name="alert" /> تم قياس {cur.s.plants} من {activePlants} نبات. المتوسطات تعتمد على النباتات المقاسة فقط.</div>
          )}
          <Gauge s={cur.s} hasTarget={!!target} />

          <h2 className="section-title">المؤشرات</h2>
          <div className="stats">
            <Stat k="الاستطالة الأسبوعية" u="سم" v={cur.s.weeklyGrowth} p={prev?.s.weeklyGrowth} sig={cur.s.signals.growth} range={target ? [target.weekly_growth_min_cm, target.weekly_growth_max_cm] : null} />
            <Stat k="سمك الساق" u="مم" v={cur.s.stemDiameter} p={prev?.s.stemDiameter} sig={cur.s.signals.diameter} range={target ? [target.stem_diameter_min_mm, target.stem_diameter_max_mm] : null} />
            <Stat k="ارتفاع العنقود المزهر" u="سم" v={cur.s.floweringHeight} p={prev?.s.floweringHeight} sig={cur.s.signals.floweringHeight} range={target ? [target.flowering_height_min_cm, target.flowering_height_max_cm] : null} />
            <Stat k="رقم العنقود المزهر" v={cur.s.floweringTruss} p={prev?.s.floweringTruss} />
            <Stat k="سرعة التزهير" u="عنقود/أسبوع" v={prev && cur.s.floweringTruss != null && prev.s.floweringTruss != null ? round1(cur.s.floweringTruss - prev.s.floweringTruss) : null} />
            <Stat k="نسبة العقد" u="%" v={cur.s.fruitSet} p={prev?.s.fruitSet} />
            <Stat k="الأزهار المتفتحة" v={cur.s.openFlowers} p={prev?.s.openFlowers} />
            <Stat k="الثمار على النبات" v={cur.s.fruitsOnPlant} p={prev?.s.fruitsOnPlant} />
            <Stat k="الأوراق المتبقية" v={cur.s.leavesRemaining} p={prev?.s.leavesRemaining} />
          </div>

          <h2 className="section-title">قياسات النباتات</h2>
          <div className="panel scroll-x">
            <table className="tbl">
              <thead>
                <tr><th>النبات</th>{FIELDS.map((f) => <th key={f.key}>{f.label}</th>)}<th>العقد %</th></tr>
              </thead>
              <tbody>
                {cur.list
                  .slice()
                  .sort((a, b) => (plantLabel.get(a.reference_plant_id)?.label ?? '').localeCompare(plantLabel.get(b.reference_plant_id)?.label ?? '', 'en', { numeric: true }))
                  .map((m) => (
                    <tr key={m.id}>
                      <td className="n">{plantLabel.get(m.reference_plant_id)?.label}</td>
                      {FIELDS.map((f) => <td key={f.key} className="n">{m[f.key] ?? '—'}</td>)}
                      <td className="n">{m.fruit_set_pct ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {summaries.length > 1 && (
        <>
          <h2 className="section-title">تطور الأسابيع</h2>
          <div className="panel scroll-x">
            <table className="tbl">
              <thead>
                <tr><th>الأسبوع</th><th>نباتات</th><th>الاستطالة</th><th>سمك الساق</th><th>ارتفاع المزهر</th><th>العنقود المزهر</th><th>العقد %</th><th>التوازن</th></tr>
              </thead>
              <tbody>
                {summaries.slice(-12).reverse().map((x) => (
                  <tr key={x.key} style={x === cur ? { background: 'var(--leaf-soft)' } : undefined}>
                    <td className="n">{x.week}</td>
                    <td className="n">{x.s.plants}</td>
                    <td className="n">{x.s.weeklyGrowth ?? '—'}</td>
                    <td className="n">{x.s.stemDiameter ?? '—'}</td>
                    <td className="n">{x.s.floweringHeight ?? '—'}</td>
                    <td className="n">{x.s.floweringTruss ?? '—'}</td>
                    <td className="n">{x.s.fruitSet ?? '—'}</td>
                    <td><BalanceChip s={x.s} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function BalanceChip({ s }: { s: WeekSummary }) {
  const cls = s.status === 'balanced' ? 'ok' : s.status === 'undetermined' ? '' : s.score > 0 ? 'info' : 'warn';
  return <span className={`chip ${cls}`}>{BALANCE_LABEL[s.status]}</span>;
}

/** مسطرة التوازن: ثمري ← متوازن → خضري */
function Gauge({ s, hasTarget }: { s: WeekSummary; hasTarget: boolean }) {
  const pos = ((Math.max(-3, Math.min(3, s.score)) + 3) / 6) * 100;
  const color = s.status === 'balanced' ? 'var(--leaf)' : s.status === 'undetermined' ? 'var(--ink-2)' : s.score > 0 ? 'var(--teal)' : 'var(--amber)';
  return (
    <section className="panel gauge" aria-label="توازن النبات">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="muted" style={{ fontWeight: 600 }}>توازن النبات هذا الأسبوع</p>
          <p className="verdict" style={{ color }}>{BALANCE_LABEL[s.status]}</p>
        </div>
        <p className="muted" style={{ maxWidth: 420, fontSize: 'var(--fs-sm)' }}>
          {hasTarget
            ? 'الحكم من مقارنة الاستطالة وسمك الساق وارتفاع العنقود المزهر بالقيم المستهدفة للدورة.'
            : 'لم تُحدد القيم المستهدفة لهذه الدورة، فلا يمكن الحكم. يحددها الاستشاري من شاشة الدورة.'}
        </p>
      </div>
      {s.status !== 'undetermined' && (
        <>
          <div className="scale" style={{ direction: 'ltr' }}>
            <span className="needle" style={{ left: `${pos}%` }} />
          </div>
          <div className="ends"><span className="gen">ثمري</span><span className="faint">متوازن</span><span className="veg">خضري</span></div>
        </>
      )}
    </section>
  );
}

function Stat({ k, u, v, p, sig, range }: { k: string; u?: string; v: number | null; p?: number | null; sig?: number | null; range?: [unknown, unknown] | null }) {
  const d = v != null && p != null ? round1(v - p) : null;
  return (
    <div className="stat" data-sig={sig ?? undefined}>
      <span className="k">{k}{u ? ` (${u})` : ''}</span>
      <span className="v num">{v ?? '—'}</span>
      {d != null && d !== 0 && <span className={`d ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '▲' : '▼'} <span className="num">{Math.abs(d)}</span> عن الأسبوع الماضي</span>}
      {range && (range[0] != null || range[1] != null) && (
        <span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>المستهدف <span className="num">{String(range[0] ?? '…')}–{String(range[1] ?? '…')}</span></span>
      )}
    </div>
  );
}
