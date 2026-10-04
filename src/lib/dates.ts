/** تاريخ اليوم بالتوقيت المحلي بصيغة YYYY-MM-DD */
export function todayLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** الأسبوع ISO-8601 — نفس حساب PostgreSQL: extract(isoyear/week) */
export function isoWeek(dateStr: string): { year: number; week: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

export function weekKey(year: number, week: number): number {
  return year * 100 + week;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** عمر الزراعة بالأسابيع من تاريخ الشتل */
export function cropAgeWeeks(planting: string, on: string = todayLocal()): number {
  return Math.max(0, Math.floor(daysBetween(planting, on) / 7));
}

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'لم تتم بعد';
  const s = Math.round((now - Date.parse(iso)) / 1000);
  if (s < 60) return 'الآن';
  const m = Math.round(s / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.round(h / 24);
  return `منذ ${d} يوم`;
}
