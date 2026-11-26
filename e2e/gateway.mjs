// بوابة تحاكي Supabase: /auth/v1 (مصادقة وهمية بتوقيع JWT حقيقي) و /rest/v1 → PostgREST
import http from 'node:http';
import crypto from 'node:crypto';

export const JWT_SECRET = 'e2e-super-secret-jwt-token-with-at-least-32-chars';
const USERS = {
  'admin@test.local': { id: 'aaaaaaaa-0000-0000-0000-000000000001', password: 'Admin#2026', meta: {} },
  'scout@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000002', password: 'Scout#2026', meta: {} },
  'ops@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000003', password: 'Ops#2026x', meta: {} },
  'irr@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000004', password: 'Irr#2026x', meta: {} },
  'manager@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000005', password: 'Manager#2026', meta: {} },
  'store@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000006', password: 'Store#2026', meta: {} },
};
export const TEST_USERS = USERS;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function sign(payload) {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const p = b64(payload);
  const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
export const ANON_KEY = sign({ role: 'anon', iss: 'e2e', iat: 1700000000, exp: 2100000000 });
const SERVICE_KEY = sign({ role: 'service_role', iss: 'e2e', iat: 1700000000, exp: 2100000000 });
function decode(t) {
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); } catch { return null; }
}
function userObj(email) {
  const u = USERS[email];
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email, app_metadata: { provider: 'email' }, user_metadata: { ...(u.meta || {}) }, created_at: '2026-01-01T00:00:00Z' };
}
function session(email, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const u = USERS[email];
  return {
    access_token: sign({ sub: u.id, email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + ttl }),
    token_type: 'bearer', expires_in: ttl, expires_at: now + ttl,
    refresh_token: `rt-${Buffer.from(email).toString('base64url')}-${now}`,
    user: userObj(email),
  };
}

/** توقعات طقس ثابتة للاختبار: اليوم حار جاف (إجهاد حراري)، بعد غد رطوبة ليلية عالية */
export function fakeForecast(lat, lon, now = Date.now()) {
  const off = 3 * 3600;
  const local = new Date(now + off * 1000);
  const day0 = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const hourly = { time: [], temperature_2m: [], relative_humidity_2m: [], dew_point_2m: [], vapour_pressure_deficit: [], wind_speed_10m: [], wind_gusts_10m: [], wind_direction_10m: [], shortwave_radiation: [], precipitation: [], precipitation_probability: [], cloud_cover: [], et0_fao_evapotranspiration: [] };
  const daily = { time: [], temperature_2m_max: [], temperature_2m_min: [], relative_humidity_2m_max: [], relative_humidity_2m_min: [], precipitation_sum: [], precipitation_probability_max: [], wind_speed_10m_max: [], wind_gusts_10m_max: [], wind_direction_10m_dominant: [], shortwave_radiation_sum: [], et0_fao_evapotranspiration: [], uv_index_max: [], sunrise: [], sunset: [] };
  const svp = (t) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
  for (let d = 0; d < 7; d++) {
    const date = new Date(day0 + d * 86400000).toISOString().slice(0, 10);
    const hot = d === 0;
    const humid = d === 2;
    const tLo = hot ? 24 : 16, tHi = hot ? 39 : 27;
    const ts = [], rhs = [];
    for (let h = 0; h < 24; h++) {
      const sun = Math.max(0, Math.sin(((h - 6) / 13) * Math.PI));
      const t = tLo + (tHi - tLo) * sun;
      const rh = humid ? (sun > 0.1 ? 70 : 96) : hot ? 70 - 55 * sun : 75 - 20 * sun;
      ts.push(t); rhs.push(rh);
      hourly.time.push(`${date}T${String(h).padStart(2, '0')}:00`);
      hourly.temperature_2m.push(Math.round(t * 10) / 10);
      hourly.relative_humidity_2m.push(Math.round(rh));
      hourly.dew_point_2m.push(Math.round((humid && sun <= 0.1 ? t - 0.5 : t - 9) * 10) / 10);
      hourly.vapour_pressure_deficit.push(Math.round(svp(t) * (1 - rh / 100) * 100) / 100);
      hourly.wind_speed_10m.push(9); hourly.wind_gusts_10m.push(22); hourly.wind_direction_10m.push(320);
      hourly.shortwave_radiation.push(Math.round(900 * sun));
      hourly.precipitation.push(0); hourly.precipitation_probability.push(5); hourly.cloud_cover.push(10);
      hourly.et0_fao_evapotranspiration.push(Math.round(0.6 * sun * 100) / 100);
    }
    daily.time.push(date);
    daily.temperature_2m_max.push(tHi); daily.temperature_2m_min.push(tLo);
    daily.relative_humidity_2m_max.push(Math.round(Math.max(...rhs))); daily.relative_humidity_2m_min.push(Math.round(Math.min(...rhs)));
    daily.precipitation_sum.push(0); daily.precipitation_probability_max.push(5);
    daily.wind_speed_10m_max.push(12); daily.wind_gusts_10m_max.push(24); daily.wind_direction_10m_dominant.push(320);
    daily.shortwave_radiation_sum.push(hot ? 28 : 22); daily.et0_fao_evapotranspiration.push(hot ? 7.2 : 5.1); daily.uv_index_max.push(9);
    daily.sunrise.push(`${date}T06:05`); daily.sunset.push(`${date}T17:40`);
  }
  return { latitude: lat, longitude: lon, elevation: 30, timezone: 'Africa/Cairo', utc_offset_seconds: off, hourly, daily };
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range, content-profile, x-total-count',
};
function send(res, status, body) {
  res.writeHead(status, { ...cors, 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const readBody = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)); });

