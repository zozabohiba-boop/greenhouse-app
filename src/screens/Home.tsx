import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { cropAgeWeeks, formatDate, isoWeek, todayLocal } from '../lib/dates';
import { Icon } from '../components/Icon';
import { alive } from '../lib/repo';

export const byCode = (a: { code: string }, b: { code: string }) =>
  a.code.localeCompare(b.code, 'en', { numeric: true });

/** الصوب + الدورة القائمة في كل صوبة + تقدم تسجيل الأسبوع الحالي */
export function useGreenhouseBoard(farmId: string | null) {
  return useLiveQuery(async () => {
    if (!farmId) return [];
    const today = todayLocal();
    const { year, week } = isoWeek(today);
    const [ghs, cycles, crops, varieties] = await Promise.all([
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
      db.crop_cycles.where('farm_id').equals(farmId).toArray(),
      db.crops.toArray(),
      db.varieties.toArray(),
    ]);
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
        g,
        cycle,
        crop: cycle ? cropName.get(cycle.crop_id) : undefined,
        variety: cycle?.variety_id ? varName.get(cycle.variety_id) : undefined,
        plants,
        measured,
      });
    }
    return out;
  }, [farmId]);
}

export function Home() {
  const { farmId, can } = useApp();
  const board = useGreenhouseBoard(farmId);
  const today = todayLocal();
  const { week } = isoWeek(today);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>الأسبوع {week}</h1>
          <p>{formatDate(today)}</p>
        </div>
      </div>

      <div className="actions">
        <Link to="/register" className="action primary" aria-disabled={!can.record}>
          <span className="ico"><Icon name="ruler" size={28} /></span>
          <b>تسجيل المحصول</b>
          <small>القياسات الأسبوعية للنباتات المرجعية</small>
        </Link>
        <div className="action" aria-disabled="true">
          <span className="ico"><Icon name="bug" size={28} /></span>
          <b>الفحص الحشري</b>
          <small>قريبًا — الآفات والأمراض والبؤر</small>
        </div>
        <div className="action" aria-disabled="true">
          <span className="ico"><Icon name="spray" size={28} /></span>
          <b>المعاملات</b>
          <small>قريبًا — الرش والحقن والإطلاق الحيوي</small>
        </div>
      </div>

      <h2 className="section-title">
        <span>الصوب</span>
        {can.manage && (
          <Link to="/setup" className="btn"><Icon name="settings" size={20} /> إدارة الصوب</Link>
        )}
      </h2>

      {board && board.length === 0 && (
        <div className="panel empty">
          <h3>لا توجد صوب بعد</h3>
          <p>{can.manage ? 'ابدأ بإضافة الصوب، ثم الدورة الزراعية والنباتات المرجعية لكل صوبة.' : 'سيظهر هنا ما يضيفه مدير المزرعة من صوب.'}</p>
          {can.manage && <Link to="/setup/greenhouses/new" className="btn primary"><Icon name="plus" /> أضف أول صوبة</Link>}
        </div>
      )}

      <div className="gh-list">
        {board?.map(({ g, cycle, crop, variety, plants, measured }) => {
          let chip = <span className="chip">لا توجد دورة قائمة</span>;
          if (cycle && plants === 0) chip = <span className="chip warn">لم تُحدد نباتات مرجعية</span>;
          else if (cycle && measured >= plants) chip = <span className="chip ok"><Icon name="check" size={14} /> سُجّل هذا الأسبوع</span>;
          else if (cycle && measured > 0) chip = <span className="chip warn">{measured} من {plants} نبات</span>;
          else if (cycle) chip = <span className="chip bad">لم يُسجّل هذا الأسبوع</span>;
          const target = cycle && plants > 0 && can.record ? `/register/${cycle.id}` : can.manage ? `/setup/greenhouses/${g.id}` : undefined;
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
              {chip}
            </>
          );
          return target ? (
            <Link key={g.id} to={target} className="gh">{body}</Link>
          ) : (
            <div key={g.id} className="gh">{body}</div>
          );
        })}
      </div>
    </main>
  );
}
