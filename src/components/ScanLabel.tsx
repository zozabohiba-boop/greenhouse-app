// تصوير عبوة المادة: صور واضحة من أكثر من زاوية ← قراءة على الجهاز ← مراجعة المهندس ← تعبئة النموذج
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { useRegistry } from '../lib/catalog';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { prepare, type Quality } from '../lib/scan/image';
import { readImage, stopOcr, warmOcrCache, type Pass } from '../lib/scan/ocr';
import { buildScan, loadBook, FIELD_LABEL, type BookIndex, type ScanFields, type ScanResult } from '../lib/scan/match';
import { DOSE_UNIT_LABEL, PRODUCT_TYPE_LABEL } from '../lib/labels';

interface Shot {
  id: string;
  label: string;
  hint: string;
  previewUrl?: string;
  ocrBlob?: Blob;
  quality?: Quality;
  busy?: boolean;
  text?: string;
  error?: string;
}

const SLOTS: Pick<Shot, 'label' | 'hint'>[] = [
  { label: 'الوجه الأمامي', hint: 'الاسم التجاري والتركيز ونوع المستحضر' },
  { label: 'الوجه الخلفي', hint: 'المادة الفعالة ورقم التسجيل والجرعات والشركة' },
  { label: 'جانب أو ملصق آخر', hint: 'أي جانب فيه كتابة، أو الغطاء' },
];
const MAX_SHOTS = 6;
let seq = 0;
const newShot = (i: number): Shot => ({ id: `s${++seq}`, ...(SLOTS[i] ?? { label: `زاوية إضافية ${i - SLOTS.length + 1}`, hint: 'لفّ العبوة وصوّر الجزء اللي فيه كتابة' }) });

const VERDICT = { good: { cls: 'ok', text: 'واضحة' }, warn: { cls: 'warn', text: 'مقبولة — راجع الملاحظات' }, bad: { cls: 'bad', text: 'غير واضحة — أعد التصوير' } } as const;
const SRC_LABEL = { label: 'من العبوة', book: 'من كتاب التوصيات', registry: 'من سجل المواد' } as const;

function valueText(k: keyof ScanFields, v: unknown): string {
  if (k === 'product_type') return PRODUCT_TYPE_LABEL[v as keyof typeof PRODUCT_TYPE_LABEL] ?? String(v);
  if (k === 'default_dose_unit') return DOSE_UNIT_LABEL[v as keyof typeof DOSE_UNIT_LABEL] ?? String(v);
  if (k === 'phi_days') return `${v} يوم`;
  if (k === 'is_bio') return 'نعم';
  return String(v);
}

