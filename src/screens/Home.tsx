import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { cropAgeWeeks, formatDate, isoWeek, todayLocal } from '../lib/dates';
import { Icon } from '../components/Icon';
import { alive } from '../lib/repo';
import { phiByGreenhouse, pressureGrid } from '../lib/ipm';
import { SevChip } from './Scout';
import { useZones } from '../lib/zones';
import { ZoneBrowser } from '../components/ZoneBrowser';
import { WeatherStrip } from './Weather';

export const byCode = (a: { code: string }, b: { code: string }) =>
  a.code.localeCompare(b.code, 'en', { numeric: true });

/** الصوب + الدورة القائمة في كل صوبة + تقدم تسجيل الأسبوع الحالي */
export function useGreenhouseBoard(farmId: string | null) {
  return useLiveQuery(async () => {
    if (!farmId) return [];
    const today = todayLocal();
    const { year, week } = isoWeek(today);
    const [ghs, cycles, crops, varieties, sessions, acts, ags, aps, prods] = await Promise.all([
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
      db.crop_cycles.where('farm_id').equals(farmId).toArray(),
      db.crops.toArray(),
      db.varieties.toArray(),
      db.scouting_sessions.where('farm_id').equals(farmId).toArray(),
      db.activities.where('farm_id').equals(farmId).toArray(),
      db.activity_greenhouses.where('farm_id').equals(farmId).toArray(),
      db.activity_products.where('farm_id').equals(farmId).toArray(),
      db.products.toArray(),
    ]);
    const weekSessions = sessions.filter((x) => alive(x) && x.iso_year === year && x.iso_week === week);
    const weekObs = weekSessions.length ? await db.scouting_observations.where('session_id').anyOf(weekSessions.map((x) => x.id)).toArray() : [];
    const pressure = pressureGrid(weekSessions, weekObs);
    const phi = phiByGreenhouse(acts, ags, aps, prods, today);
    const cropName = new Map(crops.map((c) => [c.id, c.name_ar]));
    const varName = new Map(varieties.map((v) => [v.id, v.name]));
    const out = [];
    for (const g of ghs.filter(alive).sort(byCode)) {
      const cycle = cycles
        .filter((c) => alive(c) && c.greenhouse_id === g.id && c.status !== 'finished')
        .sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))[0];
      let plants = 0;
      let measured = 0;
      if (cycle) {
        plants = (await db.reference_plants.where('crop_cycle_id').equals(cycle.id).toArray()).filter(
          (p) => alive(p) && p.is_active,
        ).length;
        measured = (
          await db.plant_measurements.where('[crop_cycle_id+iso_year+iso_week]').equals([cycle.id, year, week]).toArray()
        ).filter(alive).length;
      }
      out.push({
        id: g.id,
        code: g.code,
        zone_id: g.zone_id,
        g,
        cycle,
        crop: cycle ? cropName.get(cycle.crop_id) : undefined,
        variety: cycle?.variety_id ? varName.get(cycle.variety_id) : undefined,
        plants,
        measured,
        pest: pressure.get(`${g.id}|${year * 100 + week}`),
        phi: phi.get(g.id),
      });
    }
    return out;
  }, [farmId]);
}

