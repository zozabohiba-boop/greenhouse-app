// محرك المزامنة — Offline-first
// ─────────────────────────────────────────────────────────────────────
// الرفع (Push):  السجلات المعلّمة _dirty تُرفع بالترتيب (الأب قبل الابن) عبر upsert.
//                لو الدفعة رُفضت، نرفع سجل سجل لعزل السجل المرفوض وحده.
// السحب (Pull):  لكل جدول نسحب ما تغيّر بعد آخر مؤشر (server_updated_at) بهامش دقيقتين،
//                والسجل المحلي اللي فيه تعديل لم يُرفع لا يُستبدل.
// ─────────────────────────────────────────────────────────────────────

import type { PostgrestError } from '@supabase/supabase-js';
import { db, getMeta, setMeta } from './db';
import { supabase } from './supabase';
import { derive, onLocalWrite } from './repo';
import { FULL_PULL, INCREMENTAL_PULL, PUSH_ORDER, toServerRow, type TableName } from './schema';
import { blobPending, uploadPendingBlobs, UploadNetworkError } from './photos';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'signed_out';

export interface RejectedRow {
  table: TableName;
  id: string;
  message: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  clockSkewSec: number | null;
  phase: string | null;
}

const PAGE = 1000;
const PUSH_CHUNK = 200;
const OVERLAP_MS = 2 * 60 * 1000;

