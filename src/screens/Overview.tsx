// اللوحة العامة للمزرعة — للقراءة فقط. يشوفها كل أعضاء المشروع (حتى المهندس المتخصص)
// كأرقام مجمّعة، من غير تفاصيل سجلات المجالات الأخرى ومن غير أي تعديل.
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { useOverview, type OverviewGh } from '../lib/overview';
import { DOMAIN_LABEL, FIELD_DOMAINS } from '../lib/access';
import { BALANCE_LABEL, type BalanceStatus } from '../lib/balance';
import { formatDate, isoWeek, todayLocal, weekSpan } from '../lib/dates';
import { useZones } from '../lib/zones';
import { ZoneBrowser } from '../components/ZoneBrowser';
import { Icon } from '../components/Icon';
import { SevChip } from './Scout';
import { byCode } from './Home';

export function OverviewScreen() {
  const { farmId, farm } = useApp();
  const { data, loading, error, refresh } = useOverview(farmId);
  const idx = useZones(farmId);
  const ghs = useLiveQuery(async () => {
    if (!farmId) return [];
    const [list, cycles, crops] = await Promise.all([
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
      db.crop_cycles.where('farm_id').equals(farmId).toArray(),
      db.crops.toArray(),
    ]);
    const cropName = new Map(crops.map((c) => [c.id, c.name_ar]));
    return list.filter(alive).sort(byCode).map((g) => {
      const c = cycles.filter((x) => alive(x) && x.greenhouse_id === g.id && x.status !== 'finished')[0];
      return { id: g.id, code: g.code, zone_id: g.zone_id, g, crop: c ? cropName.get(c.crop_id) : undefined };
    });
  }, [farmId]);
  const today = todayLocal();
  const { week } = isoWeek(today);
  const byId = new Map((data?.greenhouses ?? []).map((x) => [x.id, x]));
  const t = data?.totals;

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div>
          <h1>لوحة المزرعة العامة</h1>
          <p>{farm?.name} — الأسبوع {week}، {weekSpan(today)}. للمتابعة فقط.</p>
        </div>
        <button className="btn" onClick={() => void refresh()} disabled={loading}><Icon name="sync" size={20} /> {loading ? 'جاري التحديث…' : 'تحديث'}</button>
      </div>
      <div className="banner info readonly-note"><Icon name="eye" /> لوحة عامة بأرقام مجمّعة لكل المزرعة، من غير تعديل. التفاصيل الكاملة عند المسؤول عن كل مجال.</div>
      {error && <div className="banner warn">{error}{data ? ' — المعروض آخر نسخة محفوظة.' : ''}</div>}
      {!data && !loading && <div className="panel empty"><h3>اللوحة العامة تحتاج اتصال بالإنترنت أول مرة</h3><p>اتصل بالشبكة وهتتحمّل تلقائيًا وتفضل محفوظة على الجهاز.</p></div>}
      {data && t && (
        <>
          <p className="faint" style={{ marginBottom: 12 }}>آخر تحديث: {new Date(data.generated_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <div className="kpis">
            <div className="kpi"><span className="k">الصوب</span><b className="num">{t.greenhouses}</b><small>{t.active_cycles} دورة قائمة</small></div>
            <div className="kpi" data-tone={t.scouted >= t.greenhouses ? undefined : 'warn'}><span className="k">فحص هذا الأسبوع</span><b className="num">{t.scouted}/{t.greenhouses}</b><small>{t.worst ? <>أعلى شدة <SevChip v={t.worst} /></> : 'لا إصابات مسجلة'}</small></div>
            <div className="kpi" data-tone={t.registered >= t.active_cycles ? undefined : 'warn'}><span className="k">تسجيل المحصول</span><b className="num">{t.registered}/{t.active_cycles}</b><small>دورة سُجّلت هذا الأسبوع</small></div>
            <div className="kpi" data-tone={t.in_phi ? 'bad' : undefined}><span className="k">فترة أمان</span><b className="num">{t.in_phi}</b><small>صوبة ممنوع حصادها اليوم</small></div>
          </div>
          <div className="ov-row">
            <section className="panel ov-block">
              <h2 className="section-title"><span>معاملات هذا الأسبوع</span></h2>
              <ul className="ov-list">
                {FIELD_DOMAINS.map((d) => <li key={d}><span>{DOMAIN_LABEL[d]}</span><b className="num">{t.activities_week[d] ?? 0}</b></li>)}
              </ul>
            </section>
            <section className="panel ov-block">
              <h2 className="section-title"><span>توصيات مفتوحة</span></h2>
              <ul className="ov-list">
                {(['general', ...FIELD_DOMAINS] as const).map((d) => <li key={d}><span>{DOMAIN_LABEL[d]}</span><b className="num">{t.open_recs[d] ?? 0}</b></li>)}
              </ul>
            </section>
            <section className="panel ov-block">
              <h2 className="section-title"><span>أكثر الآفات انتشارًا</span></h2>
              {data.top_pests.length ? (
                <ul className="ov-list">
                  {data.top_pests.map((p) => <li key={p.name}><span>{p.name}</span><span className="row" style={{ gap: 6 }}><SevChip v={p.worst} /><span className="faint num">{p.greenhouses} صوبة</span></span></li>)}
                </ul>
              ) : <p className="muted">لا توجد إصابات مسجلة هذا الأسبوع.</p>}
            </section>
          </div>
          {ghs && idx && ghs.length > 0 && (
            <>
              <h2 className="section-title"><span>حالة الصوب</span></h2>
              <ZoneBrowser idx={idx} items={ghs}
                summary={(items) => {
                  const rows = items.map((x) => byId.get(x.id)).filter(Boolean) as OverviewGh[];
                  const sc = rows.filter((x) => x.scouted).length;
                  const ph = rows.filter((x) => x.harvest_allowed_from).length;
                  return (<>
                    <span className={`chip ${sc === items.length ? 'ok' : sc ? 'warn' : ''}`}>فحص {sc}/{items.length}</span>
                    {ph > 0 && <span className="chip bad"><Icon name="shield" size={14} /> {ph} فترة أمان</span>}
                  </>);
                }}
                render={({ g, crop }) => {
                  const o = byId.get(g.id);
                  return (
                    <div key={g.id} className="gh">
                      <span className="code">{g.code}</span>
                      <span className="meta"><b>{crop ?? g.name ?? 'صوبة'}</b>
                        <span>{o?.last && Object.keys(o.last).length ? `آخر معاملة ${formatDate(Object.values(o.last).sort().pop()!)}` : 'لا معاملات مسجلة'}</span></span>
                      <span className="gh-status">
                        {o?.has_cycle && <span className={`chip ${o.registered ? 'ok' : 'warn'}`}>{o.registered ? 'سُجّل المحصول' : 'لم يُسجّل المحصول'}</span>}
                        {o && (o.scouted ? (o.worst ? <SevChip v={o.worst} /> : <span className="chip ok">فحص: نظيفة</span>) : <span className="chip">لم تُفحص</span>)}
                        {o?.balance && <span className="chip info">{BALANCE_LABEL[o.balance as BalanceStatus] ?? o.balance}</span>}
                        {o?.harvest_allowed_from && <span className="chip bad"><Icon name="shield" size={14} /> حتى {formatDate(o.harvest_allowed_from)}</span>}
                        {o && o.open_recs > 0 && <span className="chip warn">{o.open_recs} توصية</span>}
                      </span>
                    </div>
                  );
                }} />
            </>
          )}
        </>
      )}
    </main>
  );
}
