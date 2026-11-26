import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { PROJECT_ROLES, ROLE_HINT, ROLE_LABEL, type Role } from '../lib/access';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { syncNow } from '../lib/sync';
import { isPwned, passwordProblem, passwordScore } from '../lib/password';
import { formatDate } from '../lib/dates';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import type { Row } from '../lib/schema';

const ERR: Record<string, string> = {
  bad_email: 'البريد الإلكتروني غير صحيح',
  bad_role: 'الدور غير متاح',
  forbidden: 'ليس لديك صلاحية لهذا الإجراء',
  not_member: 'المستخدم ليس عضوًا في هذا المشروع',
  cannot_remove_self: 'لا يمكنك إلغاء صلاحيتك بنفسك',
  use_change_password: 'غيّر كلمة مرورك من القائمة',
};

export type TeamResult = { ok?: boolean; temp_password?: string | null; existing_account?: boolean; error?: string };

export async function callTeam(body: Record<string, unknown>): Promise<TeamResult> {
  if (!navigator.onLine) return { error: 'إدارة الحسابات تحتاج اتصال بالإنترنت' };
  const { data, error } = await supabase.functions.invoke('team-admin', { body });
  if (error) {
    let code = '';
    try { code = (await (error as any).context?.json())?.error ?? ''; } catch { /* ignore */ }
    return { error: ERR[code] ?? 'تعذر تنفيذ الطلب. تأكد من الاتصال وحاول مرة أخرى.' };
  }
  return data;
}

interface ResetRequest { id: string; email: string; user_id: string; created_at: string }

/** طلبات "نسيت كلمة المرور" التي يراها المستخدم (RLS: مدير النظام الكل، ومدير الشركة أعضاء مشروعه) */
export function useResetRequests(enabled: boolean) {
  const [list, setList] = useState<ResetRequest[]>([]);
  const load = useCallback(async () => {
    if (!enabled || !navigator.onLine) return;
    const { data } = await supabase.from('password_reset_requests').select('id,email,user_id,created_at').order('created_at', { ascending: false }).limit(50);
    setList((data ?? []) as ResetRequest[]);
  }, [enabled]);
  useEffect(() => { void load(); }, [load]);
  return { list, reload: load };
}

