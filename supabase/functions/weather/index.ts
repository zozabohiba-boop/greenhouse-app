// Edge Function: weather
// توقعات الطقس لموقع (7 أيام بالساعة) من Open-Meteo مع ذاكرة ساعة لكل موقع في weather_cache.
// - العضو فقط يقدر يطلب توقعات موقعه (التحقق عبر RLS بهويته على farm_profiles)
// - الإحداثيات تُقرأ من بيانات الموقع على السيرفر (لا تُرسل من الجهاز)
// - لو OPEN_METEO_API_KEY موجود يُستخدم خادم الاشتراك التجاري customer-api.open-meteo.com
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const HOURLY = [
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'vapour_pressure_deficit',
  'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m', 'shortwave_radiation',
  'precipitation', 'precipitation_probability', 'cloud_cover', 'et0_fao_evapotranspiration',
].join(',');
const DAILY = [
  'temperature_2m_max', 'temperature_2m_min', 'relative_humidity_2m_max', 'relative_humidity_2m_min',
  'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max',
  'wind_direction_10m_dominant', 'shortwave_radiation_sum', 'et0_fao_evapotranspiration', 'uv_index_max',
  'sunrise', 'sunset',
].join(',');

const FRESH_MS = 60 * 60 * 1000;
const FORCE_MIN_MS = 10 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: me, error: meErr } = await userClient.auth.getUser();
  if (meErr || !me.user) return json({ error: 'unauthorized' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const farmId = String(body.farm_id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(farmId)) return json({ error: 'bad_farm' }, 400);

  // عضوية + إحداثيات الموقع (RLS يرجّع الصف للأعضاء فقط)
  const { data: prof, error: pErr } = await userClient
    .from('farm_profiles').select('latitude, longitude').eq('id', farmId).maybeSingle();
  if (pErr) return json({ error: 'forbidden' }, 403);
  if (!prof || prof.latitude == null || prof.longitude == null) {
    const { data: member } = await userClient.from('farm_members').select('role').eq('farm_id', farmId).eq('user_id', me.user.id).maybeSingle();
    return member ? json({ error: 'no_location' }, 400) : json({ error: 'forbidden' }, 403);
  }
  const lat = Number(prof.latitude);
  const lon = Number(prof.longitude);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: cache } = await admin.from('weather_cache').select('*').eq('farm_id', farmId).maybeSingle();
  const age = cache ? Date.now() - Date.parse(cache.fetched_at) : Infinity;
  const sameSpot = cache && Math.abs(Number(cache.latitude) - lat) < 1e-4 && Math.abs(Number(cache.longitude) - lon) < 1e-4;
  const force = body.force === true;
  if (cache && sameSpot && (age < FORCE_MIN_MS || (!force && age < FRESH_MS))) {
    return json({ fetched_at: cache.fetched_at, payload: cache.payload, cached: true });
  }

  const key = Deno.env.get('OPEN_METEO_API_KEY');
  const host = key ? 'https://customer-api.open-meteo.com' : 'https://api.open-meteo.com';
  const q = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), hourly: HOURLY, daily: DAILY,
    timezone: 'auto', forecast_days: '7', wind_speed_unit: 'kmh',
  });
  if (key) q.set('apikey', key);

  try {
    const r = await fetch(`${host}/v1/forecast?${q}`, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const payload = await r.json();
    const fetched_at = new Date().toISOString();
    await admin.from('weather_cache').upsert({ farm_id: farmId, latitude: lat, longitude: lon, fetched_at, payload });
    return json({ fetched_at, payload, cached: false });
  } catch (e) {
    if (cache && sameSpot) return json({ fetched_at: cache.fetched_at, payload: cache.payload, cached: true, stale: true });
    return json({ error: 'upstream', detail: String((e as Error).message ?? e) }, 502);
  }
});
