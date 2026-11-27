// Edge Function: team-admin
// إدارة الحسابات من داخل التطبيق (التسجيل العام مقفول):
//   create_member        مدير النظام / مدير المشروع: إضافة عضو لمشروع بكلمة مرور مؤقتة
//   reset_password       مدير النظام (أي مستخدم) / مدير المشروع (أعضاء مشروعه): كلمة مرور مؤقتة جديدة
//   dismiss_reset        إغلاق طلب "نسيت كلمة المرور" بدون إعادة تعيين
//   add_system_admin     مدير نظام يضيف مدير نظام (ينشئ الحساب لو مش موجود)
//   remove_system_admin  مدير نظام يلغي صلاحية مدير نظام آخر
// كل كلمة مرور مؤقتة تُجبر صاحبها على تغييرها عند أول دخول (user_metadata.must_change_password).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// الأدوار المتاحة داخل المشروع (مدير النظام منفصل ولا يُمنح من هنا)
const ROLES = ['farm_manager', 'consultant', 'supervisor', 'scout', 'irrigation', 'operations', 'storekeeper', 'purchasing', 'executive'] as const;
type Role = (typeof ROLES)[number] | 'admin';

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

const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const isSysAdmin = async (userId: string) => {
    const { data } = await admin.from('system_admins').select('id').eq('user_id', userId).is('deleted_at', null).maybeSingle();
    return !!data;
  };
  const roleIn = async (farmId: string, userId: string): Promise<Role | null> => {
    const { data } = await admin.from('farm_members').select('role').eq('farm_id', farmId).eq('user_id', userId).maybeSingle();
    return (data?.role as Role | undefined) ?? null;
  };
  const meSys = await isSysAdmin(me.user.id);

  /** ينشئ الحساب لو مش موجود ويرجّع (id, كلمة المرور المؤقتة أو null لو الحساب موجود) */
  const ensureAccount = async (email: string, fullName: string | null) => {
    const password = tempPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { ...(fullName ? { full_name: fullName } : {}), must_change_password: true },
    });
    if (!error && data.user) return { id: data.user.id, password };
    if (error && !/already|exists|registered/i.test(error.message)) throw new Error(error.message);
    const { data: prof } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
    return { id: (prof?.id as string | undefined) ?? null, password: null };
  };

  /** كلمة مرور مؤقتة جديدة + إجبار التغيير + إغلاق طلبات "نسيت كلمة المرور" المفتوحة */
  const resetUser = async (userId: string) => {
    const { data: u, error: gErr } = await admin.auth.admin.getUserById(userId);
    if (gErr || !u.user) throw new Error('user_not_found');
    const password = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { ...(u.user.user_metadata ?? {}), must_change_password: true },
    });
    if (error) throw new Error(error.message);
    await admin.from('password_reset_requests')
      .update({ resolved_at: new Date().toISOString(), resolved_by: me.user.id })
      .eq('user_id', userId).is('resolved_at', null);
    return password;
  };

  try {
    if (action === 'create_member') {
      const farmId = String(body.farm_id ?? '');
      if (!isUuid(farmId)) return json({ error: 'bad_farm' }, 400);
      const myRole = meSys ? 'admin' : await roleIn(farmId, me.user.id);
      if (myRole !== 'admin' && myRole !== 'farm_manager') return json({ error: 'forbidden' }, 403);
      const email = String(body.email ?? '').trim().toLowerCase();
      const role = String(body.role ?? '') as Role;
      const fullName = String(body.full_name ?? '').trim() || null;
      if (!isEmail(email)) return json({ error: 'bad_email' }, 400);
      if (!(ROLES as readonly string[]).includes(role)) return json({ error: 'bad_role' }, 400);

      const acc = await ensureAccount(email, fullName);
      // الدعوة تربط الحساب بالمشروع فورًا (trigger على farm_invitations)
      const { error: iErr } = await admin.from('farm_invitations').upsert(
        { farm_id: farmId, email, role, invited_by: me.user.id, accepted_at: null, accepted_user_id: null },
        { onConflict: 'farm_id,email' },
      );
      if (iErr) return json({ error: 'invite_failed', detail: iErr.message }, 500);
      await admin.rpc('apply_invitation_for_email', { p_email: email });
      if (fullName) await admin.from('profiles').update({ full_name: fullName }).eq('email', email).is('full_name', null);
      return json({ ok: true, existing_account: acc.password === null, temp_password: acc.password });
    }

    if (action === 'reset_password') {
      const userId = String(body.user_id ?? '');
      if (!isUuid(userId)) return json({ error: 'bad_user' }, 400);
      if (userId === me.user.id) return json({ error: 'use_change_password' }, 400);
      if (!meSys) {
        // مدير المشروع: لأعضاء مشروعه فقط، وليس لمديري النظام
        const farmId = String(body.farm_id ?? '');
        if (!isUuid(farmId)) return json({ error: 'bad_farm' }, 400);
        const myRole = await roleIn(farmId, me.user.id);
        if (myRole !== 'admin' && myRole !== 'farm_manager') return json({ error: 'forbidden' }, 403);
        const targetRole = await roleIn(farmId, userId);
        if (!targetRole || targetRole === 'admin' || (await isSysAdmin(userId))) return json({ error: 'not_member' }, 404);
      }
      return json({ ok: true, temp_password: await resetUser(userId) });
    }

    if (action === 'dismiss_reset') {
      const requestId = String(body.request_id ?? '');
      if (!isUuid(requestId)) return json({ error: 'bad_request' }, 400);
      // لازم المستدعي يكون شايف الطلب (RLS بهويته)
      const { data: seen } = await userClient.from('password_reset_requests').select('id').eq('id', requestId).maybeSingle();
      if (!seen) return json({ error: 'forbidden' }, 403);
      await admin.from('password_reset_requests')
        .update({ resolved_at: new Date().toISOString(), resolved_by: me.user.id }).eq('id', requestId);
      return json({ ok: true });
    }

    if (action === 'add_system_admin') {
      if (!meSys) return json({ error: 'forbidden' }, 403);
      const email = String(body.email ?? '').trim().toLowerCase();
      const fullName = String(body.full_name ?? '').trim() || null;
      if (!isEmail(email)) return json({ error: 'bad_email' }, 400);
      const acc = await ensureAccount(email, fullName);
      if (!acc.id) return json({ error: 'create_failed' }, 500);
      const { error } = await admin.from('system_admins')
        .upsert({ user_id: acc.id, deleted_at: null, created_by: me.user.id }, { onConflict: 'user_id' });
      if (error) return json({ error: 'add_failed', detail: error.message }, 500);
      if (fullName) await admin.from('profiles').update({ full_name: fullName }).eq('id', acc.id).is('full_name', null);
      return json({ ok: true, existing_account: acc.password === null, temp_password: acc.password });
    }

    if (action === 'remove_system_admin') {
      if (!meSys) return json({ error: 'forbidden' }, 403);
      const userId = String(body.user_id ?? '');
      if (!isUuid(userId)) return json({ error: 'bad_user' }, 400);
      if (userId === me.user.id) return json({ error: 'cannot_remove_self' }, 400);
      const { error } = await admin.from('system_admins')
        .update({ deleted_at: new Date().toISOString(), updated_by: me.user.id }).eq('user_id', userId);
      if (error) return json({ error: 'remove_failed', detail: error.message }, 500);
      return json({ ok: true });
    }
  } catch (e) {
    return json({ error: 'failed', detail: e instanceof Error ? e.message : String(e) }, 500);
  }

  return json({ error: 'unknown_action' }, 400);
});
