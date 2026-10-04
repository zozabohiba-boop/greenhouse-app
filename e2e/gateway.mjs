// بوابة تحاكي Supabase: /auth/v1 (مصادقة وهمية بتوقيع JWT حقيقي) و /rest/v1 → PostgREST
import http from 'node:http';
import crypto from 'node:crypto';

export const JWT_SECRET = 'e2e-super-secret-jwt-token-with-at-least-32-chars';
const USERS = {
  'admin@test.local': { id: 'aaaaaaaa-0000-0000-0000-000000000001', password: 'Admin#2026' },
  'scout@test.local': { id: 'bbbbbbbb-0000-0000-0000-000000000002', password: 'Scout#2026' },
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function sign(payload) {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const p = b64(payload);
  const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
export const ANON_KEY = sign({ role: 'anon', iss: 'e2e', iat: 1700000000, exp: 2100000000 });
function decode(t) {
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); } catch { return null; }
}
function userObj(email) {
  const u = USERS[email];
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
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
  const stats = { rest: 0, auth: 0, storage: 0, objects: () => objects.size };
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
        if (!p?.email) return send(res, 401, { code: 'no_authorization', msg: 'invalid JWT' });
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