export function Home() {
  const { farmId, can } = useApp();
  const board = useGreenhouseBoard(farmId);
  const idx = useZones(farmId);
  const today = todayLocal();
  const { week } = isoWeek(today);
  const recs = useLiveQuery(async () => {
    if (!farmId) return 0;
    const [rs, acts] = await Promise.all([
      db.recommendations.where('farm_id').equals(farmId).toArray(),
      db.activities.where('farm_id').equals(farmId).toArray(),
    ]);
    const done = new Set(acts.filter((a) => alive(a) && a.recommendation_id).map((a) => a.recommendation_id));
    return rs.filter((r) => alive(r) && (r.status === 'open' || r.status === 'in_progress') && !done.has(r.id)).length;
  }, [farmId]);
  const scouted = board?.filter((x) => x.pest).length ?? 0;
  const blocked = board?.filter((x) => x.phi).length ?? 0;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>الأسبوع {week}</h1>
          <p>{formatDate(today)}</p>
        </div>
        <Link to="/dashboard" className="btn"><Icon name="chart" size={20} /> لوحة المتابعة</Link>
      </div>

      <WeatherStrip />

      <div className="actions">
        {can.record ? (
          <>
            <Link to="/register" className="action primary">
              <span className="ico"><Icon name="ruler" size={28} /></span>
              <b>تسجيل المحصول</b>
              <small>القياسات الأسبوعية للنباتات المرجعية</small>
            </Link>
            <Link to="/scout" className="action">
              <span className="ico"><Icon name="bug" size={28} /></span>
              <b>الفحص الحشري</b>
              <small>{board ? `فُحصت ${scouted} من ${board.length} صوبة هذا الأسبوع` : 'الآفات والأمراض والبؤر'}</small>
            </Link>
            <Link to="/activities" className="action">
              <span className="ico"><Icon name="spray" size={28} /></span>
              <b>المعاملات</b>
              <small>{blocked ? `${blocked} صوبة في فترة أمان` : 'الرش والحقن والإطلاق الحيوي والعمليات'}</small>
            </Link>
          </>
        ) : (
          <Link to="/dashboard" className="action primary">
            <span className="ico"><Icon name="chart" size={28} /></span>
            <b>لوحة المتابعة</b>
            <small>ضغط الآفات، توازن النبات، فترات الأمان</small>
          </Link>
        )}
        <Link to="/recs" className="action">
          <span className="ico"><Icon name="note" size={28} /></span>
          <b>التوصيات</b>
          <small>{recs ? `${recs} توصية مفتوحة` : 'لا توجد توصيات مفتوحة'}</small>
        </Link>
        <Link to="/files" className="action">
          <span className="ico"><Icon name="folder" size={28} /></span>
          <b>الملفات والتقارير</b>
          <small>تقارير الزيارات والتحاليل والبرامج</small>
        </Link>
        {!can.record && (
          <Link to="/activities" className="action">
            <span className="ico"><Icon name="spray" size={28} /></span>
            <b>سجل المعاملات</b>
            <small>{blocked ? `${blocked} صوبة في فترة أمان` : 'الرش والحقن والإطلاق الحيوي'}</small>
          </Link>
        )}
      </div>

      <h2 className="section-title">
        <span>الصوب</span>
        {can.manage && (
          <Link to="/setup" className="btn"><Icon name="layers" size={20} /> هيكل الموقع</Link>
        )}
      </h2>

      {board && board.length === 0 && (
        <div className="panel empty">
          <h3>لا توجد صوب بعد</h3>
          <p>{can.manage ? 'ابدأ بإضافة الصوب، ثم الدورة الزراعية والنباتات المرجعية لكل صوبة.' : 'سيظهر هنا ما يضيفه مدير المزرعة من صوب.'}</p>
          {can.manage && <Link to="/setup" className="btn primary"><Icon name="plus" /> أضف أول صوبة</Link>}
        </div>
      )}

      {board && idx && board.length > 0 && (
        <ZoneBrowser
          idx={idx}
          items={board}
          summary={(items) => {
            const active = items.filter((x) => x.cycle && x.plants > 0);
            const done = active.filter((x) => x.measured >= x.plants).length;
            const sc = items.filter((x) => x.pest).length;
            const ph = items.filter((x) => x.phi).length;
            return (
              <>
                {active.length > 0 && <span className={`chip ${done === active.length ? 'ok' : done ? 'warn' : 'bad'}`}>تسجيل {done}/{active.length}</span>}
                <span className={`chip ${sc === items.length ? 'ok' : sc ? 'warn' : ''}`}>فحص {sc}/{items.length}</span>
                {ph > 0 && <span className="chip bad"><Icon name="shield" size={14} /> {ph} فترة أمان</span>}
              </>
            );
          }}
          render={({ g, cycle, crop, variety, plants, measured, pest, phi }) => {
          let chip = <span className="chip">لا توجد دورة قائمة</span>;
          if (cycle && plants === 0) chip = <span className="chip warn">لم تُحدد نباتات مرجعية</span>;
          else if (cycle && measured >= plants) chip = <span className="chip ok"><Icon name="check" size={14} /> سُجّل هذا الأسبوع</span>;
          else if (cycle && measured > 0) chip = <span className="chip warn">{measured} من {plants} نبات</span>;
          else if (cycle) chip = <span className="chip bad">لم يُسجّل هذا الأسبوع</span>;
          const target = cycle && plants > 0 && can.record ? `/register/${cycle.id}` : can.manage ? `/setup/greenhouses/${g.id}` : cycle ? `/register/${cycle.id}/summary` : undefined;
          const body = (
            <>
              <span className="code">{g.code}</span>
              <span className="meta">
                <b>{cycle ? `${crop ?? ''}${variety ? ` — ${variety}` : ''}` : g.name || 'صوبة'}</b>
                <span>
                  {cycle
                    ? `الأسبوع ${cropAgeWeeks(cycle.planting_date) + 1} من الشتل، ${plants} نبات مرجعي`
                    : g.area_m2 ? `${g.area_m2} م²` : 'جاهزة لدورة جديدة'}
                </span>
              </span>
              <span className="gh-status">
                {chip}
                {pest && (pest.observations ? <SevChip v={pest.max} hotspot={pest.hotspots > 0} /> : <span className="chip ok">فحص: نظيفة</span>)}
                {phi && <span className="chip bad" title={phi.product}><Icon name="shield" size={14} /> فترة أمان</span>}
              </span>
            </>
          );
          return target ? (
            <Link key={g.id} to={target} className="gh">{body}</Link>
          ) : (
            <div key={g.id} className="gh">{body}</div>
          );
        }}
        />
      )}
    </main>
  );
}
