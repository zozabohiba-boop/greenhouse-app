// أدوات نص مشتركة لقراءة العبوات (عربي/إنجليزي)
import { norm } from '../catalog';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** أرقام عربية-هندية ← لاتينية، وتوحيد الفواصل والرموز التي يخطئ فيها OCR */
export function digits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٪/g, '%');
}

/** تطبيع خفيف يحافظ على النقطة والشرطة المائلة (للأرقام والجرعات) */
export function soft(s: string): string {
  return digits(s).toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ').trim();
}

/** مسافة التحرير (Levenshtein) مع سقف مبكر */
export function lev(a: string, b: string, max = 99): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** تشابه 0..1 بين نصين مطبّعين */
export function similarity(a: string, b: string): number {
  const L = Math.max(a.length, b.length);
  if (!L) return 1;
  const d = lev(a, b, Math.ceil(L * 0.5));
  return Math.max(0, 1 - d / L);
}

/** تطبيع قوي للمطابقة: عربي/إنجليزي + إزالة التشكيل والرموز وتوحيد الحروف المتشابهة */
export function key(s: string | null | undefined): string {
  return norm(digits(s ?? '')).replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** كل n-grams (1..maxN كلمات) من نص مطبّع */
export function ngrams(text: string, maxN = 3): string[] {
  const w = key(text).split(' ').filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i < w.length; i++) {
    for (let n = 1; n <= maxN && i + n <= w.length; n++) out.add(w.slice(i, i + n).join(' '));
  }
  return [...out];
}

/** هل يحتوي النص على الكلمة/العبارة (تطابق شبه تام بسماح بخطأ حرف في الكلمات الطويلة) */
export function fuzzyHas(hay: string, needle: string): boolean {
  const n = key(needle);
  if (n.length < 4) return false;
  const h = key(hay);
  if (` ${h} `.includes(` ${n} `)) return true;
  const tol = n.length >= 10 ? 2 : n.length >= 6 ? 1 : 0;
  if (!tol) return false;
  const nw = n.split(' ').length;
  const hw = h.split(' ');
  for (let i = 0; i + nw <= hw.length; i++) {
    const seg = hw.slice(i, i + nw).join(' ');
    if (Math.abs(seg.length - n.length) <= tol && lev(seg, n, tol) <= tol) return true;
  }
  return false;
}