export function ScanLabel({ farmId, onApply, onClose }: { farmId: string; onApply: (f: ScanFields) => void; onClose: () => void }) {
  const reg = useRegistry(farmId);
  const existing = useLiveQuery(async () => (await db.products.toArray()).filter((p) => alive(p) && (p.farm_id == null || p.farm_id === farmId)), [farmId]);
  const [shots, setShots] = useState<Shot[]>(() => SLOTS.map((_, i) => newShot(i)));
  const [stage, setStage] = useState<'capture' | 'reading' | 'review'>('capture');
  const [progress, setProgress] = useState<{ i: number; n: number; p: number; status: string } | null>(null);
  const [book, setBook] = useState<BookIndex | null>(null);
  const [chosenReg, setChosenReg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deep, setDeep] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const cancelled = useRef(false);

  useEffect(() => { void warmOcrCache(); void loadBook().then(setBook).catch(() => setBook(null)); }, []);
  useEffect(() => () => { cancelled.current = true; void stopOcr(); shots.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id: string, p: Partial<Shot>) => setShots((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function pick(id: string, file: File | undefined) {
    if (!file) return;
    patch(id, { busy: true, error: undefined });
    try {
      const prev = shots.find((x) => x.id === id)?.previewUrl;
      const p = await prepare(file);
      if (prev) URL.revokeObjectURL(prev);
      patch(id, { busy: false, previewUrl: p.previewUrl, ocrBlob: p.ocrBlob, quality: p.quality, text: undefined });
    } catch {
      patch(id, { busy: false, error: 'تعذّر فتح الصورة — جرّب صورة أخرى' });
    }
  }

  const ready = shots.filter((s) => s.ocrBlob);
  const anyBad = ready.some((s) => s.quality?.verdict === 'bad');

  async function run(pass: Pass) {
    setErr(null); setStage('reading'); setDeep(pass === 'deep');
    cancelled.current = false;
    try {
      const todo = ready;
      for (let i = 0; i < todo.length; i++) {
        if (cancelled.current) return;
        setProgress({ i: i + 1, n: todo.length, p: 0, status: 'loading' });
        const text = await readImage(todo[i].ocrBlob!, pass, (p, status) => setProgress({ i: i + 1, n: todo.length, p, status }));
        setShots((xs) => xs.map((x) => (x.id === todo[i].id ? { ...x, text: pass === 'deep' ? `${x.text ?? ''}\n${text}` : text } : x)));
      }
      setStage('review');
    } catch {
      setErr('تعذّرت القراءة. أول مرة لازم يكون فيه إنترنت لتحميل ملفات القراءة (حوالي 10 ميجا)، وبعدها تشتغل بدون إنترنت. جرّب تاني.');
      setStage('capture');
    } finally { setProgress(null); }
  }

  const result: ScanResult | null = useMemo(() => {
    if (stage !== 'review' || !reg) return null;
    return buildScan({ texts: shots.map((s) => s.text ?? '').filter(Boolean), book, substances: reg.substances, chosenReg, existing: existing ?? [] });
  }, [stage, shots, reg, book, chosenReg, existing]);

  const entries = result ? (Object.keys(result.fields) as (keyof ScanFields)[]).filter((k) => k !== 'notes') : [];
  const rawText = shots.map((s) => (s.text ? `— ${s.label}\n${s.text.trim()}` : '')).filter(Boolean).join('\n\n');

  return (
    <Sheet title="تصوير العبوة" onClose={onClose}>
      {stage === 'capture' && (
        <>
          <div className="banner info scan-tips">
            <Icon name="info" size={20} />
            <div>
              <b>صوّر العبوة بوضوح ومن أكتر من زاوية</b>
              <ul>
                <li>صوّر الوجه الأمامي، وبعده الخلفي، وأي جانب فيه كتابة — كل صورة تكمّل التانية.</li>
                <li>الضوء: نهار أو إضاءة قوية. ابعد عن الفلاش والانعكاس اللامع، وماتخليش ظل إيدك على العبوة.</li>
                <li>قرّب لحد ما الكتابة تملا معظم الصورة، وخلّي الكاميرا في مواجهة الملصق (مش مايلة).</li>
                <li>ثبّت الموبايل واستنى الفوكس يضبط قبل ما تصوّر.</li>
                <li>الزجاجة المقوسة: صوّرها على أكتر من جانب وأنت بتلفّها شوية، بدل صورة واحدة بتقطع الكلام.</li>
              </ul>
            </div>
          </div>
          <div className="scan-slots">
            {shots.map((s, i) => (
              <div key={s.id} className={`scan-slot ${s.quality?.verdict ?? ''}`}>
                <button type="button" className="scan-thumb" onClick={() => inputs.current[s.id]?.click()} aria-label={`تصوير ${s.label}`}>
                  {s.previewUrl ? <img src={s.previewUrl} alt={s.label} /> : <><Icon name="camera" size={26} /><span>صوّر</span></>}
                  {s.busy && <span className="scan-busy">جارٍ التجهيز…</span>}
                </button>
                <input ref={(el) => { inputs.current[s.id] = el; }} type="file" accept="image/*" capture="environment" hidden
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void pick(s.id, f); }} />
                <div className="scan-slot-body">
                  <b>{i + 1}. {s.label}</b>
                  <small className="muted">{s.hint}</small>
                  {s.quality && (
                    <>
                      <span className={`chip ${VERDICT[s.quality.verdict].cls}`}>{VERDICT[s.quality.verdict].text}</span>
                      {s.quality.issues.map((t) => <small key={t} className="scan-issue">{t}</small>)}
                    </>
                  )}
                  {s.error && <small className="scan-issue">{s.error}</small>}
                  <div className="scan-slot-actions">
                    <button type="button" className="btn sm" onClick={() => inputs.current[s.id]?.click()}>{s.previewUrl ? 'إعادة التصوير' : 'تصوير / اختيار صورة'}</button>
                    {(s.previewUrl || i >= SLOTS.length) && (
                      <button type="button" className="btn sm" onClick={() => {
                        if (i >= SLOTS.length) setShots((xs) => xs.filter((x) => x.id !== s.id));
                        else { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); patch(s.id, { previewUrl: undefined, ocrBlob: undefined, quality: undefined, text: undefined }); }
                      }}>حذف</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {shots.length < MAX_SHOTS && (
            <button type="button" className="btn" onClick={() => setShots((xs) => [...xs, newShot(xs.length)])}><Icon name="plus" /> زاوية إضافية</button>
          )}
          {anyBad && <p className="banner warn" style={{ marginTop: 12 }}>فيه صورة غير واضحة — القراءة منها هتكون ضعيفة. الأفضل تعيد تصويرها.</p>}
          {err && <p className="form-error">{err}</p>}
          <p className="muted scan-note">القراءة بتتم على جهازك والصور مابتتبعتش لأي مكان. أول مرة بس محتاجة إنترنت لتحميل ملفات القراءة.</p>
          <div className="form-actions">
            <button className="btn primary" type="button" disabled={!ready.length} onClick={() => void run('fast')}><Icon name="search" /> قراءة البيانات ({ready.length} {ready.length === 1 ? 'صورة' : 'صور'})</button>
            <button className="btn" type="button" onClick={onClose}>إلغاء</button>
          </div>
        </>
      )}

      {stage === 'reading' && (
        <div className="scan-progress" role="status" aria-live="polite">
          <b>{deep ? 'قراءة أعمق' : 'جارٍ قراءة العبوة'}… صورة {progress?.i ?? 1} من {progress?.n ?? ready.length}</b>
          <progress max={1} value={progress?.status === 'recognizing text' ? progress.p : undefined} />
          <small className="muted">{progress?.status === 'recognizing text' ? `${Math.round((progress.p ?? 0) * 100)}%` : 'تحميل ملفات القراءة (أول مرة بس)…'}</small>
          <button className="btn" type="button" onClick={() => { cancelled.current = true; void stopOcr(); setStage('capture'); }}>إيقاف</button>
        </div>
      )}

      {stage === 'review' && result && (
        <>
          <p className="banner info"><Icon name="info" size={18} /> راجع كل بيان قبل الاستخدام. القراءة الآلية ممكن تغلط خصوصًا على العبوات اللامعة، والمرجع النهائي ملصق العبوة.</p>
          {result.candidates.length > 0 && (
            <fieldset className="scan-cands">
              <legend>هل المنتج ده في كتاب التوصيات؟</legend>
              {result.candidates.map((c) => (
                <label key={c.product.reg + c.product.n} className="scan-cand">
                  <input type="radio" name="cand" checked={result.chosen?.product.reg === c.product.reg} onChange={() => setChosenReg(c.product.reg)} />
                  <span><b>{c.product.n}</b> — {c.product.c} {c.product.f} — {c.product.a}<small className="muted"> (تسجيل {c.product.reg}) · {c.why.join('، ')}</small></span>
                </label>
              ))}
              <label className="scan-cand">
                <input type="radio" name="cand" checked={!result.chosen} onChange={() => setChosenReg('')} />
                <span>ولا واحد منهم — استخدم المقروء من العبوة بس</span>
              </label>
            </fieldset>
          )}
          {entries.length ? (
            <table className="scan-table">
              <tbody>
                {entries.map((k) => (
                  <tr key={k}>
                    <th>{FIELD_LABEL[k]}</th>
                    <td><bdi>{valueText(k, result.fields[k])}</bdi></td>
                    <td><span className={`chip ${result.sources[k] === 'label' ? 'ok' : 'info'}`}>{SRC_LABEL[result.sources[k] ?? 'label']}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="banner warn">ماقدرتش أقرأ بيانات واضحة من الصور.</p>}
          {result.warnings.map((w) => <p key={w} className="banner warn">{w}</p>)}
          {result.missing.length > 0 && <p className="muted">لم تُقرأ: {result.missing.join('، ')} — أكملها يدويًا.</p>}
          <details className="scan-raw">
            <summary>النص اللي اتقرا من الصور</summary>
            <pre dir="auto">{rawText || '—'}</pre>
          </details>
          <div className="form-actions">
            <button className="btn primary" type="button" disabled={!entries.length} onClick={() => onApply(result.fields)}><Icon name="check" /> استخدم البيانات في النموذج</button>
            {!deep && <button className="btn" type="button" onClick={() => void run('deep')}>قراءة أعمق (أبطأ)</button>}
            <button className="btn" type="button" onClick={() => setStage('capture')}>إعادة التصوير</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
