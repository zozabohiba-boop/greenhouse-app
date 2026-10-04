// Edge Function: team-admin
// إضافة عضو للمزرعة (إنشاء حسابه بكلمة مرور مؤقتة) وإعادة تعيين كلمة المرور.
// السبب: التسجيل العام مقفول، وخدمة الإيميل الافتراضية في Supabase لا ترسل لأي بريد خارج الفريق،
// فالمدير ينشئ الحساب من داخل التطبيق ويسلّم كلمة المرور المؤقتة للمهندس.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLES = ['admin', 'farm_manager', 'consultant', 'scout', 'executive'] as const;
type Role = (typeof ROLES)[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** كلمة مرور مؤقتة سهلة القراءة والإملاء (بدون حروف متشابهة) */
function tempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const s = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

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
  const action = String(body.action ?? '');
  const farmId = String(body.farm_id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(farmId)) return json({ error: 'bad_farm' }, 400);

  // صلاحية المستدعي على المزرعة (عبر RLS بهويته هو)
  const { data: myRow } = await userClient
    .from('farm_members').select('role').eq('farm_id', farmId).eq('user_id', me.user.id).maybeSingle();
  const myRole = myRow?.role as Role | undefined;
  if (myRole !== 'admin' && myRole !== 'farm_manager') return json({ error: 'forbidden' }, 403);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  if (action === 'create_member') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const role = String(body.role ?? '') as Role;
    const fullName = String(body.full_name ?? '').trim() || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'bad_email' }, 400);
    if (!ROLES.includes(role)) return json({ error: 'bad_role' }, 400);
    if (role === 'admin' && myRole !== 'admin') return json({ error: 'forbidden_role' }, 403);

    const password = tempPassword();
    const { error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: fullName ? { full_name: fullName } : {},
    });
    const exists = !!cErr && /already|exists|registered/i.test(cErr.message);
    if (cErr && !exists) return json({ error: 'create_failed', detail: cErr.message }, 500);

    // الدعوة تربط الحساب بالمزرعة فورًا (trigger على farm_invitations)
    const { error: iErr } = await admin.from('farm_invitations').upsert(
      { farm_id: farmId, email, role, invited_by: me.user.id, accepted_at: null, accepted_user_id: null },
      { onConflict: 'farm_id,email' },
    );
    if (iErr) return json({ error: 'invite_failed', detail: iErr.message }, 500);
    // في حالة upsert على دعوة قديمة لا يعمل trigger الإدراج — نطبّقها صراحة
    await admin.rpc('apply_invitation_for_email', { p_email: email });
    if (fullName) await admin.from('profiles').update({ full_name: fullName }).eq('email', email).is('full_name', null);

    return json({ ok: true, existing_account: exists, temp_password: exists ? null : password });
  }

  if (action === 'reset_password') {
    if (myRole !== 'admin') return json({ error: 'forbidden' }, 403);
    const userId = String(body.user_id ?? '');
    const { data: target } = await admin
      .from('farm_members').select('user_id').eq('farm_id', farmId).eq('user_id', userId).maybeSingle();
    if (!target) return json({ error: 'not_member' }, 404);
    const password = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ error: 'reset_failed', detail: error.message }, 500);
    return json({ ok: true, temp_password: password });
  }

  return json({ error: 'unknown_action' }, 400);
});
