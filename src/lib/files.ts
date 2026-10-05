// ملفات الموقع (تقارير، تحاليل، برامج، عروض): تُحفظ على الجهاز فورًا وتُرفع
// لـ bucket farm-files في المزامنة التالية قبل سجلها — نفس منطق صور الإصابات.

import { db } from './db';
import { supabase } from './supabase';
import { create, softDelete } from './repo';
import { uuid } from './ids';
import type { Row } from './schema';

export const FILES_BUCKET = 'farm-files';
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type DocCategory = Row<'documents'>['category'];

export const DOC_CATEGORIES: { v: string; label: string }[] = [
  { v: 'visit_report', label: 'تقرير زيارة' },
  { v: 'soil_analysis', label: 'تحليل تربة' },
  { v: 'water_analysis', label: 'تحليل مياه' },
  { v: 'plant_analysis', label: 'تحليل نبات / أوراق' },
  { v: 'fertigation_program', label: 'برنامج تسميد' },
  { v: 'spray_program', label: 'برنامج مكافحة' },
  { v: 'climate', label: 'مناخ وطقس' },
  { v: 'drawing', label: 'رسم / خريطة' },
  { v: 'presentation', label: 'عرض تقديمي' },
  { v: 'contract', label: 'عقد / مستند إداري' },
  { v: 'other', label: 'أخرى' },
];
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(DOC_CATEGORIES.map((c) => [c.v, c.label]));

/** الامتدادات المسموحة ونوع كل منها — نعتمد على الامتداد لأن بعض الأجهزة لا ترسل نوع ملفات Office */
export const FILE_TYPES: Record<string, { mime: string; kind: string; label: string }> = {
  pdf: { mime: 'application/pdf', kind: 'pdf', label: 'PDF' },
  doc: { mime: 'application/msword', kind: 'word', label: 'Word' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind: 'word', label: 'Word' },
  xls: { mime: 'application/vnd.ms-excel', kind: 'excel', label: 'Excel' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', kind: 'excel', label: 'Excel' },
  csv: { mime: 'text/csv', kind: 'excel', label: 'CSV' },
  ppt: { mime: 'application/vnd.ms-powerpoint', kind: 'ppt', label: 'PowerPoint' },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', kind: 'ppt', label: 'PowerPoint' },
  txt: { mime: 'text/plain', kind: 'text', label: 'نص' },
  jpg: { mime: 'image/jpeg', kind: 'image', label: 'صورة' },
  jpeg: { mime: 'image/jpeg', kind: 'image', label: 'صورة' },
  png: { mime: 'image/png', kind: 'image', label: 'صورة' },
  webp: { mime: 'image/webp', kind: 'image', label: 'صورة' },
  heic: { mime: 'image/heic', kind: 'image', label: 'صورة' },
};
export const ACCEPT = Object.keys(FILE_TYPES).map((e) => `.${e}`).join(',');

export function extOf(name: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

export function typeOf(name: string) {
  return FILE_TYPES[extOf(name)] ?? null;
}

/** عنوان مبدئي من اسم الملف: بدون الامتداد والشرطات */
export function titleFromName(name: string): string {
  return name.replace(/\.[A-Za-z0-9]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) || 'ملف';
}

export function formatSize(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلو`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} ميجا`;
}

/** يرجّع رسالة خطأ عربية لو الملف غير مقبول */
export function checkFile(file: { name: string; size: number }): string | null {
  if (!typeOf(file.name)) return `نوع الملف "${file.name}" غير مدعوم. المسموح: PDF، Word، Excel، PowerPoint، CSV، الصور`;
  if (file.size > MAX_FILE_BYTES) return `الملف "${file.name}" أكبر من 50 ميجا (${formatSize(file.size)})`;
  if (file.size === 0) return `الملف "${file.name}" فارغ`;
  return null;
}

export interface NewDoc {
  farmId: string;
  file: File;
  title: string;
  category: string;
  zoneId?: string | null;
  greenhouseId?: string | null;
  docDate?: string | null;
  notes?: string | null;
}

export async function addDocument(d: NewDoc): Promise<string> {
  const err = checkFile(d.file);
  if (err) throw new Error(err);
  const t = typeOf(d.file.name)!;
  const id = uuid();
  const ext = extOf(d.file.name);
  const path = `${d.farmId}/${new Date().getFullYear()}/${id}.${ext}`;
  await db.blobs.put({ id, path, blob: d.file, mime: t.mime, pending: 1, error: null, table: 'documents', bucket: FILES_BUCKET });
  await create('documents', {
    id, farm_id: d.farmId, zone_id: d.zoneId ?? null, greenhouse_id: d.greenhouseId ?? null,
    category: d.category as DocCategory, title: d.title.trim() || titleFromName(d.file.name), file_name: d.file.name,
    mime_type: t.mime, size_bytes: d.file.size, storage_path: path, doc_date: d.docDate || null, notes: d.notes?.trim() || null,
  });
  return id;
}

export async function removeDocument(id: string) {
  await softDelete('documents', id);
}

/** فتح/تنزيل الملف: من الجهاز لو لسه ما اترفعش، وإلا برابط مؤقت من السيرفر */
export async function openDocument(doc: Row<'documents'>): Promise<'ok' | 'offline' | 'error'> {
  const local = await db.blobs.get(doc.id);
  if (local) {
    const url = URL.createObjectURL(local.blob);
    triggerDownload(url, doc.file_name);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'ok';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
  const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(doc.storage_path, 3600, { download: doc.file_name });
  if (error || !data?.signedUrl) return 'error';
  triggerDownload(data.signedUrl, doc.file_name);
  return 'ok';
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
