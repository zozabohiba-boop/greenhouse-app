// الطقس والمناخ الزراعي: توقعات 7 أيام للموقع + تأثيرها على النبات (النتح، الإجهاد، الأمراض، الري، أوقات الرش)
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { formatDate, todayLocal } from '../lib/dates';
import { useForecast } from '../lib/forecast';
import { analyzeDay, LEVEL_LABEL, nowIndex, vpd, type DayAnalysis, type Forecast } from '../lib/weather';
import { ghLabels, useZones } from '../lib/zones';
import { Icon } from '../components/Icon';

const WEEKDAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const weekday = (date: string) => WEEKDAY[new Date(`${date}T12:00:00Z`).getUTCDay()];
const fmt = (v: number | null | undefined, unit = '', digits = 0) => (v == null ? '—' : `${v.toFixed(digits)}${unit}`);

export function useFarmProfile(farmId: string | null) {
  return useLiveQuery(async () => (farmId ? (await db.farm_profiles.get(farmId)) ?? null : null), [farmId]);
}

export function profileCoords(p: { latitude: number | null; longitude: number | null } | null | undefined) {
  return p && p.latitude != null && p.longitude != null ? { lat: Number(p.latitude), lon: Number(p.longitude) } : null;
}

function timeOf(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${formatDate(iso.slice(0, 10))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── شريط الطقس في الرئيسية ─────────────────────────────────────────
export function WeatherStrip() {
  const { farmId, can } = useApp();
  const profile = useFarmProfile(farmId);
  const coords = profileCoords(profile);
  const w = useForecast(farmId, coords);
  if (profile === undefined) return null;
  if (!coords) {
    return can.manage ? (
      <Link to="/farm" className="wx-strip muted-strip">
        <Icon name="pin" size={22} />
        <span className="grow"><b>حدّد موقع المزرعة على الخريطة</b><small>لعرض توقعات الطقس وتأثيرها على النبات</small></span>
        <Icon name="chevron" size={20} />
      </Link>
    ) : null;
  }
  if (!w.forecast) {
    return <Link to="/weather" className="wx-strip muted-strip"><Icon name="sun" size={22} /><span className="grow"><b>الطقس</b><small>{w.loading ? 'جاري تحميل التوقعات…' : w.error ?? 'لا توجد توقعات محفوظة'}</small></span></Link>;
  }
  const today = analyzeDay(w.forecast, Math.max(0, w.forecast.daily.time.findIndex((d) => d >= todayLocal())), profile?.cover_transmission_pct ?? 70);
  const top = today.alerts[0];
  return (
    <Link to="/weather" className="wx-strip" data-level={today.level}>
      <span className="wx-temp"><b className="num">{fmt(today.tMax, '°')}</b><small className="num">{fmt(today.tMin, '°')}</small></span>
      <span className="grow">
        <b>{top ? top.title : 'طقس مناسب اليوم'}</b>
        <small>
          {[`رطوبة ${fmt(today.rhMin)}–${fmt(today.rhMax, '%')}`, today.water ? `ري تقديري ${today.water[0]}–${today.water[1]} ل/م²` : null,
            today.sprayWindows[0] ? `رش ${today.sprayWindows[0].from}–${today.sprayWindows[0].to}` : null].filter(Boolean).join('، ')}
        </small>
      </span>
      <span className={`chip ${today.level === 'bad' ? 'bad' : today.level === 'warn' ? 'warn' : today.level === 'info' ? 'info' : 'ok'}`}>{LEVEL_LABEL[today.level]}</span>
    </Link>
  );
}

// ── شاشة الطقس ───────────────────────────────────────────────────────
export function WeatherScreen() {
  const { farmId, farm, can } = useApp();
  const profile = useFarmProfile(farmId);
  const coords = profileCoords(profile);
  const w = useForecast(farmId, coords);
  const trans = profile?.cover_transmission_pct ?? 70;
  const days = useMemo(() => (w.forecast ? w.forecast.daily.time.map((_, i) => analyzeDay(w.forecast!, i, trans)) : []), [w.forecast, trans]);
  const todayStr = todayLocal();
  const first = Math.max(0, days.findIndex((d) => d.date >= todayStr));
  const [sel, setSel] = useState<number | null>(null);
  const di = sel ?? first;
  const day = days[di];

  if (profile === undefined) return null;
  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div>
          <h1>الطقس والمناخ الزراعي</h1>
          <p>{farm?.name}{w.fetchedAt ? ` — آخر تحديث ${timeOf(w.fetchedAt)}` : ''}</p>
        </div>
        {coords && <button className="btn" onClick={() => w.refresh()} disabled={w.loading}><Icon name="sync" size={20} /> {w.loading ? 'جاري التحديث…' : 'تحديث'}</button>}
      </div>

      {!coords ? (
        <div className="panel empty">
          <h3>موقع المزرعة غير محدد</h3>
          <p>التوقعات تحتاج إحداثيات الموقع (خط العرض والطول).</p>
          {can.manage ? <Link className="btn primary" to="/farm"><Icon name="pin" size={20} /> تحديد الموقع</Link> : <p className="muted">يحدده مدير المزرعة أو الاستشاري من بيانات الموقع.</p>}
        </div>
      ) : !w.forecast ? (
        <div className="panel empty"><h3>{w.loading ? 'جاري تحميل التوقعات…' : 'لا توجد توقعات'}</h3>{w.error && <p>{w.error}</p>}</div>
      ) : (
        <>
          {w.error && <p className="banner warn"><Icon name="alert" /> {w.error}</p>}
          <p className="banner info"><Icon name="info" /> التوقعات للطقس الخارجي حول الموقع. داخل الصوبة تختلف حسب التهوية والتظليل والتبريد — استخدمها لتوقع الإجهاد والتخطيط المسبق.</p>

          <NowPanel f={w.forecast} />

          <div className="day-tabs" role="tablist" aria-label="أيام التوقعات">
            {days.map((d, i) => (
              <button key={d.date} role="tab" aria-selected={i === di} data-level={d.level} onClick={() => setSel(i)}>
                <span>{d.date === todayStr ? 'اليوم' : weekday(d.date)}</span>
                <small className="num">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</small>
                <b className="num">{fmt(d.tMax, '°')}</b>
                <small className="num">{fmt(d.tMin, '°')}</small>
                <i className="lvl" aria-label={LEVEL_LABEL[d.level]} />
              </button>
            ))}
          </div>

          {day && <DayDetail f={w.forecast} d={day} trans={trans} isToday={day.date === todayStr} />}

          <h2 className="section-title">ملخص الأسبوع</h2>
          <div className="scroll-x panel">
            <table className="tbl wx-table">
              <thead>
                <tr>
                  <th>اليوم</th><th>الحرارة °م</th><th>الرطوبة %</th><th>VPD نهارًا kPa</th><th>هبات الرياح كم/س</th>
                  <th>الإشعاع MJ/م²</th><th>DLI داخل الصوبة</th><th>ET₀ مم</th><th>الري التقديري ل/م²</th><th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d, i) => (
                  <tr key={d.date} onClick={() => setSel(i)} className={i === di ? 'sel' : ''}>
                    <td>{weekday(d.date)} <small className="faint num">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</small></td>
                    <td><span className="num">{fmt(d.tMin)}–{fmt(d.tMax)}</span></td>
                    <td><span className="num">{fmt(d.rhMin)}–{fmt(d.rhMax)}</span></td>
                    <td><span className="num">{fmt(d.vpdDayMin, '', 1)}–{fmt(d.vpdDayMax, '', 1)}</span></td>
                    <td><span className="num">{fmt(d.gustMax)}</span></td>
                    <td><span className="num">{fmt(d.radMJ, '', 1)}</span></td>
                    <td><span className="num">{fmt(d.dliIn)}</span></td>
                    <td><span className="num">{fmt(d.et0, '', 1)}</span></td>
                    <td><span className="num">{d.water ? `${d.water[0]}–${d.water[1]}` : '—'}</span></td>
                    <td><span className={`chip ${d.level === 'bad' ? 'bad' : d.level === 'warn' ? 'warn' : d.level === 'info' ? 'info' : 'ok'}`}>{LEVEL_LABEL[d.level]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InsideReadings />

          <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 18 }}>
            بيانات الطقس: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a> (CC BY 4.0). الإحداثيات {coords.lat}، {coords.lon}.
            DLI = الإشعاع × 2.06 × نفاذية الغطاء ({trans}%). الري التقديري = 2–3 مل لكل جول/سم² داخل الصوبة لمحصول مكتمل النمو، ويُضبط بنسبة الصرف.
          </p>
        </>
      )}
    </main>
  );
}

