// صور الإصابات: تُضغط على التابلت وتُحفظ محليًا فورًا، وتُرفع لـ Supabase Storage
// في المزامنة التالية قبل سجل المرفق نفسه (فلا يظهر للآخرين سجل بلا صورة).

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { supabase } from './supabase';
import { alive, create, softDelete } from './repo';
import { uuid } from './ids';
import type { Row } from './schema';

const BUCKET = 'field-photos';
const MAX_SIDE = 1600;

type Entity = Row<'attachments'>['entity_table'];

/** تصغير الصورة لـ 1600 بكسل JPEG — صورة الكاميرا 4-8 ميجا تصبح ~250 كيلو */
export async function compressImage(file: Blob): Promise<{ blob: Blob; mime: string }> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
    if (blob) return { blob, mime: 'image/jpeg' };
  } catch {
    /* صيغة لا يفكها المتصفح (مثل HEIC) — تُحفظ كما هي */
  }
  return { blob: file, mime: file.type || 'image/jpeg' };
}

export async function addPhoto(farmId: string, entity_table: Entity, entity_id: string, file: Blob, caption?: string) {
  const { blob, mime } = await compressImage(file);
  const id = uuid();
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/heic' ? 'heic' : 'jpg';
  const path = `${farmId}/${new Date().getFullYear()}/${id}.${ext}`;
  await db.blobs.put({ id, path, blob, mime, pending: 1, error: null });
  await create('attachments', {
    id, farm_id: farmId, entity_table, entity_id, storage_path: path, mime_type: mime,
    caption: caption ?? null, taken_at: new Date().toISOString(),
  });
  return id;
}

export async function removePhoto(id: string) {
  await softDelete('attachments', id);
}

/** هل صورة المرفق لسه مستنية الرفع؟ (سجل المرفق لا يُرفع قبلها) */
export async function blobPending(ids: string[]): Promise<Set<string>> {
  const rows = await db.blobs.bulkGet(ids);
  return new Set(rows.filter((b) => b && b.pending === 1).map((b) => b!.id));
}

export class UploadNetworkError extends Error {}

/** رفع الملفات المعلّقة لجدول معيّن — يُستدعى من محرك المزامنة قبل رفع سجلات الجدول */
export async function uploadPendingBlobs(table: 'attachments' | 'documents' = 'attachments'): Promise<number> {
  const pending = (await db.blobs.where('pending').equals(1).toArray()).filter((b) => (b.table ?? 'attachments') === table);
  const what = table === 'documents' ? 'الملف' : 'الصورة';
  let n = 0;
  for (const b of pending) {
    if (b.error) continue;
    const rec = await db.tableOf(table).get(b.id);
    if (rec?.deleted_at) {
      // اتمسح قبل ما يترفع — لا داعي لرفعه
      await db.blobs.delete(b.id);
      continue;
    }
    let res;
    try {
      res = await supabase.storage.from(b.bucket ?? BUCKET).upload(b.path, b.blob, { contentType: b.mime, upsert: false });
    } catch (e) {
      throw new UploadNetworkError(String((e as Error).message ?? e));
    }
    const err = res.error as (Error & { statusCode?: string | number; status?: number }) | null;
    const code = String(err?.statusCode ?? err?.status ?? '');
    if (!err || code === '409' || /already exists|Duplicate/i.test(err.message)) {
      await db.blobs.update(b.id, { pending: 0, error: null });
      n++;
    } else if (/fetch|network|timeout/i.test(err.message) || code.startsWith('5') || code === '0' || code === '') {
      throw new UploadNetworkError(err.message);
    } else {
      const msg = code === '403' || /row-level|policy|Unauthorized/i.test(err.message)
        ? `تعذر رفع ${what}: ليس لديك صلاحية`
        : code === '413' || /too large|size|exceeded/i.test(err.message)
          ? `تعذر رفع ${what}: الحجم أكبر من المسموح (50 ميجا)`
          : /mime|type/i.test(err.message)
            ? `تعذر رفع ${what}: نوع الملف غير مسموح`
            : `تعذر رفع ${what}: ${err.message}`;
      await db.blobs.update(b.id, { error: msg });
      await db.tableOf(table).update(b.id, { _error: msg });
    }
  }
  return n;
}

// ── العرض ───────────────────────────────────────────────────────────
const signed = new Map<string, { url: string; exp: number }>();

async function urlFor(att: Row<'attachments'>): Promise<string | null> {
  const local = await db.blobs.get(att.id);
  if (local) return URL.createObjectURL(local.blob);
  const c = signed.get(att.storage_path);
  if (c && c.exp > Date.now()) return c.url;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(att.storage_path, 3600);
  if (!data?.signedUrl) return null;
  signed.set(att.storage_path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export interface PhotoView {
  id: string;
  url: string | null;
  caption: string | null;
  pending: boolean;
  created_by: string | null;
}

/** صور عنصر واحد (ملاحظة/معاملة...) — محلية فورًا، أو من السيرفر برابط مؤقت */
export function usePhotos(entity_table: Entity, entity_ids: string[]): Map<string, PhotoView[]> {
  const key = entity_ids.join(',');
  const atts = useLiveQuery(async () => {
    if (!entity_ids.length) return [];
    const rows = await db.attachments.where('[entity_table+entity_id]').anyOf(entity_ids.map((id) => [entity_table, id])).toArray();
    const live = rows.filter(alive);
    const pend = await blobPending(live.map((a) => a.id));
    return live.map((a) => ({ a, pending: pend.has(a.id) }));
  }, [entity_table, key]);
  const [urls, setUrls] = useState<Map<string, string | null>>(new Map());
  useEffect(() => {
    let off = false;
    const made: string[] = [];
    (async () => {
      const m = new Map<string, string | null>();
      for (const { a } of atts ?? []) {
        const u = await urlFor(a);
        if (u?.startsWith('blob:')) made.push(u);
        m.set(a.id, u);
      }
      if (!off) setUrls(m);
    })();
    return () => {
      off = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [atts]);
  const out = new Map<string, PhotoView[]>();
  for (const { a, pending } of atts ?? []) {
    const list = out.get(a.entity_id) ?? [];
    list.push({ id: a.id, url: urls.get(a.id) ?? null, caption: a.caption, pending, created_by: a.created_by });
    out.set(a.entity_id, list);
  }
  return out;
}
