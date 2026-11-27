import { useRef, useState } from 'react';
import { fileToLogo } from '../lib/logo';
import { Icon } from './Icon';

/** رفع لوجو الشركة: يظهر مكان لوجو التطبيق داخل المشروع */
export function LogoPicker({ value, onChange, name }: { value: string | null; onChange: (v: string | null) => void; name?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="field">
      <span>لوجو الشركة <small className="muted">(يظهر مكان لوجو التطبيق داخل المشروع)</small></span>
      <div className="logo-pick">
        <span className="logo-box">{value ? <img src={value} alt="" /> : <b>{(name ?? '؟').trim().charAt(0) || '؟'}</b>}</span>
        <div className="logo-actions">
          <button type="button" className="btn sm" onClick={() => ref.current?.click()}><Icon name="camera" /> {value ? 'تغيير اللوجو' : 'رفع لوجو'}</button>
          {value && <button type="button" className="btn sm" onClick={() => onChange(null)}>إزالة</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          if (!f) return;
          try { setErr(null); onChange(await fileToLogo(f)); } catch (x) { setErr(x instanceof Error ? x.message : 'تعذر فتح الصورة'); }
        }} />
      </div>
      {err && <small className="scan-issue">{err}</small>}
    </div>
  );
}

/** لوجو المشروع أو حرفه الأول */
export function FarmMark({ logo, name, size = 46 }: { logo?: string | null; name?: string | null; size?: number }) {
  return logo
    ? <img src={logo} alt="" className="farm-mark" style={{ width: size, height: size }} />
    : <span className="farm-mark fallback" style={{ width: size, height: size }}>{(name ?? '؟').trim().charAt(0) || '؟'}</span>;
}