function NowPanel({ f }: { f: Forecast }) {
  const i = nowIndex(f);
  if (i < 0) return null;
  const h = f.hourly;
  const t = h.temperature_2m[i];
  const rh = h.relative_humidity_2m[i];
  const v = h.vapour_pressure_deficit[i] ?? (t != null && rh != null ? vpd(t, rh) : null);
  return (
    <section className="panel panel-pad wx-now" aria-label="الطقس الآن">
      <div className="wx-big"><Icon name="thermo" size={30} /><b className="num">{fmt(t, '°')}</b><small>الآن</small></div>
      <dl className="wx-facts">
        <div><dt>الرطوبة</dt><dd className="num">{fmt(rh, '%')}</dd></div>
        <div><dt>VPD</dt><dd className="num">{fmt(v, ' kPa', 2)}</dd></div>
        <div><dt>نقطة الندى</dt><dd className="num">{fmt(h.dew_point_2m[i], '°')}</dd></div>
        <div><dt>الرياح</dt><dd className="num">{fmt(h.wind_speed_10m[i])} <small>(هبات {fmt(h.wind_gusts_10m[i])}) كم/س</small></dd></div>
        <div><dt>الإشعاع</dt><dd className="num">{fmt(h.shortwave_radiation[i], ' W/m²')}</dd></div>
        <div><dt>احتمال المطر</dt><dd className="num">{fmt(h.precipitation_probability[i], '%')}</dd></div>
      </dl>
    </section>
  );
}

