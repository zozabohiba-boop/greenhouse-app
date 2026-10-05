// الطقس والمناخ الزراعي: تحليل توقعات الطقس الخارجي وتأثيرها على نباتات الصوب.
// المصدر: Open-Meteo (عبر دالة weather على السيرفر مع ذاكرة ساعة لكل موقع).
// كل الحسابات هنا دوال خالصة قابلة للاختبار — الحدود الزراعية للخضر الثمرية (طماطم، خيار، فلفل).

type N = number | null;

export interface Forecast {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  utc_offset_seconds?: number;
  hourly: {
    time: string[];
    temperature_2m: N[];
    relative_humidity_2m: N[];
    dew_point_2m: N[];
    vapour_pressure_deficit: N[];
    wind_speed_10m: N[];
    wind_gusts_10m: N[];
    shortwave_radiation: N[];
    precipitation: N[];
    precipitation_probability: N[];
    cloud_cover?: N[];
    et0_fao_evapotranspiration?: N[];
  };
  daily: {
    time: string[];
    temperature_2m_max: N[];
    temperature_2m_min: N[];
    relative_humidity_2m_max?: N[];
    relative_humidity_2m_min?: N[];
    precipitation_sum: N[];
    precipitation_probability_max: N[];
    wind_speed_10m_max: N[];
    wind_gusts_10m_max: N[];
    wind_direction_10m_dominant?: N[];
    shortwave_radiation_sum: N[];
    et0_fao_evapotranspiration: N[];
    uv_index_max?: N[];
    sunrise?: string[];
    sunset?: string[];
  };
}

// ── الفيزياء ────────────────────────────────────────────────────────
/** ضغط بخار التشبع (kPa) — معادلة Tetens كما في FAO-56 */
export const svp = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));

/** عجز ضغط البخار VPD (kPa) من الحرارة والرطوبة النسبية */
export function vpd(t: number, rh: number): number {
  return Math.round(svp(t) * (1 - Math.min(100, Math.max(0, rh)) / 100) * 100) / 100;
}

/** الإشعاع اليومي (MJ/m²) ← التكامل الضوئي اليومي DLI (mol/m²/يوم): PAR ≈ 45% × 4.57 */
export const dli = (mj: number) => Math.round(mj * 2.06 * 10) / 10;

/**
 * تقدير الاحتياج المائي اليومي لمحصول مكتمل داخل الصوبة (لتر/م²):
 * قاعدة عملية 2–3 مل ماء لكل جول/سم² إشعاع داخل الصوبة.
 */
export function waterNeed(mj: number, transmissionPct: number): [number, number] {
  const jcm2 = mj * 100 * (transmissionPct / 100);
  const r = (x: number) => Math.round(x * 10) / 10;
  return [r((jcm2 * 2) / 1000), r((jcm2 * 3) / 1000)];
}

export type Level = 'bad' | 'warn' | 'info' | 'ok';
export interface Alert {
  level: Exclude<Level, 'ok'>;
  key: string;
  title: string;
  advice: string;
}

export interface DayAnalysis {
  date: string;
  tMax: N; tMin: N;
  rhMax: N; rhMin: N;
  rain: N; rainProb: N;
  windMax: N; gustMax: N;
  radMJ: N; et0: N; uv: N;
  sunrise?: string; sunset?: string;
  /** أعلى VPD نهارًا وأقله نهارًا (kPa) */
  vpdDayMax: N; vpdDayMin: N;
  /** ساعات رطوبة ≥ 90% */
  humidHours: number;
  /** أقل فرق بين الحرارة ونقطة الندى ليلًا (°م) */
  dewMarginNight: N;
  /** ساعات حرارة ≥ 35 */
  heatHours: number;
  dliOut: N; dliIn: N;
  water: [number, number] | null;
  sprayWindows: { from: string; to: string }[];
  alerts: Alert[];
  level: Level;
}

