// الملفات والتقارير: رفع PDF / Word / Excel / PowerPoint وربطها بالموقع أو قطاع أو صوبة
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, update } from '../lib/repo';
import { formatDate, todayLocal } from '../lib/dates';
import { usePeople } from '../lib/hooks';
import {
  ACCEPT, CATEGORY_LABEL, checkFile, DOC_CATEGORIES, formatSize, addDocument, openDocument, removeDocument, titleFromName, typeOf,
} from '../lib/files';
import { descendants, flatTree, ghLabels, groupByZone, pathText, useZones, zoneTitle, type ZoneIndex } from '../lib/zones';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import type { Row } from '../lib/schema';

type Doc = Row<'documents'>;
type Gh = Row<'greenhouses'>;

function useDocs(farmId: string | null) {
  return useLiveQuery(async () => {
    if (!farmId) return undefined;
    const [docs, ghs, blobs] = await Promise.all([
      db.documents.where('farm_id').equals(farmId).toArray(),
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
      db.blobs.toArray(),
    ]);
    const pending = new Map(blobs.filter((b) => b.table === 'documents').map((b) => [b.id, b]));
    return {
      docs: docs.filter(alive).sort((a, b) => (b.doc_date ?? b.created_at).localeCompare(a.doc_date ?? a.created_at)),
      ghs: ghs.filter(alive),
      pending,
    };
  }, [farmId]);
}

/** قيمة قائمة المكان: '' كل الموقع | z:<id> مكان | g:<id> صوبة */
function placeOf(d: Pick<Doc, 'zone_id' | 'greenhouse_id'>): string {
  return d.greenhouse_id ? `g:${d.greenhouse_id}` : d.zone_id ? `z:${d.zone_id}` : '';
}