function DayDetail({ f, d, trans, isToday }: { f: Forecast; d: DayAnalysis; trans: number; isToday: boolean }) {
  const idx = f.hourly.time.map((t, i) => (t.startsWith(d.date) ? i : -1)).filter((i) => i >= 0);
  const now = isToday ? nowIndex(f) : -1;
  const series = (arr: (number | null)[]) => idx.map((i) => arr[i]);
  const hours = idx.map((i) => Number(f.hourly.time[i].slice(11, 13)));
  const vpdArr = idx.map((i) => f.hourly.vapour_pressure_deficit[i] ?? (f.hourly.temperature_2m[i] != null && f.hourly.relative_humidity_2m[i] != null ? vpd(f.hourly.temperature_2m[i]!, f.hourly.relative_humidity_2m[i]!) : null));
  const nowPos = now >= 0 ? idx.indexOf(now) : -1;
  return (
    <section className="wx-day">
      <h2 className="section-title"><span>{isToday ? 'اليوم' : weekday(d.date)} — {formatDate(d.date)}</span></h2>
      {d.alerts.length ? (
        <div className="wx-alerts">
          {d.alerts.map((a) => (
            <div key={a.key} className="wx-alert" data-level={a.level}>
              <b><Icon name={a.level === 'info' ? 'info' : 'alert'} size={20} /> {a.title}</b>
              <p>{a.advice}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="banner ok"><Icon name="check" /> لا توجد مخاطر مناخية متوقعة على النبات في هذا اليوم.</p>
      )}

      <div className="wx-grid">
        <Stat k="الحرارة" v={`${fmt(d.tMin)}–${fmt(d.tMax)}`} unit="°م" sub={d.heatHours ? `${d.heatHours} ساعة فوق 35°` : undefined} />
        <Stat k="الرطوبة النسبية" v={`${fmt(d.rhMin)}–${fmt(d.rhMax)}`} unit="%" sub={d.humidHours ? `${d.humidHours} ساعة ≥ 90%` : undefined} />
        <Stat k="VPD نهارًا" v={`${fmt(d.vpdDayMin, '', 1)}–${fmt(d.vpdDayMax, '', 1)}`} unit="kPa" sub="المناسب 0.5–1.2" />
        <Stat k="الرياح" v={fmt(d.windMax)} unit="كم/س" sub={`هبات حتى ${fmt(d.gustMax)}`} />
        <Stat k="الإشعاع الشمسي" v={fmt(d.radMJ, '', 1)} unit="MJ/م²" sub={`DLI ${fmt(d.dliOut)} خارج / ${fmt(d.dliIn)} داخل`} />
        <Stat k="البخر نتح المرجعي ET₀" v={fmt(d.et0, '', 1)} unit="مم" />
        <Stat k="الاحتياج المائي التقديري" v={d.water ? `${d.water[0]}–${d.water[1]}` : '—'} unit={d.water ? 'ل/م²' : undefined} sub={`نفاذية الغطاء ${trans}%`} />
        <Stat k="المطر" v={fmt(d.rain, '', 1)} unit="مم" sub={d.rainProb != null ? `احتمال ${d.rainProb}%` : undefined} />
        <Stat k="أوقات مناسبة للرش" v={d.sprayWindows.length ? d.sprayWindows.map((x) => `${x.from}–${x.to}`).join(' ، ') : '—'} sub="حرارة ≤ 28°، رطوبة < 85%، بلا مطر" />
        {d.sunrise && <Stat k="الشروق / الغروب" v={`${d.sunrise} / ${d.sunset}`} sub={d.uv != null ? `مؤشر UV ${d.uv}` : undefined} />}
      </div>

      <div className="charts wx-charts">
        <HourChart title="الحرارة" unit="°م" hours={hours} ys={series(f.hourly.temperature_2m)} band={[18, 30]} bandLabel="المدى المناسب" now={nowPos} />
        <HourChart title="الرطوبة النسبية" unit="%" hours={hours} ys={series(f.hourly.relative_humidity_2m)} band={[60, 85]} bandLabel="المدى المناسب" now={nowPos} fixed={[0, 100]} />
        <HourChart title="عجز ضغط البخار VPD" unit="kPa" hours={hours} ys={vpdArr} band={[0.5, 1.2]} bandLabel="نتح مناسب" now={nowPos} digits={1} />
        <HourChart title="الإشعاع الشمسي" unit="W/m²" hours={hours} ys={series(f.hourly.shortwave_radiation)} now={nowPos} />
      </div>
    </section>
  );
}

function Stat({ k, v, unit, sub }: { k: string; v: string; unit?: string; sub?: string }) {
  return <div className="wx-stat"><span className="k">{k}</span><b><span className="num">{v}</span>{unit && <small className="u"> {unit}</small>}</b>{sub && <small>{sub}</small>}</div>;
}

function HourChart({ title, unit, hours, ys, band, bandLabel, now, fixed, digits = 0 }: {
  title: string; unit: string; hours: number[]; ys: (number | null)[]; band?: [number, number]; bandLabel?: string; now: number; fixed?: [number, number]; digits?: number;
}) {
  const W = 420, H = 180, L = 36, R = 12, T = 16, B = 24;
  const vals = ys.filter((y): y is number => y != null);
  if (!vals.length) return null;
  let lo = fixed ? fixed[0] : Math.min(...vals, ...(band ?? []));
  let hi = fixed ? fixed[1] : Math.max(...vals, ...(band ?? []));
  if (!fixed) { const pad = (hi - lo) * 0.1 || 1; lo = Math.max(lo < 0 ? lo - pad : 0, lo - pad); hi += pad; }
  const xAt = (i: number) => L + (i * (W - L - R)) / Math.max(1, ys.length - 1);
  const yAt = (y: number) => T + ((hi - y) * (H - T - B)) / (hi - lo || 1);
  const ticks = [lo, (lo + hi) / 2, hi].map((t) => Math.round(t * 10 ** digits) / 10 ** digits);
  const pts = ys.map((y, i) => (y == null ? null : `${xAt(i)},${yAt(y)}`)).filter(Boolean).join(' ');
  const peak = vals.indexOf(Math.max(...vals));
  const peakI = ys.findIndex((y) => y === vals[peak]);
  return (
    <figure className="chart">
      <figcaption>{title} <small>({unit})</small></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} على مدار اليوم: أعلى قيمة ${vals[peak].toFixed(digits)} ${unit} الساعة ${hours[peakI]}`}>
        {ticks.map((t) => (
          <g key={t}><line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} className="grid" /><text x={L - 6} y={yAt(t) + 4} className="ax" textAnchor="end">{t}</text></g>
        ))}
        {band && <rect x={L} width={W - L - R} y={yAt(Math.min(hi, band[1]))} height={Math.max(0, yAt(Math.max(lo, band[0])) - yAt(Math.min(hi, band[1])))} className="band" />}
        {band && bandLabel && <text x={W - R - 4} y={yAt(Math.min(hi, band[1])) + 12} className="ax band-l" textAnchor="end">{bandLabel}</text>}
        {now >= 0 && <line x1={xAt(now)} x2={xAt(now)} y1={T} y2={H - B} className="now" />}
        <polyline points={pts} className="ln" />
        {hours.map((h, i) => (h % 3 === 0 ? <text key={i} x={xAt(i)} y={H - 6} className="ax" textAnchor="middle">{h}</text> : null))}
        <text x={xAt(peakI)} y={yAt(vals[peak]) - 8} className="val" textAnchor="middle">{vals[peak].toFixed(digits)}</text>
      </svg>
    </figure>
  );
}

/** قراءات الحرارة والرطوبة داخل الصوب من جولات الفحص (آخر 3 أيام) */
function InsideReadings() {
  const { farmId } = useApp();
  const idx = useZones(farmId);
  const rows = useLiveQuery(async () => {
    const since = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    const [ss, ghs] = await Promise.all([
      db.scouting_sessions.where('farm_id').equals(farmId!).toArray(),
      db.greenhouses.where('farm_id').equals(farmId!).toArray(),
    ]);
    const live = ss.filter((s) => alive(s) && s.scouted_on >= since && s.air_temp_c != null && s.air_rh_pct != null)
      .sort((a, b) => (a.scouted_on < b.scouted_on ? 1 : -1));
    const latest = new Map<string, typeof live[number]>();
    for (const s of live) if (!latest.has(s.greenhouse_id)) latest.set(s.greenhouse_id, s);
    return { latest: [...latest.values()], ghs: ghs.filter(alive) };
  }, [farmId]);
  if (!rows?.latest.length || !idx) return null;
  const labels = ghLabels(idx, rows.ghs);
  return (
    <>
      <h2 className="section-title">قراءات داخل الصوب (من جولات الفحص)</h2>
      <div className="scroll-x panel">
        <table className="tbl">
          <thead><tr><th>الصوبة</th><th>التاريخ</th><th>الحرارة °م</th><th>الرطوبة %</th><th>VPD kPa</th></tr></thead>
          <tbody>
            {rows.latest.map((s) => {
              const v = vpd(Number(s.air_temp_c), Number(s.air_rh_pct));
              return (
                <tr key={s.id}>
                  <td><span className="num">{labels.get(s.greenhouse_id)}</span></td>
                  <td>{formatDate(s.scouted_on)}</td>
                  <td><span className="num">{s.air_temp_c}</span></td>
                  <td><span className="num">{s.air_rh_pct}</span></td>
                  <td><span className={`chip ${v < 0.3 || v > 1.8 ? 'bad' : v < 0.5 || v > 1.2 ? 'warn' : 'ok'}`}>{v.toFixed(2)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