export function startGateway({ port = 54321, rest = 'http://127.0.0.1:3001' } = {}) {
  const stats = { rest: 0, auth: 0, storage: 0, weather: 0, objects: () => objects.size, keys: () => [...objects.keys()] };
  const objects = new Map();
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/auth/v1/')) {
      stats.auth++;
      const path = url.pathname.slice(9);
      const body = await readBody(req);
      if (path === 'token') {
        const j = body ? JSON.parse(body) : {};
        if (url.searchParams.get('grant_type') === 'password') {
          const u = USERS[(j.email || '').toLowerCase()];
          if (!u || u.password !== j.password) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', msg: 'Invalid login credentials' });
          return send(res, 200, session(j.email.toLowerCase()));
        }
        if (url.searchParams.get('grant_type') === 'refresh_token') {
          const m = /^rt-([^-]+)-/.exec(j.refresh_token || '');
          const email = m && Buffer.from(m[1], 'base64url').toString();
          if (!email || !USERS[email]) return send(res, 400, { error: 'invalid_grant', code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
          return send(res, 200, session(email));
        }
      }
      if (path === 'user') {
        const t = (req.headers.authorization || '').replace(/^Bearer /, '');
        const p = decode(t);
        if (!p?.email || !USERS[p.email]) return send(res, 401, { code: 'no_authorization', msg: 'invalid JWT' });
        if (req.method === 'PUT') {
          const j = body ? JSON.parse(body) : {};
          const u = USERS[p.email];
          if (j.password) {
            if (String(j.password).length < 8) return send(res, 422, { code: 'weak_password', msg: 'Password should be at least 8 characters.' });
            if (j.password === u.password) return send(res, 422, { code: 'same_password', msg: 'New password should be different from the old password.' });
            u.password = j.password;
          }
          if (j.data) u.meta = { ...(u.meta || {}), ...j.data };
          stats.passwordChanges = (stats.passwordChanges ?? 0) + (j.password ? 1 : 0);
        }
        return send(res, 200, userObj(p.email));
      }
      if (path === 'logout') return send(res, 204);
      return send(res, 404, { msg: 'not found' });
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      stats.rest++;
      const target = rest + url.pathname.slice(8) + url.search;
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (['host', 'connection', 'content-length', 'apikey', 'origin', 'referer'].includes(k)) continue;
        headers[k] = v;
      }
      if (!headers.authorization || !/^Bearer ey/.test(headers.authorization)) headers.authorization = `Bearer ${ANON_KEY}`;
      try {
        const r = await fetch(target, { method: req.method, headers, body });
        const out = Buffer.from(await r.arrayBuffer());
        const h = { ...cors };
        r.headers.forEach((v, k) => { if (!['content-encoding', 'transfer-encoding', 'connection'].includes(k)) h[k] = v; });
        res.writeHead(r.status, h);
        return res.end(out);
      } catch (e) {
        return send(res, 502, { message: String(e) });
      }
    }
    // محاكاة Edge Function team-admin (نفس قواعد supabase/functions/team-admin) عبر PostgREST بدور service_role
    if (url.pathname === '/functions/v1/team-admin' && req.method === 'POST') {
      stats.team = (stats.team ?? 0) + 1;
      const p = decode((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!p?.sub) return send(res, 401, { error: 'unauthorized' });
      const b = JSON.parse((await readBody(req)) || '{}');
      const svc = { authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json' };
      const q = async (path, opts = {}) => {
        const r = await fetch(`${rest}/${path}`, { ...opts, headers: { ...svc, ...(opts.headers || {}) } });
        const txt = await r.text();
        if (!r.ok) throw new Error(`${r.status} ${txt}`);
        return txt ? JSON.parse(txt) : null;
      };
      const isSys = async (id) => (await q(`system_admins?user_id=eq.${id}&deleted_at=is.null&select=id`)).length > 0;
      const roleIn = async (farm, id) => (await q(`farm_members?farm_id=eq.${farm}&user_id=eq.${id}&select=role`))[0]?.role ?? null;
      const temp = () => `Tmp${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
      const ensure = async (email, name) => {
        if (USERS[email]) return { id: USERS[email].id, password: null };
        const id = await q('rpc/e2e_create_user', { method: 'POST', body: JSON.stringify({ p_email: email, p_name: name }) });
        const password = temp();
        USERS[email] = { id, password, meta: { must_change_password: true, ...(name ? { full_name: name } : {}) } };
        return { id, password };
      };
      const ROLES = ['farm_manager', 'consultant', 'supervisor', 'scout', 'irrigation', 'operations', 'storekeeper', 'purchasing', 'executive'];
      try {
        const meSys = await isSys(p.sub);
        if (b.action === 'create_member') {
          const my = meSys ? 'admin' : await roleIn(b.farm_id, p.sub);
          if (my !== 'admin' && my !== 'farm_manager') return send(res, 403, { error: 'forbidden' });
          const email = String(b.email || '').trim().toLowerCase();
          if (!ROLES.includes(b.role)) return send(res, 400, { error: 'bad_role' });
          const acc = await ensure(email, b.full_name || null);
          await q('farm_invitations?on_conflict=farm_id,email', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({ farm_id: b.farm_id, email, role: b.role, invited_by: p.sub, accepted_at: null, accepted_user_id: null }) });
          await q('rpc/apply_invitation_for_email', { method: 'POST', body: JSON.stringify({ p_email: email }) });
          return send(res, 200, { ok: true, existing_account: acc.password === null, temp_password: acc.password });
        }
        if (b.action === 'reset_password') {
          if (!meSys) {
            const my = await roleIn(b.farm_id, p.sub);
            if (my !== 'admin' && my !== 'farm_manager') return send(res, 403, { error: 'forbidden' });
            const tr = await roleIn(b.farm_id, b.user_id);
            if (!tr || tr === 'admin' || (await isSys(b.user_id))) return send(res, 404, { error: 'not_member' });
          }
          const email = Object.keys(USERS).find((e) => USERS[e].id === b.user_id);
          if (!email) return send(res, 404, { error: 'user_not_found' });
          const password = temp();
          USERS[email].password = password;
          USERS[email].meta = { ...(USERS[email].meta || {}), must_change_password: true };
          await q(`password_reset_requests?user_id=eq.${b.user_id}&resolved_at=is.null`, { method: 'PATCH',
            body: JSON.stringify({ resolved_at: new Date().toISOString(), resolved_by: p.sub }) });
          return send(res, 200, { ok: true, temp_password: password });
        }
        if (b.action === 'dismiss_reset') {
          await q(`password_reset_requests?id=eq.${b.request_id}`, { method: 'PATCH', body: JSON.stringify({ resolved_at: new Date().toISOString(), resolved_by: p.sub }) });
          return send(res, 200, { ok: true });
        }
        if (b.action === 'add_system_admin') {
          if (!meSys) return send(res, 403, { error: 'forbidden' });
          const acc = await ensure(String(b.email || '').trim().toLowerCase(), b.full_name || null);
          await q('system_admins?on_conflict=user_id', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({ user_id: acc.id, deleted_at: null, created_by: p.sub }) });
          return send(res, 200, { ok: true, existing_account: acc.password === null, temp_password: acc.password });
        }
        if (b.action === 'remove_system_admin') {
          if (!meSys) return send(res, 403, { error: 'forbidden' });
          if (b.user_id === p.sub) return send(res, 400, { error: 'cannot_remove_self' });
          await q(`system_admins?user_id=eq.${b.user_id}`, { method: 'PATCH', body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
          return send(res, 200, { ok: true });
        }
        return send(res, 400, { error: 'unknown_action' });
      } catch (e) {
        return send(res, 500, { error: 'failed', detail: String(e) });
      }
    }
    // دالة الطقس (محاكاة Edge Function weather): العضوية والإحداثيات عبر PostgREST بهوية المستخدم
    if (url.pathname === '/functions/v1/weather' && req.method === 'POST') {
      stats.weather = (stats.weather ?? 0) + 1;
      const body = JSON.parse((await readBody(req)) || '{}');
      const r = await fetch(`${rest}/farm_profiles?id=eq.${body.farm_id}&select=latitude,longitude`, { headers: { authorization: req.headers.authorization || '' } });
      const rows = r.ok ? await r.json() : [];
      if (!rows.length || rows[0].latitude == null) return send(res, 400, { error: 'no_location' });
      return send(res, 200, { fetched_at: new Date().toISOString(), payload: fakeForecast(Number(rows[0].latitude), Number(rows[0].longitude)), cached: false });
    }
    // تخزين الصور (محاكاة Supabase Storage في الذاكرة)
    if (url.pathname.startsWith('/storage/v1/object/')) {
      stats.storage = (stats.storage ?? 0) + 1;
      const rest = url.pathname.slice('/storage/v1/object/'.length);
      const t = (req.headers.authorization || '').replace(/^Bearer /, '');
      const p = decode(t);
      if (rest.startsWith('sign/')) {
        const key = rest.slice(5);
        if (req.method === 'POST') {
          if (!p?.sub || !objects.has(key)) return send(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
          return send(res, 200, { signedURL: `/object/sign/${key}?token=e2e` });
        }
        const o = objects.get(key);
        if (!o) return send(res, 404, { message: 'not found' });
        res.writeHead(200, { ...cors, 'content-type': o.type });
        return res.end(o.data);
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        if (!p?.sub) return send(res, 400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
        if (objects.has(rest) && req.method === 'POST') return send(res, 400, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
        const chunks = [];
        for await (const c of req) chunks.push(c);
        objects.set(rest, { data: Buffer.concat(chunks), type: req.headers['content-type'] || 'application/octet-stream' });
        return send(res, 200, { Key: rest, Id: crypto.randomUUID() });
      }
      return send(res, 404, { msg: 'not found' });
    }
    send(res, 404, { msg: 'not found' });
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r({ server, stats })));
}