function PlaceSelect({ idx, ghs, value, onChange, allLabel }: { idx: ZoneIndex; ghs: Gh[]; value: string; onChange: (v: string) => void; allLabel: string }) {
  const labels = ghLabels(idx, ghs);
  const tree = flatTree(idx);
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {tree.length > 0 && (
        <optgroup label="الأماكن">
          {tree.map(({ z, depth }) => <option key={z.id} value={`z:${z.id}`}>{'— '.repeat(depth)}{zoneTitle(z)}</option>)}
        </optgroup>
      )}
      {groupByZone(idx, ghs).map((grp) => (
        <optgroup key={grp.zoneId} label={grp.zoneId ? `صوب ${grp.title}` : 'الصوب'}>
          {grp.items.map((g) => <option key={g.id} value={`g:${g.id}`}>صوبة {labels.get(g.id)}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function placeText(idx: ZoneIndex, ghs: Map<string, Gh>, labels: Map<string, string>, d: Doc): string {
  if (d.greenhouse_id) return `صوبة ${labels.get(d.greenhouse_id) ?? ghs.get(d.greenhouse_id)?.code ?? ''}`;
  if (d.zone_id) return pathText(idx, d.zone_id) || 'مكان محذوف';
  return 'الموقع كله';
}

function DocRow({ d, place, pending, error, who, onEdit }: { d: Doc; place: string; pending: boolean; error?: string | null; who?: string; onEdit?: () => void }) {
  const { toast } = useApp();
  const t = typeOf(d.file_name);
  return (
    <li className="doc">
      <span className="ftype" data-k={t?.kind ?? 'other'}>{t?.label ?? 'ملف'}</span>
      <span className="grow doc-body">
        <b>{d.title}</b>
        <span className="doc-meta">
          {[CATEGORY_LABEL[d.category], place, d.doc_date ? formatDate(d.doc_date) : null, formatSize(d.size_bytes), who].filter(Boolean).join('، ')}
        </span>
        {d.notes && <span className="doc-notes">{d.notes}</span>}
        {(error || (d as any)._error) ? <span className="chip bad">{error || (d as any)._error}</span> : pending ? <span className="chip warn"><Icon name="clock" size={14} /> في انتظار الرفع</span> : null}
      </span>
      <span className="doc-actions">
        <button className="iconbtn" aria-label={`فتح ${d.title}`} onClick={async () => {
          const r = await openDocument(d);
          if (r === 'offline') toast('فتح الملف يحتاج اتصال بالإنترنت');
          else if (r === 'error') toast('تعذر فتح الملف، حاول مرة أخرى');
        }}><Icon name="download" size={22} /></button>
        {onEdit && <button className="iconbtn" aria-label="تعديل بيانات الملف" onClick={onEdit}><Icon name="edit" size={20} /></button>}
      </span>
    </li>
  );
}

// ── شاشة الملفات ────────────────────────────────────────────────────
export function FilesHome() {
  const { farmId, can, user } = useApp();
  const [sp, setSp] = useSearchParams();
  const idx = useZones(farmId);
  const data = useDocs(farmId);
  const people = usePeople();
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [upload, setUpload] = useState(false);
  const [edit, setEdit] = useState<Doc | null>(null);
  const place = sp.get('p') ?? '';
  const setPlace = (v: string) => { const n = new URLSearchParams(sp); if (v) n.set('p', v); else n.delete('p'); setSp(n, { replace: true }); };

  const view = useMemo(() => {
    if (!data || !idx) return null;
    let docs = data.docs;
    if (place.startsWith('z:')) {
      const zs = descendants(idx, place.slice(2));
      const gIn = new Set(data.ghs.filter((g) => g.zone_id && zs.has(g.zone_id)).map((g) => g.id));
      docs = docs.filter((d) => (d.zone_id && zs.has(d.zone_id)) || (d.greenhouse_id && gIn.has(d.greenhouse_id)));
    } else if (place.startsWith('g:')) docs = docs.filter((d) => d.greenhouse_id === place.slice(2));
    const cats = new Map<string, number>();
    for (const d of docs) cats.set(d.category, (cats.get(d.category) ?? 0) + 1);
    if (cat) docs = docs.filter((d) => d.category === cat);
    const query = q.trim().toLowerCase();
    if (query) docs = docs.filter((d) => `${d.title} ${d.file_name} ${d.notes ?? ''}`.toLowerCase().includes(query));
    return { docs, cats };
  }, [data, idx, place, cat, q]);

  if (!data || !idx || !view) return null;
  const ghMap = new Map(data.ghs.map((g) => [g.id, g]));
  const labels = ghLabels(idx, data.ghs);

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>الملفات والتقارير</h1><p>تقارير الزيارات، التحاليل، برامج التسميد والمكافحة، والعروض</p></div>
        {can.record && <button className="btn primary" onClick={() => setUpload(true)}><Icon name="upload" size={20} /> رفع ملف</button>}
      </div>

      <div className="panel panel-pad form files-filter">
        <div className="form-grid">
          <Field label="المكان"><PlaceSelect idx={idx} ghs={data.ghs} value={place} onChange={setPlace} allLabel="كل الملفات" /></Field>
          <Field label="بحث"><input className="input" inputMode="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="العنوان أو اسم الملف" /></Field>
        </div>
        {view.cats.size > 1 && (
          <div className="chips-pick" role="group" aria-label="النوع">
            <button type="button" aria-pressed={!cat} onClick={() => setCat('')}>الكل</button>
            {DOC_CATEGORIES.filter((c) => view.cats.has(c.v)).map((c) => (
              <button type="button" key={c.v} aria-pressed={cat === c.v} onClick={() => setCat(cat === c.v ? '' : c.v)}>{c.label} ({view.cats.get(c.v)})</button>
            ))}
          </div>
        )}
      </div>

      {view.docs.length === 0 ? (
        <div className="panel empty">
          <h3>{data.docs.length ? 'لا توجد ملفات بهذا التصفية' : 'لا توجد ملفات بعد'}</h3>
          <p>ارفع تقارير الزيارات والتحاليل وبرامج التسميد هنا، وتكون متاحة لكل الفريق.</p>
          {can.record && !data.docs.length && <button className="btn primary" onClick={() => setUpload(true)}><Icon name="upload" size={20} /> رفع أول ملف</button>}
        </div>
      ) : (
        <ul className="list panel docs">
          {view.docs.map((d) => {
            const b = data.pending.get(d.id);
            return (
              <DocRow key={d.id} d={d} place={placeText(idx, ghMap, labels, d)} pending={b?.pending === 1} error={b?.error}
                who={d.created_by ? people.get(d.created_by) : undefined}
                onEdit={can.record && (d.created_by === user?.id || can.supervise) ? () => setEdit(d) : undefined} />
            );
          })}
        </ul>
      )}
      {upload && <UploadSheet idx={idx} ghs={data.ghs} place0={place} onClose={() => setUpload(false)} />}
      {edit && <EditDocSheet idx={idx} ghs={data.ghs} doc={edit} onClose={() => setEdit(null)} />}
    </main>
  );
}

// ── رفع ملف ─────────────────────────────────────────────────────────
export function UploadSheet({ idx, ghs, place0, onClose }: { idx: ZoneIndex; ghs: Gh[]; place0: string; onClose: () => void }) {
  const { farmId, toast } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ file: File; title: string }[]>([]);
  const [category, setCategory] = useState('visit_report');
  const [place, setPlace] = useState(place0);
  const [date, setDate] = useState(todayLocal());
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(list: File[]) {
    const bad = list.map(checkFile).filter(Boolean);
    setErr(bad.length ? bad.join('\n') : null);
    const ok = list.filter((f) => !checkFile(f));
    setFiles((cur) => [...cur, ...ok.map((file) => ({ file, title: titleFromName(file.name) }))]);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!files.length) return setErr('اختر ملفًا أولًا');
    setBusy(true);
    try {
      for (const f of files) {
        await addDocument({
          farmId: farmId!, file: f.file, title: f.title, category,
          zoneId: place.startsWith('z:') ? place.slice(2) : null,
          greenhouseId: place.startsWith('g:') ? place.slice(2) : null,
          docDate: date || null, notes,
        });
      }
      toast(navigator.onLine ? `تم حفظ ${files.length > 1 ? `${files.length} ملفات` : 'الملف'} — جاري الرفع` : 'تم الحفظ على الجهاز وسيُرفع عند الاتصال');
      onClose();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  return (
    <Sheet title="رفع ملف" onClose={onClose}>
      <form className="form" onSubmit={save}>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { const l = [...(e.target.files ?? [])]; e.target.value = ''; if (l.length) pick(l); }} />
        <button type="button" className="drop" onClick={() => input.current?.click()}>
          <Icon name="upload" size={28} />
          <b>{files.length ? 'إضافة ملف آخر' : 'اختر الملف من الجهاز'}</b>
          <small>PDF، Word، Excel، PowerPoint، CSV، صور — حتى 50 ميجا للملف</small>
        </button>
        {files.map((f, i) => (
          <div key={i} className="upload-item">
            <span className="ftype" data-k={typeOf(f.file.name)?.kind}>{typeOf(f.file.name)?.label}</span>
            <Field label={`عنوان الملف (${formatSize(f.file.size)})`}>
              <input className="input" value={f.title} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            </Field>
            <button type="button" className="iconbtn" aria-label="إزالة" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="close" size={20} /></button>
          </div>
        ))}
        <div className="form-grid">
          <Field label="النوع">
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {DOC_CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="يخص"><PlaceSelect idx={idx} ghs={ghs} value={place} onChange={setPlace} allLabel="الموقع كله" /></Field>
          <Field label="تاريخ المستند"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="ملاحظات"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
        {err && <p className="form-error" role="alert" style={{ whiteSpace: 'pre-line' }}>{err}</p>}
        <div className="form-actions">
          <button className="btn primary" disabled={busy || !files.length}>{busy ? 'جاري الحفظ…' : 'حفظ ورفع'}</button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Sheet>
  );
}

function EditDocSheet({ idx, ghs, doc, onClose }: { idx: ZoneIndex; ghs: Gh[]; doc: Doc; onClose: () => void }) {
  const { toast } = useApp();
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState<string>(doc.category);
  const [place, setPlace] = useState(placeOf(doc));
  const [date, setDate] = useState(doc.doc_date ?? '');
  const [notes, setNotes] = useState(doc.notes ?? '');
  const [del, setDel] = useState(false);
  return (
    <Sheet title="بيانات الملف" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await update('documents', doc.id, {
          title: title.trim(), category: category as Doc['category'], doc_date: date || null, notes: notes.trim() || null,
          zone_id: place.startsWith('z:') ? place.slice(2) : null, greenhouse_id: place.startsWith('g:') ? place.slice(2) : null,
        });
        toast('تم الحفظ');
        onClose();
      }}>
        <p className="muted num" style={{ direction: 'ltr' }}>{doc.file_name}</p>
        <Field label="العنوان"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <div className="form-grid">
          <Field label="النوع">
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {DOC_CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="يخص"><PlaceSelect idx={idx} ghs={ghs} value={place} onChange={setPlace} allLabel="الموقع كله" /></Field>
          <Field label="تاريخ المستند"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="ملاحظات"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
        <div className="form-actions">
          <button className="btn primary">حفظ</button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
          {del
            ? <button type="button" className="btn danger" onClick={async () => { await removeDocument(doc.id); toast('تم حذف الملف'); onClose(); }}>تأكيد الحذف</button>
            : <button type="button" className="btn danger" onClick={() => setDel(true)}>حذف الملف</button>}
        </div>
      </form>
    </Sheet>
  );
}

/** قسم ملفات مختصر داخل صفحة صوبة أو مكان */
export function DocSection({ greenhouseId, zoneId }: { greenhouseId?: string; zoneId?: string }) {
  const { farmId, can, user } = useApp();
  const idx = useZones(farmId);
  const data = useDocs(farmId);
  const people = usePeople();
  const [upload, setUpload] = useState(false);
  const [edit, setEdit] = useState<Doc | null>(null);
  if (!data || !idx) return null;
  const docs = data.docs.filter((d) => (greenhouseId ? d.greenhouse_id === greenhouseId : d.zone_id === zoneId));
  const place = greenhouseId ? `g:${greenhouseId}` : zoneId ? `z:${zoneId}` : '';
  const ghMap = new Map(data.ghs.map((g) => [g.id, g]));
  const labels = ghLabels(idx, data.ghs);
  return (
    <>
      <h2 className="section-title">
        <span>الملفات والتقارير</span>
        <span className="row">
          {docs.length > 5 && <Link className="btn" to={`/files?p=${place}`}>كل الملفات ({docs.length})</Link>}
          {can.record && <button className="btn" onClick={() => setUpload(true)}><Icon name="upload" size={20} /> رفع ملف</button>}
        </span>
      </h2>
      {docs.length === 0 ? (
        <p className="muted">لا توجد ملفات مرتبطة هنا.</p>
      ) : (
        <ul className="list panel docs">
          {docs.slice(0, 5).map((d) => {
            const b = data.pending.get(d.id);
            return (
              <DocRow key={d.id} d={d} place={placeText(idx, ghMap, labels, d)} pending={b?.pending === 1} error={b?.error}
                who={d.created_by ? people.get(d.created_by) : undefined}
                onEdit={can.record && (d.created_by === user?.id || can.supervise) ? () => setEdit(d) : undefined} />
            );
          })}
        </ul>
      )}
      {upload && <UploadSheet idx={idx} ghs={data.ghs} place0={place} onClose={() => setUpload(false)} />}
      {edit && <EditDocSheet idx={idx} ghs={data.ghs} doc={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
