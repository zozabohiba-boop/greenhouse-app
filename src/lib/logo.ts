/** يحوّل صورة اللوجو المرفوعة إلى data URL صغير (حد أقصى 320px، يحافظ على الشفافية) */
const MAX = 320;
const LIMIT = 150_000;

export async function fileToLogo(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('الملف مش صورة');
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const k = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  let out = c.toDataURL('image/png');
  if (out.length > LIMIT) out = c.toDataURL('image/webp', 0.88);
  if (out.length > LIMIT) throw new Error('اللوجو تقيل — استخدم صورة أبسط');
  return out;
}