let state: SyncState = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle',
  lastSyncAt: null,
  lastError: null,
  clockSkewSec: null,
  phase: null,
};
const subs = new Set<() => void>();
function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}
export const syncStore = {
  get: () => state,
  subscribe: (f: () => void) => {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

class RetryableError extends Error {}

function isNetworkError(e: unknown): boolean {
  const msg = String((e as any)?.message ?? e);
  return /Failed to fetch|NetworkError|Load failed|fetch failed|ERR_INTERNET|ECONNREFUSED|timeout/i.test(msg);
}

/** رسالة عربية واضحة لسبب رفض السيرفر */
export function explainError(err: PostgrestError | null | undefined): string {
  if (!err) return 'خطأ غير معروف';
  switch (err.code) {
    case '23505':
      return 'سجل مكرر: تم تسجيل نفس البيانات من جهاز آخر (مثلًا نفس النبات في نفس الأسبوع)';
    case '23514':
      return 'قيمة خارج النطاق المسموح به';
    case '23503':
      return 'سجل مرتبط بعنصر غير موجود على السيرفر بعد';
    case '42501':
      return 'ليس لديك صلاحية لهذا التعديل';
    case '23502':
      return 'حقل مطلوب ناقص';
    default:
      return err.message || 'رفض السيرفر السجل';
  }
}

const isTransient = (err: PostgrestError | null) =>
  !err || !err.code || err.code === '23503' || err.code === 'PGRST301' || /^5|^08|^57/.test(err.code);

// ── PUSH ────────────────────────────────────────────────────────────────
async function pushTable(table: TableName): Promise<number> {
  const t = db.tableOf(table);
  let dirty: any[] = (await t.where('_dirty').equals(1).toArray()).filter((r) => !r._error);
  if (table === 'attachments' && dirty.length) {
    // الصورة نفسها تترفع الأول، وسجلها يستنى لحد ما ملفها يوصل
    try {
      await uploadPendingBlobs();
    } catch (e) {
      if (e instanceof UploadNetworkError) throw new RetryableError(e.message);
      throw e;
    }
    const waiting = await blobPending(dirty.map((r) => r.id));
    dirty = dirty.filter((r) => !waiting.has(r.id));
    dirty = (await t.bulkGet(dirty.map((r) => r.id))).filter((r: any) => r && r._dirty && !r._error);
  }
  let pushed = 0;
  for (let i = 0; i < dirty.length; i += PUSH_CHUNK) {
    const chunk = dirty.slice(i, i + PUSH_CHUNK);
    const { error, status } = await supabase
      .from(table as any)
      .upsert(chunk.map((r) => toServerRow(table, r)) as any, { onConflict: 'id' });
    if (!error) {
      await markClean(table, chunk);
      pushed += chunk.length;
      continue;
    }
    if (isNetworkError(error) || status >= 500 || status === 0) throw new RetryableError(error.message);
    // عزل السجل المرفوض
    for (const r of chunk) {
      const { error: e1, status: s1 } = await supabase.from(table as any).upsert(toServerRow(table, r) as any, { onConflict: 'id' });
      if (!e1) {
        await markClean(table, [r]);
        pushed++;
      } else if (isNetworkError(e1) || s1 >= 500 || s1 === 0) {
        throw new RetryableError(e1.message);
      } else if (!isTransient(e1)) {
        await t.update(r.id, { _error: explainError(e1) });
      }
      // أخطاء مؤقتة (مثل الأب لم يُرفع بعد): يبقى السجل معلّقًا ويُعاد في المزامنة التالية
    }
  }
  return pushed;
}

async function markClean(table: TableName, rows: any[]) {
  const t = db.tableOf(table);
  await db.transaction('rw', t, async () => {
    for (const r of rows) {
      const cur = await t.get(r.id);
      // لو اتعدّل أثناء الرفع، يفضل dirty عشان التعديل الأحدث يترفع
      if (cur && cur._rev === r._rev) await t.update(r.id, { _dirty: 0, _error: null });
    }
  });
}

// ── PULL ────────────────────────────────────────────────────────────────
async function pullIncremental(table: TableName): Promise<number> {
  const cursorKey = `cursor:${table}`;
  const cursor = await getMeta<string | null>(cursorKey, null);
  const since = cursor ? new Date(Date.parse(cursor) - OVERLAP_MS).toISOString() : null;
  let maxSeen = cursor;
  let total = 0;
  let lastTs: string | null = since;
  let lastId: string | null = null; // بعد أول صفحة يصبح المؤشر (وقت, id)

  // ترقيم بالمؤشر (keyset) على (server_updated_at, id) — ثابت حتى مع الصفحات الكبيرة
  for (;;) {
    let q = supabase.from(table as any).select('*').order('server_updated_at').order('id').limit(PAGE);
    if (lastTs && lastId) {
      q = q.or(`server_updated_at.gt."${lastTs}",and(server_updated_at.eq."${lastTs}",id.gt.${lastId})`);
    } else if (lastTs) {
      q = q.gt('server_updated_at', lastTs);
    }
    const { data, error, status } = await q;
    if (error) {
      if (isNetworkError(error) || status >= 500 || status === 0) throw new RetryableError(error.message);
      throw new Error(`${table}: ${error.message}`);
    }
    const rows = (data ?? []) as any[];
    if (!rows.length) break;
    await applyServerRows(table, rows);
    total += rows.length;
    const last = rows[rows.length - 1];
    lastTs = last.server_updated_at;
    lastId = last.id;
    if (!maxSeen || last.server_updated_at > maxSeen) maxSeen = last.server_updated_at;
    if (rows.length < PAGE) break;
  }
  if (maxSeen && maxSeen !== cursor) await setMeta(cursorKey, maxSeen);
  return total;
}

async function applyServerRows(table: TableName, rows: any[]) {
  const t = db.tableOf(table);
  await db.transaction('rw', t, async () => {
    const existing = await t.bulkGet(rows.map((r) => r.id));
    const toPut: any[] = [];
    rows.forEach((r, i) => {
      const local = existing[i];
      if (local?._dirty) return; // التعديل المحلي له الأولوية لحين رفعه
      toPut.push(derive(table, { ...r, _dirty: 0, _rev: local?._rev ?? 0, _error: null }));
    });
    if (toPut.length) await t.bulkPut(toPut);
  });
}

async function pullFull(table: TableName): Promise<number> {
  const { data, error, status } = await supabase.from(table as any).select('*').limit(10000);
  if (error) {
    if (isNetworkError(error) || status >= 500 || status === 0) throw new RetryableError(error.message);
    throw new Error(`${table}: ${error.message}`);
  }
  const t = db.tableOf(table);
  await db.transaction('rw', t, async () => {
    await t.clear();
    await t.bulkPut((data ?? []) as any[]);
  });
  return data?.length ?? 0;
}

async function checkClock() {
  const before = Date.now();
  const { data, error } = await supabase.rpc('server_now');
  if (error || !data) return;
  const mid = before + (Date.now() - before) / 2;
  set({ clockSkewSec: Math.round((mid - Date.parse(data as string)) / 1000) });
}

// ── ORCHESTRATION ───────────────────────────────────────────────────────
let running: Promise<void> | null = null;
let again = false;
// إعادة محاولة تلقائية متدرجة بعد فشل مؤقت (سيرفر مشغول / شبكة ضعيفة داخل الصوبة)
const BACKOFF = [3_000, 10_000, 30_000, 60_000];
let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await runOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function runOnce() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    set({ status: 'offline', phase: null });
    return;
  }
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) {
    set({ status: 'signed_out', phase: null });
    return;
  }
  set({ status: 'syncing', lastError: null });
  try {
    set({ phase: 'رفع التعديلات' });
    for (const table of PUSH_ORDER) await pushTable(table);
    set({ phase: 'تحديث البيانات' });
    for (const table of FULL_PULL) await pullFull(table);
    for (const table of INCREMENTAL_PULL) await pullIncremental(table);
    await checkClock();
    const now = new Date().toISOString();
    await setMeta('lastSyncAt', now);
    failures = 0;
    clearTimeout(retryTimer);
    set({ status: 'idle', lastSyncAt: now, phase: null });
  } catch (e) {
    const transient = e instanceof RetryableError || isNetworkError(e);
    const deviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    set({
      status: deviceOffline ? 'offline' : 'error',
      lastError: transient
        ? deviceOffline ? null : 'تعذر الوصول للسيرفر (الشبكة ضعيفة أو السيرفر مشغول). ستتم إعادة المحاولة تلقائيًا.'
        : String((e as Error).message ?? e),
      phase: null,
    });
    if (transient && !deviceOffline) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => void syncNow(), BACKOFF[Math.min(failures, BACKOFF.length - 1)]);
      failures++;
    }
  }
}

