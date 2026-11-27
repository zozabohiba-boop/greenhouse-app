import type { ReactNode } from 'react';

export function Field({ label, hint, flag, children }: { label: string; hint?: string; flag?: boolean; children: ReactNode }) {
  return (
    <label className={flag ? 'field scanned-field' : 'field'}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** يحول قيمة حقل رقمي لرقم أو null */
export const toNum = (v: string): number | null => {
  const t = v.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(',', '.').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
export const numStr = (v: unknown): string => (v == null ? '' : String(v));