const hourOf = (iso: string) => Number(iso.slice(11, 13));
const max = (xs: N[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.max(...v) : null; };
const min = (xs: N[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.min(...v) : null; };
const r1 = (x: N) => (x == null ? null : Math.round(x * 10) / 10);

const RANK: Record<Level, number> = { ok: 0, info: 1, warn: 2, bad: 3 };

/** أوقات مناسبة للرش داخل الصوب حسب الطقس الخارجي: صباحًا أو عصرًا، حرارة ≤ 28، رطوبة < 85%، بلا مطر، رياح هادئة */
function sprayWindows(h: Forecast['hourly'], idx: number[]): { from: string; to: string }[] {
  const good = idx.filter((i) => {
    const hr = hourOf(h.time[i]);
    const t = h.temperature_2m[i];
    const rh = h.relative_humidity_2m[i];
    return ((hr >= 6 && hr <= 10) || (hr >= 15 && hr <= 17))
      && t != null && t >= 10 && t <= 28
      && rh != null && rh < 85
      && (h.precipitation[i] ?? 0) === 0 && (h.precipitation_probability[i] ?? 0) < 40
      && (h.wind_speed_10m[i] ?? 0) < 20;
  });
  const out: { from: string; to: string }[] = [];
  let start = -1;
  let prev = -2;
  const flush = () => {
    if (start >= 0 && hourOf(h.time[prev]) - hourOf(h.time[start]) >= 1) {
      out.push({ from: h.time[start].slice(11, 16), to: `${String(hourOf(h.time[prev]) + 1).padStart(2, '0')}:00` });
    }
  };
  for (const i of good) {
    if (i !== prev + 1) { flush(); start = i; }
    prev = i;
  }
  flush();
  return out;
}

export function analyzeDay(f: Forecast, d: number, transmissionPct = 70): DayAnalysis {
  const dd = f.daily;
  const date = dd.time[d];
  const h = f.hourly;
  const idx = h.time.map((t, i) => (t.startsWith(date) ? i : -1)).filter((i) => i >= 0);
  const day = idx.filter((i) => (h.shortwave_radiation[i] ?? 0) > 50);
  const night = idx.filter((i) => (h.shortwave_radiation[i] ?? 0) <= 5);
  const vpdAt = (i: number) => h.vapour_pressure_deficit[i]
    ?? (h.temperature_2m[i] != null && h.relative_humidity_2m[i] != null ? vpd(h.temperature_2m[i]!, h.relative_humidity_2m[i]!) : null);

  const tMax = dd.temperature_2m_max[d] ?? max(idx.map((i) => h.temperature_2m[i]));
  const tMin = dd.temperature_2m_min[d] ?? min(idx.map((i) => h.temperature_2m[i]));
  const rhMax = dd.relative_humidity_2m_max?.[d] ?? max(idx.map((i) => h.relative_humidity_2m[i]));
  const rhMin = dd.relative_humidity_2m_min?.[d] ?? min(idx.map((i) => h.relative_humidity_2m[i]));
  const vpdDayMax = r1(max(day.map(vpdAt)));
  const vpdDayMin = r1(min(day.map(vpdAt)));
  const humidHours = idx.filter((i) => (h.relative_humidity_2m[i] ?? 0) >= 90).length;
  const heatHours = idx.filter((i) => (h.temperature_2m[i] ?? -99) >= 35).length;
  const dewMarginNight = r1(min(night.map((i) => (h.temperature_2m[i] != null && h.dew_point_2m[i] != null ? h.temperature_2m[i]! - h.dew_point_2m[i]! : null))));
  const gustMax = dd.wind_gusts_10m_max[d] ?? max(idx.map((i) => h.wind_gusts_10m[i]));
  const windMax = dd.wind_speed_10m_max[d] ?? max(idx.map((i) => h.wind_speed_10m[i]));
  const rain = dd.precipitation_sum[d];
  const rainProb = dd.precipitation_probability_max[d];
  const radMJ = dd.shortwave_radiation_sum[d];

  const alerts: Alert[] = [];
  const add = (level: Alert['level'], key: string, title: string, advice: string) => alerts.push({ level, key, title, advice });

  if (tMax != null && tMax >= 38) add('bad', 'heat', `إجهاد حراري شديد (${Math.round(tMax)}°)`, 'تظليل وتشغيل التبريد/التضبيب مبكرًا، ري صباحي قبل الذروة، وتجنب الرش والعمليات وقت الظهيرة.');
  else if (tMax != null && tMax >= 32) add('warn', 'heat', `حرارة مرتفعة (${Math.round(tMax)}°)`, 'الحرارة فوق 32° تضعف حيوية حبوب اللقاح والعقد — زِد التهوية والتبريد وتابع العقد في العناقيد الجديدة.');
  if (tMin != null && tMin <= 2) add('bad', 'frost', `خطر صقيع (${Math.round(tMin)}°)`, 'أغلق الصوب مبكرًا، جهّز التدفئة أو الغطاء المزدوج، ولا تروِ مساءً.');
  else if (tMin != null && tMin < 12) add('warn', 'cold', `ليل بارد (${Math.round(tMin)}°)`, 'أقل من 12° ليلًا يبطئ النمو ويضعف العقد — أغلق فتحات التهوية قبل الغروب.');
  if (humidHours >= 6) add('warn', 'humid', `رطوبة ≥ 90% لمدة ${humidHours} ساعة`, 'خطر الأمراض الفطرية (البوتريتس، البياض الزغبي) — تهوية صباحية، تجنب الري المسائي، وكثّف الفحص.');
  if (dewMarginNight != null && dewMarginNight < 1.5) add('warn', 'dew', 'خطر تكثف الندى ليلًا', 'الحرارة تقترب من نقطة الندى — تهوية خفيفة مع تدفئة إن أمكن لتجنب ابتلال الأوراق.');
  if (vpdDayMax != null && vpdDayMax > 2.2) add('bad', 'vpd-high', `نتح مرتفع جدًا (VPD ${vpdDayMax} kPa)`, 'النبات يغلق الثغور ويتعرض لإجهاد مائي وخطر تعفن الطرف الزهري — ارفع الرطوبة بالتضبيب أو المبرد، ظلّل، وقسّم الري على ريات أكثر.');
  else if (vpdDayMax != null && vpdDayMax > 1.5) add('warn', 'vpd-high', `نتح مرتفع (VPD ${vpdDayMax} kPa)`, 'زِد عدد الريات بكميات أقل، وارفع الرطوبة وقت الظهيرة.');
  if (vpdDayMax != null && vpdDayMax < 0.4) add('warn', 'vpd-low', `نتح ضعيف نهارًا (VPD ${vpdDayMax} kPa)`, 'ضعف حركة الماء والكالسيوم للأوراق الحديثة وزيادة خطر الأمراض — تهوية مع تدفئة خفيفة إن أمكن.');
  if (gustMax != null && gustMax >= 60) add('bad', 'wind', `رياح قوية (هبات ${Math.round(gustMax)} كم/س)`, 'خطر على الغطاء والهيكل — أغلق الفتحات والأبواب وثبّت البلاستيك.');
  else if (gustMax != null && gustMax >= 40) add('warn', 'wind', `رياح نشطة (هبات ${Math.round(gustMax)} كم/س)`, 'قلّل فتح التهوية من جهة الريح وراجع تثبيت الغطاء.');
  if ((rain ?? 0) >= 5 || (rainProb ?? 0) >= 70) add('info', 'rain', `أمطار متوقعة${rain ? ` (${r1(rain)} مم)` : ''}`, 'أجّل الرش الخارجي، وراجع الصرف وسلامة الغطاء.');

  const level = alerts.reduce<Level>((a, x) => (RANK[x.level] > RANK[a] ? x.level : a), 'ok');
  const dliOut = radMJ != null ? dli(radMJ) : null;
  return {
    date, tMax: r1(tMax), tMin: r1(tMin), rhMax, rhMin, rain: r1(rain), rainProb, windMax: r1(windMax), gustMax: r1(gustMax),
    radMJ: r1(radMJ), et0: r1(dd.et0_fao_evapotranspiration[d]), uv: r1(dd.uv_index_max?.[d] ?? null),
    sunrise: dd.sunrise?.[d]?.slice(11, 16), sunset: dd.sunset?.[d]?.slice(11, 16),
    vpdDayMax, vpdDayMin, humidHours, dewMarginNight, heatHours,
    dliOut, dliIn: dliOut != null ? r1((dliOut * transmissionPct) / 100) : null,
    water: radMJ != null ? waterNeed(radMJ, transmissionPct) : null,
    sprayWindows: sprayWindows(h, idx),
    alerts: alerts.sort((a, b) => RANK[b.level] - RANK[a.level]),
    level,
  };
}

/** فهرس الساعة الحالية في توقيت الموقع */
export function nowIndex(f: Forecast, now = Date.now()): number {
  if (!f.hourly.time.length) return -1;
  const off = (f.utc_offset_seconds ?? 0) * 1000;
  const t0 = Date.parse(`${f.hourly.time[0]}:00Z`);
  const i = Math.floor((now + off - t0) / 3_600_000);
  return i >= 0 && i < f.hourly.time.length ? i : -1;
}

/** قراءة إحداثيات من نص: "30.04, 31.23" أو رابط خرائط جوجل */
export function parseCoords(text: string): { lat: number; lon: number } | null {
  const s = text.trim();
  const m = /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(s)
    ?? /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(s)
    ?? /^(-?\d+(?:\.\d+)?)\s*[,،\s]\s*(-?\d+(?:\.\d+)?)$/.exec(s);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
}

export const LEVEL_LABEL: Record<Level, string> = { ok: 'مناسب', info: 'تنبيه', warn: 'انتباه', bad: 'خطر' };