/** يشغّل المزامنة التلقائية: عند فتح التطبيق، رجوع الإنترنت، بعد أي تعديل، وكل دقيقة */
export function startAutoSync(): () => void {
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const kick = (delay = 0) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), delay);
  };
  const onOnline = () => kick(500);
  const onOffline = () => set({ status: 'offline' });
  const onVisible = () => document.visibilityState === 'visible' && kick(300);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisible);
  const offWrite = onLocalWrite(() => kick(2500));
  const interval = setInterval(() => kick(0), 60_000);
  void getMeta<string | null>('lastSyncAt', null).then((v) => set({ lastSyncAt: v }));
  kick(0);
  return () => {
    clearTimeout(debounce);
    clearInterval(interval);
    offWrite();
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/** عدد السجلات المعلّقة والمرفوضة — للعرض */
export async function pendingSummary(): Promise<{ pending: number; rejected: RejectedRow[] }> {
  let pending = 0;
  const rejected: RejectedRow[] = [];
  for (const table of PUSH_ORDER) {
    const rows: any[] = await db.tableOf(table).where('_dirty').equals(1).toArray();
    for (const r of rows) {
      if (r._error) rejected.push({ table, id: r.id, message: r._error });
      else pending++;
    }
  }
  return { pending, rejected };
}

/** إلغاء تعديل محلي مرفوض والرجوع لنسخة السيرفر في المزامنة التالية */
export async function discardRejected(table: TableName, id: string) {
  const t = db.tableOf(table);
  const r = await t.get(id);
  if (!r) return;
  if (table === 'attachments') await db.blobs.delete(id);
  if (!r.server_updated_at) await t.delete(id);
  else {
    await t.update(id, { _dirty: 0, _error: null });
    await setMeta(`cursor:${table}`, null);
  }
}
