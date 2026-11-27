// تجهيز صور العبوات: تقييم الجودة (وضوح/إضاءة/وهج/دقة) وتحسين التباين قبل القراءة
export interface Quality {
  width: number;
  height: number;
  sharpness: number;
  brightness: number;
  glare: number;
  verdict: 'good' | 'warn' | 'bad';
  issues: string[];
}

/** رمادي من RGBA */
export function toGray(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): Uint8Array {
  const g = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (rgba[j] * 299 + rgba[j + 1] * 587 + rgba[j + 2] * 114) / 1000;
  return g;
}

/** تباين لابلاس: كلما زاد كان النص أحَدّ */
export function laplacianVariance(g: Uint8Array, w: number, h: number): number {
  if (w < 3 || h < 3) return 0;
  let n = 0, sum = 0, sum2 = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      sum += v; sum2 += v * v; n++;
    }
  }
  const mean = sum / n;
  return sum2 / n - mean * mean;
}

export function brightnessStats(g: Uint8Array): { mean: number; glare: number } {
  let s = 0, hot = 0;
  for (let i = 0; i < g.length; i++) { s += g[i]; if (g[i] >= 250) hot++; }
  return { mean: s / g.length, glare: hot / g.length };
}

/** حكم الجودة (العتبات معايَرة على صور عبوات حقيقية: 727 / 370 / 172 جيدة، وتمويه 2px ≈ 56 ضبابية) */
export function assess(w: number, h: number, sharpness: number, mean: number, glare: number): Quality {
  const issues: string[] = [];
  let bad = false;
  if (sharpness < 40) { issues.push('الصورة مهزوزة أو خارج الفوكس — ثبّت الموبايل وانتظر الفوكس وأعد التصوير'); bad = true; }
  else if (sharpness < 100) issues.push('الصورة مش حادة كفاية — قرّب أكتر وثبّت إيدك');
  if (mean < 55) { issues.push('الإضاءة ضعيفة — صوّر في ضوء النهار أو تحت إضاءة قوية'); bad = true; }
  else if (mean > 215) issues.push('الصورة مضيئة زيادة — بعّد عن الفلاش أو الإضاءة المباشرة');
  if (glare > 0.03) issues.push('فيه وهج لامع على العبوة — غيّر الزاوية شوية عشان يختفي الانعكاس');
  if (Math.max(w, h) < 900) issues.push('الدقة قليلة — اقرب للعبوة أو استخدم الكاميرا الخلفية');
  return { width: w, height: h, sharpness: Math.round(sharpness), brightness: Math.round(mean), glare: Math.round(glare * 1000) / 10, verdict: bad ? 'bad' : issues.length ? 'warn' : 'good', issues };
}

/** تمديد التباين (1%–99%) ثم حدّة خفيفة (unsharp) لتحسين قراءة النص على الأسطح اللامعة */
export function enhance(g: Uint8Array, w: number, h: number): Uint8Array {
  const hist = new Uint32Array(256);
  for (let i = 0; i < g.length; i++) hist[g[i]]++;
  const total = g.length;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.01) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  const s = new Uint8Array(g.length);
  for (let i = 0; i < g.length; i++) s[i] = Math.max(0, Math.min(255, ((g[i] - lo) * 255) / span));
  // unsharp: blur 3x3 صندوقي، ثم s + 1.0*(s - blur)
  const out = new Uint8Array(g.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; sum += s[yy * w + xx]; c++; }
      }
      const i = y * w + x;
      out[i] = Math.max(0, Math.min(255, s[i] + (s[i] - sum / c)));
    }
  }
  return out;
}

export interface Prepared {
  /** الصورة الأصلية مصغّرة للعرض */
  previewUrl: string;
  /** الصورة المحسّنة للقراءة */
  ocrBlob: Blob;
  quality: Quality;
}

async function decode(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('تعذّر تجهيز الصورة'))), type, q));

/** يجهّز صورة: تقييم + نسخة محسّنة للقراءة (أطول ضلع 1800–2400) */
export async function prepare(file: Blob): Promise<Prepared> {
  const bmp = await decode(file);
  const { width: W, height: H } = bmp;
  // تقييم الوضوح على نسخة صغيرة (640)
  const ks = Math.min(1, 640 / Math.max(W, H));
  const sc = canvas(Math.max(8, Math.round(W * ks)), Math.max(8, Math.round(H * ks)));
  const sctx = sc.getContext('2d', { willReadFrequently: true })!;
  sctx.drawImage(bmp, 0, 0, sc.width, sc.height);
  const small = sctx.getImageData(0, 0, sc.width, sc.height);
  const sg = toGray(small.data, sc.width, sc.height);
  const sharp = laplacianVariance(sg, sc.width, sc.height);
  const { mean, glare } = brightnessStats(sg);
  const quality = assess(W, H, sharp, mean, glare);

  // نسخة القراءة: تكبير الصور الصغيرة حتى 1800 وتصغير الكبيرة حتى 2400
  const longest = Math.max(W, H);
  const target = longest < 1800 ? Math.min(longest * 2, 1800) : Math.min(longest, 2400);
  const k = target / longest;
  const ow = Math.round(W * k), oh = Math.round(H * k);
  const oc = canvas(ow, oh);
  const octx = oc.getContext('2d', { willReadFrequently: true })!;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(bmp, 0, 0, ow, oh);
  const img = octx.getImageData(0, 0, ow, oh);
  const g = enhance(toGray(img.data, ow, oh), ow, oh);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) { img.data[j] = img.data[j + 1] = img.data[j + 2] = g[i]; img.data[j + 3] = 255; }
  octx.putImageData(img, 0, 0);
  const ocrBlob = await toBlob(oc, 'image/png');

  const pk = Math.min(1, 480 / longest);
  const pc = canvas(Math.round(W * pk), Math.round(H * pk));
  pc.getContext('2d')!.drawImage(bmp, 0, 0, pc.width, pc.height);
  const previewUrl = URL.createObjectURL(await toBlob(pc, 'image/jpeg', 0.8));
  bmp.close?.();
  return { previewUrl, ocrBlob, quality };
}
