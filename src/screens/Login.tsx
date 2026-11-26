import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../app/context';
import { Field } from '../components/Field';
import { Sheet } from '../components/Sheet';
import { supabase } from '../lib/supabase';

export function Login() {
  const { user, signIn } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (res) setErr(res);
    else if (location.hash.startsWith('#/login')) nav('/', { replace: true });
  }

  return (
    <main className="login">
      <form className="panel card form" onSubmit={submit}>
        <div className="mark">
          <h1><img src="./icons/logo-full.png" alt="Greenhouse Assistant" width={360} height={220} /></h1>
          <p className="muted">متابعة المحصول والفحص الحشري والتوصيات الفنية للصوب</p>
        </div>
        <Field label="البريد الإلكتروني">
          <input className="input ltr" type="email" autoComplete="username" inputMode="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="كلمة المرور">
          <input className="input ltr" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn primary lg block" disabled={busy}>{busy ? 'جاري الدخول…' : 'دخول'}</button>
        <button type="button" className="btn ghost block" onClick={() => setForgot(true)}>نسيت كلمة المرور؟</button>
        <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
          بعد أول دخول يعمل التطبيق داخل الصوبة بدون إنترنت. الحسابات يضيفها مدير الشركة أو مدير النظام.
        </p>
      </form>
      {forgot && <ForgotPassword initial={email} onClose={() => setForgot(false)} />}
    </main>
  );
}

/** طلب إعادة كلمة المرور: يوصل لمدير الشركة ومدير النظام، ويسلمك كلمة مرور مؤقتة */
function ForgotPassword({ initial, onClose }: { initial: string; onClose: () => void }) {
  const [email, setEmail] = useState(initial);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="نسيت كلمة المرور" onClose={onClose}>
      {sent ? (
        <div className="form">
          <div className="banner ok" role="status">تم تسجيل طلبك.</div>
          <p>طلبك وصل لمدير الشركة ومدير النظام. هيسلّموك كلمة مرور مؤقتة، وأول ما تدخل بيها هيُطلب منك تختار كلمة جديدة.</p>
          <div className="form-actions"><button className="btn primary" onClick={onClose}>تم</button></div>
        </div>
      ) : (
        <form className="form" onSubmit={async (e) => {
          e.preventDefault();
          if (!navigator.onLine) return setErr('إرسال الطلب يحتاج اتصال بالإنترنت');
          setBusy(true); setErr(null);
          const { error } = await supabase.rpc('request_password_reset', { p_email: email.trim() });
          setBusy(false);
          if (error) return setErr('تعذر إرسال الطلب. حاول مرة أخرى.');
          setSent(true);
        }}>
          <p className="muted">اكتب بريدك المسجّل، وهيوصل طلب لمديرك يعيّن لك كلمة مرور مؤقتة.</p>
          <Field label="البريد الإلكتروني">
            <input className="input ltr" type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {err && <p className="form-error" role="alert">{err}</p>}
          <div className="form-actions">
            <button className="btn primary" disabled={busy}>{busy ? 'جاري الإرسال…' : 'إرسال الطلب'}</button>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