export function Team() {
  const { farmId, can, user, toast, isSystemAdmin } = useApp();
  const members = useLiveQuery(async () => {
    const mem = await db.farm_members.where('farm_id').equals(farmId!).toArray();
    const profiles = await db.profiles.bulkGet(mem.map((m) => m.user_id));
    return mem
      .map((m, i) => ({ m, p: profiles[i] }))
      // مديرو النظام لا يظهرون في فريق المشروع
      .filter((x) => x.m.role !== 'admin' || isSystemAdmin)
      .sort((a, b) => PROJECT_ROLES.indexOf(a.m.role as Role) - PROJECT_ROLES.indexOf(b.m.role as Role));
  }, [farmId, isSystemAdmin]);
  const requests = useResetRequests(can.invite);
  const [add, setAdd] = useState(false);
  const [edit, setEdit] = useState<{ m: Row<'farm_members'>; p?: Row<'profiles'> } | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);

  if (!can.invite) return <Navigate to="/" replace />;

  const memberIds = new Set((members ?? []).map((x) => x.m.user_id));
  const myRequests = requests.list.filter((r) => isSystemAdmin || memberIds.has(r.user_id));
  const byRole = PROJECT_ROLES.map((r) => ({ r, items: (members ?? []).filter((x) => x.m.role === r) })).filter((g) => g.items.length);

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>فريق العمل</h1><p>كل عضو يشوف ويسجّل في مجاله فقط داخل هذا المشروع.</p></div>
        <button className="btn primary" onClick={() => setAdd(true)}><Icon name="plus" /> إضافة عضو</button>
      </div>

      {myRequests.length > 0 && (
        <section className="panel reset-requests" aria-label="طلبات نسيت كلمة المرور">
          <h2 className="section-title"><span><Icon name="lock" size={20} /> طلبات إعادة كلمة المرور</span><span className="chip warn">{myRequests.length}</span></h2>
          <ul className="list">
            {myRequests.map((r) => (
              <li key={r.id} className="list-item">
                <span className="grow"><b className="num">{r.email}</b><p className="muted">{formatDate(r.created_at.slice(0, 10))}</p></span>
                <button className="btn primary" onClick={async () => {
                  const res = await callTeam({ action: 'reset_password', farm_id: farmId, user_id: r.user_id });
                  if (res.error || !res.temp_password) return toast(res.error ?? 'تعذر');
                  setSecret({ email: r.email, password: res.temp_password });
                  void requests.reload();
                }}>كلمة مرور مؤقتة</button>
                <button className="btn ghost" onClick={async () => { await callTeam({ action: 'dismiss_reset', request_id: r.id }); void requests.reload(); }}>تجاهل</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {byRole.length === 0 && <div className="panel empty"><h3>لا يوجد أعضاء بعد</h3><p>أضف مدير الشركة والمهندسين، وكل واحد هيدخل على مجاله.</p></div>}
      {byRole.map(({ r, items }) => (
        <section key={r} className="team-group">
          <h2 className="section-title"><span>{ROLE_LABEL[r]}</span><span className="faint">{items.length}</span></h2>
          <ul className="list panel">
            {items.map(({ m, p }) => (
              <li key={m.user_id} className="list-item">
                <span className="grow">
                  <b>{p?.full_name || p?.email || 'عضو'}</b>{m.user_id === user?.id && <span className="chip" style={{ marginInlineStart: 8 }}>أنت</span>}
                  <p className="muted num" style={{ fontSize: 'var(--fs-sm)' }}>{p?.email}</p>
                </span>
                {m.user_id !== user?.id && (
                  <button className="iconbtn" aria-label={`إدارة ${p?.full_name || p?.email || 'العضو'}`} onClick={() => setEdit({ m, p })}><Icon name="edit" size={20} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {add && (
        <AddMember onClose={() => setAdd(false)} farmId={farmId!}
          onDone={(email, password) => { setAdd(false); if (password) setSecret({ email, password }); else toast('تمت إضافة الحساب الموجود للمشروع'); void syncNow(); }} />
      )}
      {edit && (
        <EditMember item={edit} farmId={farmId!} onClose={() => setEdit(null)}
          onPassword={(password) => { setSecret({ email: edit.p?.email ?? '', password }); setEdit(null); }} />
      )}
      {secret && <SecretSheet secret={secret} onClose={() => setSecret(null)} />}
    </main>
  );
}

export function SecretSheet({ secret, onClose }: { secret: { email: string; password: string }; onClose: () => void }) {
  const { toast } = useApp();
  return (
    <Sheet title="بيانات الدخول المؤقتة" onClose={onClose}>
      <div className="form">
        <p className="muted">سلّمها لصاحبها بنفسك. هيُطلب منه تغييرها أول ما يدخل، ولن تظهر هنا مرة أخرى.</p>
        <div className="stat"><span className="k">البريد</span><span className="v num" style={{ fontSize: 18 }}>{secret.email}</span></div>
        <div className="stat"><span className="k">كلمة المرور المؤقتة</span><span className="v num" data-testid="temp-password" style={{ letterSpacing: 1 }}>{secret.password}</span></div>
        <div className="form-actions">
          <button className="btn primary" onClick={async () => {
            try { await navigator.clipboard.writeText(`البريد: ${secret.email}\nكلمة المرور المؤقتة: ${secret.password}`); toast('تم النسخ'); } catch { toast('انسخها يدويًا'); }
          }}>نسخ</button>
          <button className="btn" onClick={onClose}>تم</button>
        </div>
      </div>
    </Sheet>
  );
}

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="field">
      <span>الدور</span>
      <div className="list panel role-pick">
        {PROJECT_ROLES.map((r) => (
          <label key={r} className="list-item" style={{ minHeight: 56, cursor: 'pointer' }}>
            <input type="radio" name="role" checked={value === r} onChange={() => onChange(r)} style={{ width: 22, height: 22 }} />
            <span className="grow"><b>{ROLE_LABEL[r]}</b><p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{ROLE_HINT[r]}</p></span>
          </label>
        ))}
      </div>
    </div>
  );
}

function AddMember({ farmId, onClose, onDone }: { farmId: string; onClose: () => void; onDone: (email: string, password: string | null) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('scout');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="إضافة عضو" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const r = await callTeam({ action: 'create_member', farm_id: farmId, email, role, full_name: name });
        setBusy(false);
        if (r.error) setErr(r.error); else onDone(email.trim().toLowerCase(), r.temp_password ?? null);
      }}>
        <Field label="الاسم"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="البريد الإلكتروني"><input className="input ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <RolePicker value={role} onChange={setRole} />
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" disabled={busy}>{busy ? 'جاري الإنشاء…' : 'إنشاء الحساب'}</button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Sheet>
  );
}

function EditMember({ item, farmId, onClose, onPassword }: { item: { m: Row<'farm_members'>; p?: Row<'profiles'> }; farmId: string; onClose: () => void; onPassword: (p: string) => void }) {
  const { toast } = useApp();
  const [role, setRole] = useState<Role>(item.m.role as Role);
  const [err, setErr] = useState<string | null>(null);
  const online = async (fn: () => Promise<{ error: { message: string } | null }>, ok: string) => {
    if (!navigator.onLine) return setErr('يحتاج اتصال بالإنترنت');
    const { error } = await fn();
    if (error) return setErr('تعذر الحفظ');
    await syncNow();
    toast(ok);
    onClose();
  };
  return (
    <Sheet title={item.p?.full_name || item.p?.email || 'عضو'} onClose={onClose}>
      <div className="form">
        <RolePicker value={role} onChange={setRole} />
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" disabled={role === item.m.role}
            onClick={() => online(async () => await supabase.from('farm_members').update({ role }).eq('farm_id', farmId).eq('user_id', item.m.user_id), 'تم تغيير الدور')}>حفظ الدور</button>
          <button className="btn" onClick={async () => {
            const r = await callTeam({ action: 'reset_password', farm_id: farmId, user_id: item.m.user_id });
            if (r.error || !r.temp_password) setErr(r.error ?? 'تعذر'); else onPassword(r.temp_password);
          }}>كلمة مرور مؤقتة جديدة</button>
          <button className="btn danger" onClick={() => online(async () => await supabase.from('farm_members').delete().eq('farm_id', farmId).eq('user_id', item.m.user_id), 'تم إزالة العضو من المشروع')}>إزالة من المشروع</button>
        </div>
      </div>
    </Sheet>
  );
}

/** نموذج كلمة مرور جديدة: القواعد + مؤشر القوة + فحص التسريبات */
export function NewPasswordForm({ submitLabel, onCancel, onDone }: { submitLabel: string; onCancel?: () => void; onDone: () => void }) {
  const { user, changePassword } = useApp();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const score = passwordScore(a);
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      const p = passwordProblem(a, user?.email);
      if (p) return setErr(p);
      if (a !== b) return setErr('كلمتا المرور غير متطابقتين');
      if (!navigator.onLine) return setErr('تغيير كلمة المرور يحتاج اتصال بالإنترنت');
      setBusy(true); setErr(null);
      if (await isPwned(a)) { setBusy(false); return setErr('كلمة المرور دي ظهرت قبل كده في تسريبات بيانات معروفة. اختر كلمة مختلفة.'); }
      const msg = await changePassword(a);
      setBusy(false);
      if (msg) return setErr(msg);
      onDone();
    }}>
      <Field label="كلمة المرور الجديدة"><input className="input ltr" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
      <div className="pw-meter" data-score={a ? score : undefined} aria-hidden="true"><i /><i /><i /><i /></div>
      <p className="faint" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>8 أحرف على الأقل، حروف وأرقام. يُفضّل 12 حرفًا مع رمز.</p>
      <Field label="تأكيد كلمة المرور"><input className="input ltr" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="form-actions">
        <button className="btn primary" disabled={busy}>{busy ? 'جاري الحفظ…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  );
}

export function ChangePassword({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  return (
    <Sheet title="تغيير كلمة المرور" onClose={onClose}>
      <NewPasswordForm submitLabel="حفظ" onCancel={onClose} onDone={() => { toast('تم تغيير كلمة المرور'); onClose(); }} />
    </Sheet>
  );
}

/** شاشة إجبارية بعد الدخول بكلمة مرور مؤقتة */
export function ForcePasswordChange() {
  const { user, signOut, toast } = useApp();
  return (
    <main className="login">
      <div className="card panel">
        <div className="mark"><Icon name="lock" size={40} /><h1 style={{ lineHeight: 1.3 }}>اختر كلمة مرور جديدة</h1>
          <p className="muted">دخلت بكلمة مرور مؤقتة ({user?.email}). لازم تختار كلمة مرور خاصة بيك قبل ما تكمل.</p></div>
        <NewPasswordForm submitLabel="حفظ والمتابعة" onDone={() => toast('تم تغيير كلمة المرور')} />
        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => void signOut()}><Icon name="logout" size={20} /> خروج</button>
      </div>
    </main>
  );
}

/** مديرو النظام: يشوفوا كل المشاريع — لا يظهرون في فرق المشاريع */
export function SystemAdmins() {
  const { isSystemAdmin, user } = useApp();
  const admins = useLiveQuery(async () => {
    const rows = (await db.system_admins.toArray()).filter((r) => !r.deleted_at);
    const profiles = await db.profiles.bulkGet(rows.map((r) => r.user_id));
    return rows.map((r, i) => ({ r, p: profiles[i] }));
  }, []);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const { toast } = useApp();
  if (!isSystemAdmin) return <Navigate to="/" replace />;
  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>مديرو النظام</h1><p>صلاحية كاملة على كل المشاريع، ولا يظهرون لفرق المشاريع.</p></div>
        <button className="btn primary" onClick={() => setAdd(true)}><Icon name="plus" /> إضافة مدير نظام</button>
      </div>
      <ul className="list panel">
        {admins?.map(({ r, p }) => (
          <li key={r.id} className="list-item">
            <span className="grow"><b>{p?.full_name || p?.email || 'مدير نظام'}</b>{r.user_id === user?.id && <span className="chip" style={{ marginInlineStart: 8 }}>أنت</span>}
              <p className="muted num">{p?.email}</p></span>
            {r.user_id !== user?.id && (
              <button className="btn danger" onClick={async () => {
                if (!window.confirm(`إلغاء صلاحية مدير النظام لـ ${p?.email ?? ''}؟`)) return;
                const res = await callTeam({ action: 'remove_system_admin', user_id: r.user_id });
                if (res.error) toast(res.error); else { toast('تم إلغاء الصلاحية'); void syncNow(); }
              }}>إلغاء الصلاحية</button>
            )}
          </li>
        ))}
      </ul>
      {add && (
        <Sheet title="إضافة مدير نظام" onClose={() => setAdd(false)}>
          <form className="form" onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            const res = await callTeam({ action: 'add_system_admin', email, full_name: name });
            if (res.error) return setErr(res.error);
            setAdd(false);
            if (res.temp_password) setSecret({ email: email.trim().toLowerCase(), password: res.temp_password });
            else toast('تمت إضافة الحساب الموجود كمدير نظام');
            void syncNow();
          }}>
            <Field label="الاسم"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="البريد الإلكتروني"><input className="input ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            {err && <p className="form-error" role="alert">{err}</p>}
            <div className="form-actions"><button className="btn primary">إضافة</button><button type="button" className="btn" onClick={() => setAdd(false)}>إلغاء</button></div>
          </form>
        </Sheet>
      )}
      {secret && <SecretSheet secret={secret} onClose={() => setSecret(null)} />}
    </main>
  );
}
