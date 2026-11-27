// قراءة النص من الصور على الجهاز (Tesseract.js) — لا تُرسل الصور لأي خادم
import type { Worker } from 'tesseract.js';

/** مجلد ملفات القراءة المستضافة محليًا مع التطبيق (public/ocr) */
export function ocrBase(): string {
  return new URL('ocr/', document.baseURI).href;
}

/** تسخين الكاش: يحمّل ملفات القراءة (~10 ميجا) مرة واحدة ليعمل المسح بعدها بدون إنترنت */
export async function warmOcrCache(): Promise<boolean> {
  try {
    const base = ocrBase();
    const files = ['worker.min.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-lstm.wasm.js', 'ara.traineddata.gz', 'eng.traineddata.gz'];
    await Promise.all(files.map((f) => fetch(base + f).then((r) => r.ok)));
    return true;
  } catch { return false; }
}

let workerPromise: Promise<Worker> | null = null;
let onProgress: ((p: number, status: string) => void) | null = null;

async function getWorker(): Promise<Worker> {
  workerPromise ??= (async () => {
    const { createWorker } = await import('tesseract.js');
    const base = ocrBase();
    const w = await createWorker('ara+eng', 1, {
      workerPath: `${base}worker.min.js`,
      corePath: base,
      langPath: base,
      gzip: true,
      workerBlobURL: false,
      logger: (m: { progress: number; status: string }) => onProgress?.(m.progress, m.status),
    });
    return w;
  })();
  try { return await workerPromise; } catch (e) { workerPromise = null; throw e; }
}

export type Pass = 'fast' | 'deep';
/** psm 11 = نص متفرق (الأنسب للعبوات)؛ العميق يضيف مرور قراءة كتل (6) */
const PSM: Record<Pass, string[]> = { fast: ['11'], deep: ['6', '3'] };

export async function readImage(blob: Blob, pass: Pass, progress?: (p: number, status: string) => void): Promise<string> {
  onProgress = progress ?? null;
  const w = await getWorker();
  const texts: string[] = [];
  for (const psm of PSM[pass]) {
    await w.setParameters({ tessedit_pageseg_mode: psm as never, preserve_interword_spaces: '1' });
    const { data } = await w.recognize(blob);
    texts.push(data.text);
  }
  return texts.join('\n');
}

export async function stopOcr(): Promise<void> {
  const p = workerPromise;
  workerPromise = null;
  try { await (await p)?.terminate(); } catch { /* ignore */ }
}
