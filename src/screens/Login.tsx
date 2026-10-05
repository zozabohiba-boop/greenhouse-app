import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../app/context';
import { Field } from '../components/Field';

export function Login() {
  const { user, signIn } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
        <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
          بعد أول دخول يعمل التطبيق داخل الصوبة بدون إنترنت. الحسابات يضيفها مدير المزرعة.
        </p>
      </form>
    </main>
  );
}
