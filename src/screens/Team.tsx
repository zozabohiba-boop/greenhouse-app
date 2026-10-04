import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp, ROLE_LABEL } from '../app/context';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { syncNow } from '../lib/sync';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import type { Row } from '../lib/schema';

type Role = Row<'farm_members'>['role'];
const ROLE_ORDER: Role[] = ['admin', 'farm_manager', 'consultant', 'scout', 'executive'];
const ROLE_HINT: Record<Role, string> = {
  admin: 'كل الصلاحيات وإدارة الفريق',
  farm_manager: 'يعدّل كل بيانات المزرعة ويضيف أعضاء',
  consultant: 'يسجّل ويحدد القيم المستهدفة والتوصيات',
  scout: 'يسجّل القياسات والفحص الميداني',
  executive: 'متابعة وقراءة فقط',
};

const ERR: Record<string, string> = {
  bad_email: 'البريد الإلكتروني غير صحيح',
  forbidden: 'ليس لديك صلاحية إدارة الفريق',
  forbidden_role: 'إضافة مدير نظام مسموحة لمدير النظام فقط',
  not_member: 'المستخدم ليس عضوًا في هذه المزرعة',
};

async function callTeam(body: Record<string, unknown>): Promise<{ ok?: boolean; temp_password?: string | null; existing_account?: boolean; error?: string }> {
  if (!navigator.onLine) return { error: 'إدارة الفريق تحتاج اتصال بالإنترنت' };
  const { data, error } = await supabase.functions.invoke('team-admin', { body });
  if (error) {
    let code = '';
    try { code = (await (error as any).context?.json())?.error ?? ''; } catch { /* ignore */ }
    return { error: ERR[code] ?? 'تعذر تنفيذ الطلب. تأكد من الاتصال وحاول مرة أخرى.' };
  }
  return data;
}

export function Team() {
  const { farmId, can, user, toast } = useApp();
  const members = useLiveQuery(async () => {
    const mem = await db.farm_members.where('farm_id').equals(farmId!).toArray();
    const profiles = await db.profiles.bulkGet(mem.map((m) => m.user_id));
    return mem
      .map((m, i) => ({ m, p: profiles[i] }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.m.role) - ROLE_ORDER.indexOf(b.m.role));
  }, [farmId]);
  const [add, setAdd] = useState(false);
  const [edit, setEdit] = useState<{ m: Row<'farm_members'>; p?: Row<'profiles'> } | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);

  if (!can.invite) return <Navigate to="/" replace />;

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>فريق العمل</h1><p>الحسابات تُنشأ من هنا، وكل عضو يرى بيانات هذه المزرعة فقط</p></div>
        <button className="btn primary" onClick={() => setAdd(true)}><Icon name="plus" /> إضافة عضو</button>
      </div>
      <ul className="list panel">
        {members?.map(({ m, p }) => (
          <li key={m.user_id} className="list-item">
            <span className="grow">
              <b>{p?.full_name || p?.email || 'عضو'}</b>{m.user_id === user?.id && <span className="chip" style={{ marginInlineStart: 8 }}>أنت</span>}
              <p className="muted num" style={{ fontSize: 'var(--fs-sm)' }}>{p?.email}</p>
            </span>
            <span className="chip info">{ROLE_LABEL[m.role]}</span>
            {can.admin && m.user_id !== user?.id && (
              <button className="iconbtn" aria-label="إدارة العضو" onClick={() => setEdit({ m, p })}><Icon name="edit" size={20} /></button>
            )}
          </li>
        ))}
      </ul>

      {add && (
        <AddMember onClose={() => setAdd(false)} isAdmin={can.admin} farmId={farmId!}
          onDone={(email, password) => { setAdd(false); if (password) setSecret({ email, password }); else toast('تمت إضافة الحساب الموجود للمزرعة'); void syncNow(); }} />
      )}
      {edit && (
        <EditMember item={edit} farmId={farmId!} onClose={() => setEdit(null)}
          onPassword={(password) => { setSecret({ email: edit.p?.email ?? '', password }); setEdit(null); }} />
      )}
      {secret && (
        <Sheet title="بيانات الدخول المؤقتة" onClose={() => setSecret(null)}>
          <div className="form">
            <p className="muted">سلّمها للعضو بنفسك. يمكنه تغييرها من القائمة بعد أول دخول. لن تظهر مرة أخرى.</p>
            <div className="stat"><span className="k">البريد</span><span className="v num" style={{ fontSize: 18 }}>{secret.email}</span></div>
            <div className="stat"><span className="k">كلمة المرور المؤقتة</span><span className="v num" style={{ letterSpacing: 1 }}>{secret.password}</span></div>
            <div className="form-actions">
              <button className="btn primary" onClick={async () => {
                try { await navigator.clipboard.writeText(`البريد: ${secret.email}\nكلمة المرور: ${secret.password}`); toast('تم النسخ'); } catch { toast('انسخها يدويًا'); }
              }}>نسخ</button>
              <button className="btn" onClick={() => setSecret(null)}>تم</button>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  );
}

function AddMember({ farmId, isAdmin, onClose, onDone }: { farmId: string; isAdmin: boolean; onClose: () => void; onDone: (email: string, password: string | null) => void }) {
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
        <div className="field">
          <span>الدور</span>
          <div className="list panel">
            {ROLE_ORDER.filter((r) => isAdmin || r !== 'admin').map((r) => (
              <label key={r} className="list-item" style={{ minHeight: 56, cursor: 'pointer' }}>
                <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} style={{ width: 22, height: 22 }} />
                <span className="grow"><b>{ROLE_LABEL[r]}</b><p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{ROLE_HINT[r]}</p></span>
              </label>
            ))}
          </div>
        </div>
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
  const [role, setRole] = useState<Role>(item.m.role);
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
        <Field label="الدور">
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" disabled={role === item.m.role}
            onClick={() => online(async () => await supabase.from('farm_members').update({ role }).eq('farm_id', farmId).eq('user_id', item.m.user_id), 'تم تغيير الدور')}>حفظ الدور</button>
          <button className="btn" onClick={async () => {
            const r = await callTeam({ action: 'reset_password', farm_id: farmId, user_id: item.m.user_id });
            if (r.error || !r.temp_password) setErr(r.error ?? 'تعذر'); else onPassword(r.temp_password);
          }}>كلمة مرور جديدة</button>
          <button className="btn danger" onClick={() => online(async () => await supabase.from('farm_members').delete().eq('farm_id', farmId).eq('user_id', item.m.user_id), 'تم إزالة العضو من المزرعة')}>إزالة من المزرعة</button>
        </div>
      </div>
    </Sheet>
  );
}

export function ChangePassword({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="تغيير كلمة المرور" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        if (a.length < 8) return setErr('8 أحرف على الأقل');
        if (a !== b) return setErr('كلمتا المرور غير متطابقتين');
        if (!navigator.onLine) return setErr('يحتاج اتصال بالإنترنت');
        const { error } = await supabase.auth.updateUser({ password: a });
        if (error) return setErr(/weak|short/i.test(error.message) ? 'كلمة المرور ضعيفة' : 'تعذر التغيير');
        toast('تم تغيير كلمة المرور');
        onClose();
      }}>
        <Field label="كلمة المرور الجديدة"><input className="input ltr" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="تأكيدها"><input className="input ltr" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} /></Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions"><button className="btn primary">حفظ</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}
