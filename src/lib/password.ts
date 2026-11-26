// قواعد كلمة المرور + فحص التسريبات (Have I Been Pwned بطريقة k-anonymity:
// يُرسل أول 5 حروف فقط من بصمة SHA-1، وكلمة المرور نفسها لا تغادر الجهاز أبدًا).

const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwerty123', 'iloveyou', '11111111', '00000000',
  'abcd1234', 'admin123', 'welcome1', 'p@ssw0rd', 'passw0rd', 'qwertyui', '1q2w3e4r', 'zaq12wsx', 'greenhouse',
]);

/** يرجع سبب الرفض أو null */
export function passwordProblem(pw: string, email?: string | null): string | null {
  if (pw.length < 8) return 'كلمة المرور لازم تكون 8 أحرف على الأقل.';
  if (pw.length > 72) return 'كلمة المرور طويلة جدًا (72 حرفًا كحد أقصى).';
  if (!/[A-Za-z؀-ۿ]/.test(pw) || !/\d/.test(pw)) return 'استخدم حروفًا وأرقامًا معًا.';
  if (/^(.)\1+$/.test(pw)) return 'كلمة المرور سهلة التخمين.';
  if (COMMON.has(pw.toLowerCase())) return 'كلمة المرور شائعة جدًا وسهلة التخمين.';
  const local = email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return 'لا تستخدم اسم بريدك داخل كلمة المرور.';
  return null;
}

/** 0..4 لمؤشر القوة */
export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * هل ظهرت كلمة المرور في تسريبات معروفة؟
 * true = مسرّبة، false = سليمة، null = تعذر الفحص (بدون إنترنت أو الخدمة لا ترد) — لا نمنع المستخدم وقتها.
 */
export async function isPwned(pw: string, timeoutMs = 4000): Promise<boolean | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  try {
    const hash = await sha1Hex(pw);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const body = await res.text();
    return body.split('\n').some((line) => {
      const [suf, count] = line.trim().split(':');
      return suf === suffix && Number(count) > 0;
    });
  } catch {
    return null;
  }
}
