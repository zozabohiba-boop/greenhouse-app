// سجل المعاملات: رش، حقن بالري، إطلاق حيوي، عمليات زراعية
// معاملة واحدة → صوبة أو أكثر → مادة أو أكثر بجرعاتها. فترة الأمان وإدارة المقاومة تُحسب فورًا على الجهاز.

import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, createMany, softDelete, update } from '../lib/repo';
import { formatDate, todayLocal } from '../lib/dates';
import { addDays, moaHistory, phiByGreenhouse } from '../lib/ipm';
import { activeCycle, useGreenhouses, usePeople, usePests, useProducts } from '../lib/hooks';
import { ghLabels, indexZones, useGhLabels, useZones } from '../lib/zones';
import { GhMultiPick, GhOptions } from '../components/ZoneBrowser';
import { addPhoto, removePhoto, usePhotos } from '../lib/photos';
import {
  ACTIVITY_ICON, ACTIVITY_TYPE_LABEL, APP_METHOD_LABEL, DOSE_UNIT_LABEL, OP_CATEGORY_LABEL,
  PRODUCT_TYPE_LABEL, PRODUCT_TYPES_FOR,
} from '../lib/labels';
import { Field, numStr, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { doseText, repeatedMoa } from '../lib/advice';
import { Sheet } from '../components/Sheet';
import { PhotoStrip } from '../components/Photos';
import type { Row } from '../lib/schema';

type Activity = Row<'activities'>;
type AType = Activity['activity_type'];
type Product = Row<'products'>;

const TYPES = Object.keys(ACTIVITY_TYPE_LABEL) as AType[];
const DEFAULT_METHOD: Record<AType, Activity['method']> = {
  chemical_spray: 'foliar_spray',
  fertigation_injection: 'fertigation',
  bio_release: 'release',
  cultural_operation: 'manual',
};
const METHODS_FOR: Record<AType, NonNullable<Activity['method']>[]> = {
  chemical_spray: ['foliar_spray', 'fogging', 'drench'],
  fertigation_injection: ['fertigation', 'drench'],
  bio_release: ['release'],
  cultural_operation: ['manual'],
};

/** كل بيانات المعاملات للمزرعة — تُستخدم في السجل واللوحة */
export function useActivityData(farmId: string | null) {
  return useLiveQuery(async () => {
    if (!farmId) return null;
    const [acts, ags, aps, prods, ops] = await Promise.all([
      db.activities.where('farm_id').equals(farmId).toArray(),
      db.activity_greenhouses.where('farm_id').equals(farmId).toArray(),
      db.activity_products.where('farm_id').equals(farmId).toArray(),
      db.products.toArray(),
      db.operation_types.toArray(),
    ]);
    return { acts: acts.filter(alive), ags: ags.filter(alive), aps: aps.filter(alive), prods, ops };
  }, [farmId]);
}

export function phiText(until: string, today = todayLocal()) {
  const d = Math.round((Date.parse(until) - Date.parse(today)) / 86400000);
  return d <= 1 ? 'الحصاد مسموح من بكرة' : `ممنوع الحصاد ${d} أيام — حتى ${formatDate(until)}`;
}

// ── السجل ────────────────────────────────────────────────────────────
export function ActivityList() {
  const { farmId, can } = useApp();
  const [sp, setSp] = useSearchParams();
  const type = (sp.get('type') as AType | null) ?? null;
  const ghFilter = sp.get('gh');
  const [days, setDays] = useState(60);
  const ghs = useGreenhouses(farmId);
  const idx = useZones(farmId);
  const labels = useGhLabels(farmId);
  const data = useActivityData(farmId);
  const today = todayLocal();

  const view = useMemo(() => {
    if (!data || !ghs || !labels) return null;
    const ghCode = labels;
    const prod = new Map(data.prods.map((p) => [p.id, p]));
    const op = new Map(data.ops.map((o) => [o.id, o]));
    const phi = phiByGreenhouse(data.acts, data.ags, data.aps, data.prods, today);
    const from = addDays(today, -days);
    const items = data.acts
      .filter((a) => a.performed_on >= from && (!type || a.activity_type === type))
      .map((a) => {
        const ghIds = data.ags.filter((x) => x.activity_id === a.id).map((x) => x.greenhouse_id);
        const products = data.aps.filter((x) => x.activity_id === a.id).map((x) => ({ ap: x, p: prod.get(x.product_id) }));
        const maxPhi = Math.max(-1, ...products.map((x) => x.p?.phi_days ?? -1));
        return { a, ghIds, products, op: a.operation_type_id ? op.get(a.operation_type_id) : undefined, until: maxPhi >= 0 ? addDays(a.performed_on, maxPhi) : null };
      })
      .filter((x) => !ghFilter || x.ghIds.includes(ghFilter))
      .sort((x, y) => (x.a.performed_on === y.a.performed_on ? (x.a.created_at < y.a.created_at ? 1 : -1) : x.a.performed_on < y.a.performed_on ? 1 : -1));
    const byDate = new Map<string, typeof items>();
    for (const it of items) {
      if (!byDate.has(it.a.performed_on)) byDate.set(it.a.performed_on, []);
      byDate.get(it.a.performed_on)!.push(it);
    }
    return { byDate, ghCode, phi, count: items.length, older: data.acts.some((a) => a.performed_on < from) };
  }, [data, ghs, labels, type, ghFilter, days, today]);

  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    setSp(n, { replace: true });
  };

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>سجل المعاملات</h1><p>الرش والحقن والإطلاق الحيوي والعمليات الزراعية</p></div>
        <div className="row">
          {can.advise && <Link to="/products" className="btn"><Icon name="box" size={20} /> المواد</Link>}
          {can.record && <Link to={`/activities/new${type ? `?type=${type}` : ''}`} className="btn primary"><Icon name="plus" /> معاملة جديدة</Link>}
        </div>
      </div>

      {view && view.phi.size > 0 && (
        <div className="phi-board">
          {[...view.phi.entries()].sort((a, b) => (view.ghCode.get(a[0]) ?? '').localeCompare(view.ghCode.get(b[0]) ?? '', 'en', { numeric: true })).map(([gid, s]) => (
            <div key={gid} className="phi-card">
              <Icon name="shield" size={22} />
              <span>
                <b className="lbl">{view.ghCode.get(gid)}</b>
                <small>{phiText(s.until, today)} — {s.product}</small>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="filters">
        <div className="seg" role="group" aria-label="نوع المعاملة">
          <button aria-pressed={!type} onClick={() => setParam('type', null)}>الكل</button>
          {TYPES.map((t) => <button key={t} aria-pressed={type === t} onClick={() => setParam('type', t)}>{ACTIVITY_TYPE_LABEL[t]}</button>)}
        </div>
        <select className="select" style={{ width: 'auto', minWidth: 150 }} value={ghFilter ?? ''} onChange={(e) => setParam('gh', e.target.value || null)} aria-label="الصوبة">
          <option value="">كل الصوب</option>
          <GhOptions idx={idx} ghs={(ghs ?? []).map((x) => x.g)} />
        </select>
      </div>

      {view && view.count === 0 && (
        <div className="panel empty">
          <h3>لا توجد معاملات {type ? `(${ACTIVITY_TYPE_LABEL[type]})` : ''} في آخر {days} يوم</h3>
          {can.record && <Link to="/activities/new" className="btn primary"><Icon name="plus" /> سجّل أول معاملة</Link>}
        </div>
      )}

      {view && [...view.byDate.entries()].map(([date, items]) => (
        <section key={date}>
          <h2 className="date-head">{formatDate(date)}</h2>
          <ul className="list panel">
            {items.map(({ a, ghIds, products, op, until }) => (
              <li key={a.id}>
                <Link to={`/activities/${a.id}`} className="list-item">
                  <span className="act-ico" data-t={a.activity_type}><Icon name={ACTIVITY_ICON[a.activity_type]} size={22} /></span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <b>{ACTIVITY_TYPE_LABEL[a.activity_type]}{op ? ` — ${op.name_ar}` : ''}</b>
                    <small className="muted" style={{ display: 'block' }}>
                      {products.length ? products.map(({ ap, p }) => `${p?.name ?? 'مادة'}${ap.dose != null ? ` ${ap.dose} ${ap.dose_unit ? DOSE_UNIT_LABEL[ap.dose_unit] : ''}` : ''}`).join('، ') : a.notes || a.reason || ''}
                    </small>
                    <span className="gh-chips">{ghIds.map((g) => <span key={g} className="chip lbl">{view.ghCode.get(g) ?? '؟'}</span>)}</span>
                  </span>
                  {until && until > today && <span className="chip bad"><Icon name="shield" size={14} /> حتى {formatDate(until).replace(/ \d{4}$/, '')}</span>}
                  {(a as any)._error && <span className="chip bad">مرفوض</span>}
                  <Icon name="chevron" size={20} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {view?.older && <div style={{ textAlign: 'center', marginTop: 16 }}><button className="btn" onClick={() => setDays(days + 90)}>عرض الأقدم</button></div>}
    </main>
  );
}

// ── تفاصيل معاملة ────────────────────────────────────────────────────
export function ActivityDetail() {
  const { id } = useParams();
  const { user, can, toast } = useApp();
  const nav = useNavigate();
  const people = usePeople();
  const data = useLiveQuery(async () => {
    const a = await db.activities.get(id!);
    if (!alive(a)) return null;
    const [ags, aps, prods, ghs] = await Promise.all([
      db.activity_greenhouses.where('activity_id').equals(a.id).toArray(),
      db.activity_products.where('activity_id').equals(a.id).toArray(),
      db.products.toArray(),
      db.greenhouses.toArray(),
    ]);
    const prod = new Map(prods.map((p) => [p.id, p]));
    const op = a.operation_type_id ? await db.operation_types.get(a.operation_type_id) : undefined;
    const pest = a.target_pest_id ? await db.pests.get(a.target_pest_id) : undefined;
    const rec = a.recommendation_id ? await db.recommendations.get(a.recommendation_id) : undefined;
    const zs = await db.farm_zones.where('farm_id').equals(a.farm_id).toArray();
    const ghCode = ghLabels(indexZones(zs), ghs.filter((g) => alive(g) && g.farm_id === a.farm_id));
    return {
      a, op, pest, rec,
      ags: ags.filter(alive).map((x) => ({ ...x, code: ghCode.get(x.greenhouse_id) ?? '؟' })),
      aps: aps.filter(alive).map((x) => ({ ap: x, p: prod.get(x.product_id) })),
    };
  }, [id]);
  const photos = usePhotos('activities', id ? [id] : []).get(id ?? '') ?? [];

  if (data === undefined) return null;
  if (data === null) return <main className="page"><div className="panel empty"><h3>المعاملة غير موجودة</h3><Link to="/activities" className="btn">سجل المعاملات</Link></div></main>;
  const { a, op, pest, rec, ags, aps } = data;
  const editable = can.record && (a.created_by === user?.id || can.supervise);
  const maxPhi = Math.max(-1, ...aps.map((x) => x.p?.phi_days ?? -1));
  const until = maxPhi >= 0 ? addDays(a.performed_on, maxPhi) : null;
  const today = todayLocal();

  return (
    <main className="page">
      <Link to="/activities" className="back"><Icon name="back" size={18} /> سجل المعاملات</Link>
      <div className="page-head">
        <div>
          <h1>{ACTIVITY_TYPE_LABEL[a.activity_type]}{op ? ` — ${op.name_ar}` : ''}</h1>
          <p>{formatDate(a.performed_on)}{a.start_time ? `، ${a.start_time.slice(0, 5)}` : ''}{a.end_time ? ` – ${a.end_time.slice(0, 5)}` : ''}</p>
        </div>
        <div className="row">
          {can.record && <Link to={`/activities/new?copy=${a.id}`} className="btn"><Icon name="sync" size={20} /> كرّر المعاملة</Link>}
          {editable && <Link to={`/activities/${a.id}/edit`} className="btn"><Icon name="edit" size={20} /> تعديل</Link>}
        </div>
      </div>

      {until && (
        <div className={`banner ${until > today ? 'bad' : 'info'}`}>
          <Icon name="shield" />
          {until > today ? phiText(until, today) : `انتهت فترة الأمان في ${formatDate(until)}`}
        </div>
      )}

      <div className="panel panel-pad detail-grid">
        <Detail k="الصوب">{ags.map((x) => <span key={x.id} className="chip lbl" style={{ marginInlineEnd: 4 }}>{x.code}</span>)}{ags[0]?.rows_scope ? <span className="muted"> — {ags[0].rows_scope}</span> : null}</Detail>
        {a.method && <Detail k="طريقة التطبيق">{APP_METHOD_LABEL[a.method]}</Detail>}
        {a.water_volume_l != null && <Detail k="حجم المحلول"><span className="num">{a.water_volume_l}</span> لتر</Detail>}
        {pest && <Detail k="الآفة المستهدفة">{pest.name_ar}</Detail>}
        {a.performed_by_name && <Detail k="المنفّذ">{a.performed_by_name}</Detail>}
        <Detail k="سجّلها">{people.get(a.created_by ?? '') ?? '—'}</Detail>
        {a.reason && <Detail k="السبب">{a.reason}</Detail>}
        {rec && <Detail k="تنفيذ توصية"><Link to="/recs">{rec.title}</Link></Detail>}
        {a.notes && <Detail k="ملاحظات">{a.notes}</Detail>}
      </div>

      {aps.length > 0 && (
        <>
          <h2 className="section-title">المواد المستخدمة</h2>
          <div className="panel scroll-x">
            <table className="tbl">
              <thead><tr><th>المادة</th><th>النوع</th><th>الجرعة</th><th>الكمية الكلية</th><th>المجموعة</th><th>فترة الأمان</th><th>التشغيلة</th></tr></thead>
              <tbody>
                {aps.map(({ ap, p }) => (
                  <tr key={ap.id}>
                    <td><b>{p?.name}</b>{p?.active_ingredient && <small className="faint" style={{ display: 'block' }}>{p.active_ingredient}{p.concentration ? ` ${p.concentration}` : ''}</small>}</td>
                    <td>{p ? PRODUCT_TYPE_LABEL[p.product_type] : ''}</td>
                    <td className="n">{ap.dose ?? '—'} {ap.dose_unit ? DOSE_UNIT_LABEL[ap.dose_unit] : ''}</td>
                    <td className="n">{ap.total_quantity ?? '—'} {ap.total_unit ?? ''}</td>
                    <td className="n">{p?.moa_code ?? '—'}</td>
                    <td className="n">{p?.phi_days != null ? `${p.phi_days} يوم` : '—'}</td>
                    <td className="n">{ap.batch_no ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title">الصور</h2>
      <PhotoStrip photos={photos} onAdd={editable ? (fs) => fs.forEach((f) => void addPhoto(a.farm_id, 'activities', a.id, f)) : undefined}
        onRemove={editable ? (pid) => void removePhoto(pid) : undefined} />

      {editable && (
        <div className="form-actions" style={{ marginTop: 28 }}>
          <button className="btn danger" onClick={async () => {
            if (!confirm('حذف هذه المعاملة من السجل؟')) return;
            for (const x of ags) await softDelete('activity_greenhouses', x.id);
            for (const x of aps) await softDelete('activity_products', x.ap.id);
            await softDelete('activities', a.id);
            toast('تم حذف المعاملة');
            nav('/activities', { replace: true });
          }}><Icon name="trash" size={20} /> حذف المعاملة</button>
        </div>
      )}
    </main>
  );
}

function Detail({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="detail"><span className="k">{k}</span><span className="v">{children}</span></div>;
}

// ── إضافة / تعديل معاملة ─────────────────────────────────────────────
interface Line {
  key: string;
  id?: string;
  product_id: string;
  dose: string;
  dose_unit: string;
  total_quantity: string;
  total_unit: string;
  batch_no: string;
}

export function ActivityForm() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const copyId = id ? null : sp.get('copy');
  const { can, user } = useApp();
  const existing = useLiveQuery(async () => {
    const src = id ?? copyId;
    if (!src) return null;
    const a = await db.activities.get(src);
    if (!alive(a)) return null;
    const ags = (await db.activity_greenhouses.where('activity_id').equals(a.id).toArray()).filter(alive);
    const aps = (await db.activity_products.where('activity_id').equals(a.id).toArray()).filter(alive);
    return { a, ags, aps };
  }, [id, copyId]);
  if (!can.record) return <Navigate to="/activities" replace />;
  if ((id || copyId) && existing === undefined) return null;
  if (id && !existing) return <Navigate to="/activities" replace />;
  if (copyId) return <ActivityFormInner key={`copy-${copyId}`} existing={null} template={existing ?? null} />;
  if (existing && existing.a.created_by !== user?.id && !can.supervise) return <Navigate to={`/activities/${id}`} replace />;
  return <ActivityFormInner key={id ?? 'new'} existing={existing ?? null} />;
}

type ActBundle = { a: Activity; ags: Row<'activity_greenhouses'>[]; aps: Row<'activity_products'>[] };
function ActivityFormInner({ existing, template = null }: { existing: ActBundle | null; template?: ActBundle | null }) {
  const { farmId, can, toast } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const ghs = useGreenhouses(farmId);
  const idx = useZones(farmId);
  const labels = useGhLabels(farmId);
  const pests = usePests(farmId);
  const products = useProducts(farmId);
  const actData = useActivityData(farmId);
  const ops = useLiveQuery(async () => (await db.operation_types.toArray()).filter((o) => alive(o) && (o.farm_id == null || o.farm_id === farmId)).sort((a, b) => a.sort_order - b.sort_order), [farmId]);
  const openRecs = useLiveQuery(async () => (await db.recommendations.where('farm_id').equals(farmId!).toArray())
    .filter((r) => alive(r) && (r.status === 'open' || r.status === 'in_progress' || r.id === existing?.a.recommendation_id)), [farmId]);
  const today = todayLocal();
  // تكرار معاملة: نفس المحتوى بتاريخ اليوم، كسجل جديد
  const src = existing ?? template;
  const a = src?.a;

  const recParam = sp.get('rec');
  const [type, setType] = useState<AType>(a?.activity_type ?? (sp.get('type') as AType) ?? 'chemical_spray');
  const [f, setF] = useState({
    performed_on: existing ? a!.performed_on : today,
    start_time: existing ? a!.start_time?.slice(0, 5) ?? '' : '',
    end_time: existing ? a!.end_time?.slice(0, 5) ?? '' : '',
    method: a?.method ?? DEFAULT_METHOD[type],
    rows_scope: src?.ags[0]?.rows_scope ?? '',
    water_volume_l: numStr(a?.water_volume_l),
    target_pest_id: a?.target_pest_id ?? sp.get('pest') ?? '',
    operation_type_id: a?.operation_type_id ?? '',
    performed_by_name: a?.performed_by_name ?? '',
    reason: a?.reason ?? '',
    notes: a?.notes ?? '',
    recommendation_id: (existing ? a!.recommendation_id : null) ?? recParam ?? '',
  });
  const [ghIds, setGhIds] = useState<Set<string>>(() => new Set(src ? src.ags.map((x) => x.greenhouse_id) : sp.get('gh') ? [sp.get('gh')!] : []));
  const [lines, setLines] = useState<Line[]>(() => src?.aps.length
    ? src.aps.map((x) => ({ key: x.id, id: existing ? x.id : undefined, product_id: x.product_id, dose: numStr(x.dose), dose_unit: x.dose_unit ?? '', total_quantity: numStr(x.total_quantity), total_unit: x.total_unit ?? '', batch_no: x.batch_no ?? '' }))
    : [blankLine()]);
  const [files, setFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newProduct, setNewProduct] = useState<string | null>(null); // مفتاح السطر الذي يضيف منتجًا
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const usesProducts = type !== 'cultural_operation';
  const allowedTypes = PRODUCT_TYPES_FOR[type];
  const choosable = (products ?? []).filter((p) => allowedTypes.includes(p.product_type));
  const prodById = new Map((products ?? []).map((p) => [p.id, p]));

  // فترة الأمان المتوقعة + تحذير تكرار نفس المجموعة
  const chosen = usesProducts ? lines.map((l) => prodById.get(l.product_id)).filter(Boolean) as Product[] : [];
  const maxPhi = Math.max(-1, ...chosen.map((p) => p.phi_days ?? -1));
  const phiUntil = maxPhi >= 0 && f.performed_on ? addDays(f.performed_on, maxPhi) : null;
  const moaWarn = useMemo(() => {
    if (!actData || !ghs || (type !== 'chemical_spray' && type !== 'fertigation_injection')) return [];
    const out: string[] = [];
    const code = labels ?? new Map(ghs.map((x) => [x.g.id, x.g.code]));
    for (const gid of ghIds) {
      const hist = moaHistory(gid, actData.acts, actData.ags, actData.aps, actData.prods, existing?.a.id);
      for (const p of chosen) {
        const moa = p.moa_code?.trim();
        if (!moa) continue;
        const n = repeatedMoa(moa, hist, f.performed_on);
        if (n >= 2) out.push(`${code.get(gid)}: المجموعة ${moa} (${p.name}) استُخدمت في آخر ${n} معاملات متتالية — بدّل لمجموعة مختلفة لتأخير المقاومة.`);
      }
    }
    return [...new Set(out)];
  }, [actData, ghs, labels, ghIds, chosen.map((p) => p.id).join(), f.performed_on, type]);

  const recs = (openRecs ?? []).filter((r) => !r.greenhouse_id || ghIds.size === 0 || ghIds.has(r.greenhouse_id));

  function switchType(t: AType) {
    setType(t);
    setF((x) => ({ ...x, method: DEFAULT_METHOD[t] }));
    setLines((ls) => {
      const ok = ls.filter((l) => l.product_id && PRODUCT_TYPES_FOR[t].includes(prodById.get(l.product_id)?.product_type as any));
      return ok.length ? ok : [blankLine()];
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!f.performed_on || f.performed_on > today) return setErr('تاريخ المعاملة لا يمكن أن يكون في المستقبل');
    if (ghIds.size === 0) return setErr('اختر صوبة واحدة على الأقل');
    if (type === 'cultural_operation' && !f.operation_type_id) return setErr('اختر العملية الزراعية');
    const filled = usesProducts ? lines.filter((l) => l.product_id) : [];
    if (usesProducts && filled.length === 0) return setErr('أضف مادة واحدة على الأقل');
    for (const l of filled) {
      const d = toNum(l.dose);
      const q = toNum(l.total_quantity);
      if ((l.dose && d == null) || (d != null && d < 0)) return setErr(`جرعة ${prodById.get(l.product_id)?.name} غير صحيحة`);
      if ((l.total_quantity && q == null) || (q != null && q < 0)) return setErr(`كمية ${prodById.get(l.product_id)?.name} غير صحيحة`);
    }
    const water = toNum(f.water_volume_l);
    if (water != null && water < 0) return setErr('حجم المحلول غير صحيح');
    if (f.start_time && f.end_time && f.end_time < f.start_time) return setErr('وقت الانتهاء قبل وقت البدء');
    setBusy(true);
    try {
      const values = {
        activity_type: type,
        method: f.method,
        operation_type_id: type === 'cultural_operation' ? f.operation_type_id : null,
        performed_on: f.performed_on,
        start_time: f.start_time || null,
        end_time: f.end_time || null,
        performed_by_name: f.performed_by_name.trim() || null,
        water_volume_l: usesProducts && type !== 'bio_release' ? water : null,
        target_pest_id: type !== 'cultural_operation' && f.target_pest_id ? f.target_pest_id : null,
        recommendation_id: f.recommendation_id || null,
        reason: f.reason.trim() || null,
        notes: f.notes.trim() || null,
      };
      const cycles = await db.crop_cycles.where('farm_id').equals(farmId!).toArray();
      const scope = f.rows_scope.trim() || null;
      let actId: string;
      if (existing) {
        actId = existing.a.id;
        await update('activities', actId, values);
        // الصوب: حذف المستبعدة، إضافة الجديدة، تحديث نطاق الخطوط
        for (const ag of existing.ags) {
          if (!ghIds.has(ag.greenhouse_id)) await softDelete('activity_greenhouses', ag.id);
          else if (ag.rows_scope !== scope) await update('activity_greenhouses', ag.id, { rows_scope: scope });
        }
        const had = new Set(existing.ags.map((x) => x.greenhouse_id));
        await createMany('activity_greenhouses', [...ghIds].filter((g) => !had.has(g)).map((g) => ({ farm_id: farmId!, activity_id: actId, greenhouse_id: g, crop_cycle_id: activeCycle(cycles, g)?.id ?? null, rows_scope: scope })));
        // المواد
        const keep = new Set(filled.map((l) => l.id).filter(Boolean));
        for (const ap of existing.aps) if (!keep.has(ap.id)) await softDelete('activity_products', ap.id);
        for (const l of filled) {
          const v = lineValues(l);
          if (l.id) await update('activity_products', l.id, v);
          else await create('activity_products', { ...v, farm_id: farmId!, activity_id: actId });
        }
      } else {
        const act = await create('activities', { ...values, farm_id: farmId! });
        actId = act.id;
        await createMany('activity_greenhouses', [...ghIds].map((g) => ({ farm_id: farmId!, activity_id: actId, greenhouse_id: g, crop_cycle_id: activeCycle(cycles, g)?.id ?? null, rows_scope: scope })));
        if (filled.length) await createMany('activity_products', filled.map((l) => ({ ...lineValues(l), farm_id: farmId!, activity_id: actId })));
      }
      for (const x of files) await addPhoto(farmId!, 'activities', actId, x.file);
      files.forEach((x) => URL.revokeObjectURL(x.url));
      toast(existing ? 'تم حفظ التعديلات' : `تم تسجيل ${ACTIVITY_TYPE_LABEL[type]}`);
      nav(`/activities/${actId}`, { replace: true });
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  if (!ghs || !products || !pests || !ops) return null;

  return (
    <main className="page">
      <Link to={existing ? `/activities/${existing.a.id}` : '/activities'} className="back"><Icon name="back" size={18} /> {existing ? 'تفاصيل المعاملة' : 'سجل المعاملات'}</Link>
      <div className="page-head"><div><h1>{existing ? 'تعديل معاملة' : 'معاملة جديدة'}</h1></div></div>

      <form className="form act-form" onSubmit={submit}>
        <div className="type-pick" role="group" aria-label="نوع المعاملة">
          {TYPES.map((t) => (
            <button type="button" key={t} aria-pressed={type === t} data-t={t} onClick={() => switchType(t)}>
              <Icon name={ACTIVITY_ICON[t]} size={26} /><span>{ACTIVITY_TYPE_LABEL[t]}</span>
            </button>
          ))}
        </div>

        <section className="panel panel-pad form">
          <h2 className="form-h">الصوب</h2>
          <GhMultiPick idx={idx} ghs={ghs.map((x) => x.g)} value={ghIds} onChange={setGhIds} />
          <div className="form-grid">
            <Field label="التاريخ"><input className="input" type="date" max={today} value={f.performed_on} onChange={(e) => set('performed_on', e.target.value)} /></Field>
            <Field label="من الساعة"><input className="input" type="time" value={f.start_time} onChange={(e) => set('start_time', e.target.value)} /></Field>
            <Field label="إلى الساعة"><input className="input" type="time" value={f.end_time} onChange={(e) => set('end_time', e.target.value)} /></Field>
            <Field label="نطاق التطبيق" hint="مثلًا: الخطوط 1–12، أو البؤرة فقط"><input className="input" value={f.rows_scope} onChange={(e) => set('rows_scope', e.target.value)} /></Field>
          </div>
        </section>

        {type === 'cultural_operation' ? (
          <section className="panel panel-pad form">
            <h2 className="form-h">العملية</h2>
            <div className="op-pick">
              {Object.entries(OP_CATEGORY_LABEL).map(([cat, label]) => {
                const list = ops.filter((o) => o.category === cat);
                if (!list.length) return null;
                return (
                  <div key={cat}>
                    <h3>{label}</h3>
                    <div className="chips-pick">
                      {list.map((o) => <button type="button" key={o.id} aria-pressed={f.operation_type_id === o.id} onClick={() => set('operation_type_id', o.id)}>{o.name_ar}</button>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="panel panel-pad form">
            <h2 className="form-h">{type === 'bio_release' ? 'الأعداء الحيوية والملقحات' : 'المواد والجرعات'}</h2>
            <div className="form-grid">
              {METHODS_FOR[type].length > 1 && (
                <Field label="طريقة التطبيق">
                  <select className="select" value={f.method ?? ''} onChange={(e) => set('method', e.target.value as Activity['method'])}>
                    {METHODS_FOR[type].map((m) => <option key={m} value={m}>{APP_METHOD_LABEL[m]}</option>)}
                  </select>
                </Field>
              )}
              {type !== 'bio_release' && (
                <Field label="حجم المحلول (لتر)"><input className="input ltr" inputMode="decimal" value={f.water_volume_l} onChange={(e) => set('water_volume_l', e.target.value)} /></Field>
              )}
              <Field label="الآفة المستهدفة">
                <select className="select" value={f.target_pest_id} onChange={(e) => set('target_pest_id', e.target.value)}>
                  <option value="">—</option>
                  {pests.map((p) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
                </select>
              </Field>
            </div>

            <div className="lines">
              {lines.map((l, i) => {
                const p = prodById.get(l.product_id);
                return (
                  <div key={l.key} className="line">
                    <div className="line-head">
                      <b>{i + 1}</b>
                      <select className="select" value={l.product_id} aria-label="المادة" onChange={(e) => {
                        if (e.target.value === '__new') return setNewProduct(l.key);
                        const np = prodById.get(e.target.value);
                        setLines(lines.map((x) => x.key === l.key ? {
                          ...x, product_id: e.target.value,
                          dose: x.dose || (np?.default_dose != null ? String(Number(np.default_dose)) : ''),
                          dose_unit: x.dose_unit || np?.default_dose_unit || '',
                        } : x));
                      }}>
                        <option value="">اختر المادة…</option>
                        {allowedTypes.map((t) => {
                          const opts = choosable.filter((x) => x.product_type === t);
                          return opts.length ? <optgroup key={t} label={PRODUCT_TYPE_LABEL[t]}>{opts.map((x) => <option key={x.id} value={x.id}>{x.name}{x.active_ingredient ? ` — ${x.active_ingredient}` : ''}</option>)}</optgroup> : null;
                        })}
                        {can.advise && <option value="__new">+ مادة جديدة…</option>}
                      </select>
                      {lines.length > 1 && <button type="button" className="iconbtn" aria-label="حذف السطر" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}><Icon name="close" size={18} /></button>}
                    </div>
                    {p && (
                      <p className="faint line-meta">
                        {[p.moa_code && `مجموعة ${p.moa_code}`, p.phi_days != null && `فترة أمان ${p.phi_days} يوم`, p.rei_hours != null && `منع دخول ${p.rei_hours} ساعة`, p.bio_species].filter(Boolean).join(' · ') || PRODUCT_TYPE_LABEL[p.product_type]}
                      </p>
                    )}
                    <div className="form-grid tight">
                      <Field label="الجرعة"><input className="input ltr" inputMode="decimal" value={l.dose} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, dose: e.target.value } : x))} /></Field>
                      <Field label="وحدة الجرعة">
                        <select className="select" value={l.dose_unit} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, dose_unit: e.target.value } : x))}>
                          <option value="">—</option>
                          {Object.entries(DOSE_UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </Field>
                      <Field label="الكمية الكلية"><input className="input ltr" inputMode="decimal" value={l.total_quantity} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, total_quantity: e.target.value } : x))} /></Field>
                      <Field label="وحدة الكمية"><input className="input" list="total-units" value={l.total_unit} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, total_unit: e.target.value } : x))} /></Field>
                      <Field label="رقم التشغيلة"><input className="input ltr" value={l.batch_no} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, batch_no: e.target.value } : x))} /></Field>
                    </div>
                  </div>
                );
              })}
              <datalist id="total-units">{['لتر', 'مل', 'كجم', 'جم', 'عبوة', 'خلية', 'كرتونة'].map((u) => <option key={u} value={u} />)}</datalist>
              <button type="button" className="btn ghost" onClick={() => setLines([...lines, blankLine()])}><Icon name="plus" /> مادة أخرى</button>
              {choosable.length === 0 && (
                <p className="banner warn" style={{ margin: 0 }}><Icon name="alert" /> {can.advise ? 'لا توجد مواد من هذا النوع بعد. اختر "مادة جديدة" لإضافتها.' : 'لا توجد مواد من هذا النوع بعد. يضيفها الاستشاري أو مدير المزرعة من شاشة المواد.'}</p>
              )}
            </div>

            {phiUntil && (
              <div className={`banner ${phiUntil > today ? 'bad' : 'info'}`} style={{ margin: 0 }}>
                <Icon name="shield" /> فترة الأمان {maxPhi} يوم — الحصاد مسموح من {formatDate(phiUntil)}
              </div>
            )}
            {moaWarn.map((w) => <div key={w} className="banner warn" style={{ margin: 0 }}><Icon name="alert" /> {w}</div>)}
          </section>
        )}

        <section className="panel panel-pad form">
          <h2 className="form-h">تفاصيل</h2>
          <div className="form-grid">
            <Field label="المنفّذ" hint="اسم العامل أو الفني"><input className="input" value={f.performed_by_name} onChange={(e) => set('performed_by_name', e.target.value)} /></Field>
            {recs.length > 0 && (
              <Field label="تنفيذ توصية">
                <select className="select" value={f.recommendation_id} onChange={(e) => set('recommendation_id', e.target.value)}>
                  <option value="">—</option>
                  {recs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </Field>
            )}
            <Field label="السبب"><input className="input" value={f.reason} onChange={(e) => set('reason', e.target.value)} /></Field>
          </div>
          <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <div>
            <p className="field-label">صور</p>
            <PhotoStrip
              photos={files.map((x) => ({ id: x.id, url: x.url, pending: true }))}
              onAdd={(fs) => setFiles((cur) => [...cur, ...fs.map((file) => ({ id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file) }))])}
              onRemove={(pid) => setFiles((cur) => cur.filter((x) => x.id !== pid))}
            />
            {existing && <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 6 }}>الصور السابقة تُدار من صفحة تفاصيل المعاملة.</p>}
          </div>
        </section>

        {err && <p className="form-error">{err}</p>}
        <div className="form-actions sticky-actions">
          <button className="btn primary lg" type="submit" disabled={busy}><Icon name="check" /> {existing ? 'حفظ التعديلات' : 'حفظ المعاملة'}</button>
          <Link className="btn lg" to={existing ? `/activities/${existing.a.id}` : '/activities'}>إلغاء</Link>
        </div>
      </form>

      {newProduct && (
        <ProductSheet
          farmId={farmId!}
          defaultType={allowedTypes[0]}
          allowedTypes={allowedTypes}
          onClose={() => setNewProduct(null)}
          onSaved={(p) => {
            setLines(lines.map((x) => x.key === newProduct ? { ...x, product_id: p.id, dose_unit: x.dose_unit || p.default_dose_unit || '' } : x));
            setNewProduct(null);
          }}
        />
      )}
    </main>
  );
}

function blankLine(): Line {
  return { key: Math.random().toString(36).slice(2), product_id: '', dose: '', dose_unit: '', total_quantity: '', total_unit: '', batch_no: '' };
}

function lineValues(l: Line) {
  return {
    product_id: l.product_id,
    dose: toNum(l.dose),
    dose_unit: (l.dose_unit || null) as Row<'activity_products'>['dose_unit'],
    total_quantity: toNum(l.total_quantity),
    total_unit: l.total_unit.trim() || null,
    batch_no: l.batch_no.trim() || null,
  };
}

// ── كتالوج المواد ────────────────────────────────────────────────────
export function ProductList() {
  const { farmId, can } = useApp();
  const products = useProducts(farmId, true);
  const [edit, setEdit] = useState<{ existing?: Product; base?: Product } | null>(null);
  const [type, setType] = useState<string>('');
  const [kind, setKind] = useState<'' | 'bio' | 'chem'>('');
  const [q, setQ] = useState('');
  if (!can.advise) return <Navigate to="/activities" replace />;
  const term = q.trim().toLowerCase();
  const list = (products ?? []).filter((p) => (!type || p.product_type === type)
    && (!kind || (kind === 'bio') === !!p.is_bio)
    && (!term || [p.name, p.active_ingredient, p.bio_species, p.targets, p.moa_code].some((x) => x?.toLowerCase().includes(term))));
  const types = [...new Set((products ?? []).map((p) => p.product_type))];
  return (
    <main className="page">
      <Link to="/activities" className="back"><Icon name="back" size={18} /> سجل المعاملات</Link>
      <div className="page-head">
        <div><h1>المواد</h1><p>{products?.length ?? 0} مادة: مبيدات ومركبات حيوية وأسمدة وأعداء حيوية، بالجرعات ومجموعات المقاومة</p></div>
        <button className="btn primary" onClick={() => setEdit({})}><Icon name="plus" /> مادة جديدة</button>
      </div>
      <div className="filters">
        <label className="search-box" style={{ flex: '1 1 220px' }}>
          <Icon name="search" size={20} />
          <input className="input" placeholder="ابحث بالاسم أو المادة الفعالة أو الآفة" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في المواد" />
        </label>
        <div className="seg" role="group" aria-label="المصدر">
          {([['', 'الكل'], ['bio', 'حيوي وطبيعي'], ['chem', 'كيميائي وأسمدة']] as const).map(([k, l]) => (
            <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
          ))}
        </div>
        <select className="select" style={{ width: 'auto' }} value={type} onChange={(e) => setType(e.target.value)} aria-label="النوع">
          <option value="">كل الأنواع</option>
          {types.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABEL[t]}</option>)}
        </select>
      </div>
      <div className="panel scroll-x">
        <table className="tbl prod-tbl">
          <thead><tr><th>المادة</th><th>النوع</th><th>المادة الفعالة</th><th>المجموعة</th><th>الجرعة</th><th>فترة الأمان</th><th /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} style={!p.is_active ? { opacity: 0.5 } : undefined}>
                <td>
                  <b>{p.name}</b>{p.is_bio && <span className="chip ok" style={{ marginInlineStart: 6 }}>حيوي</span>}
                  {p.targets && <small className="muted" style={{ display: 'block' }}>{p.targets}</small>}
                  {p.farm_id == null && <small className="faint" style={{ display: 'block' }}>كتالوج عام</small>}
                </td>
                <td>{PRODUCT_TYPE_LABEL[p.product_type]}</td>
                <td>{p.active_ingredient ?? p.bio_species ?? '—'}{p.concentration ? ` ${p.concentration}` : ''}</td>
                <td className="n">{p.moa_code ?? '—'}</td>
                <td className="n">{doseText(p) ?? '—'}</td>
                <td className="n">{p.phi_days != null ? `${p.phi_days} يوم` : '—'}</td>
                <td>
                  {p.farm_id
                    ? <button className="btn ghost" onClick={() => setEdit({ existing: p })}><Icon name="edit" size={18} /> تعديل</button>
                    : <button className="btn ghost" title="انسخها للمزرعة لتسجيل فترة الأمان والجرعة حسب العبوة المسجلة" onClick={() => setEdit({ base: p })}><Icon name="edit" size={18} /> خصّص</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <div className="panel empty" style={{ marginTop: 12 }}><h3>لا توجد مواد مطابقة</h3><p>غيّر البحث أو أضف المادة بفترة الأمان المكتوبة على العبوة.</p></div>}
      {edit && <ProductSheet farmId={farmId!} existing={edit.existing} base={edit.base} onClose={() => setEdit(null)} onSaved={() => setEdit(null)} />}
    </main>
  );
}

export function ProductSheet({ farmId, existing, base, defaultType, allowedTypes, onClose, onSaved }: {
  farmId: string; existing?: Product; base?: Product; defaultType?: Product['product_type']; allowedTypes?: Product['product_type'][];
  onClose: () => void; onSaved: (p: Product) => void;
}) {
  const { toast } = useApp();
  // base = نسخة من مادة الكتالوج العام تُحفظ للمزرعة (تغطي الأصل بنفس الاسم)
  const src = existing ?? base;
  const [f, setF] = useState({
    name: src?.name ?? '',
    product_type: src?.product_type ?? defaultType ?? 'insecticide',
    active_ingredient: src?.active_ingredient ?? '',
    concentration: src?.concentration ?? '',
    moa_code: src?.moa_code ?? '',
    phi_days: numStr(src?.phi_days),
    rei_hours: numStr(src?.rei_hours),
    bio_species: src?.bio_species ?? '',
    default_dose_unit: src?.default_dose_unit ?? '',
    default_dose: numStr(src?.default_dose),
    is_bio: src?.is_bio ?? false,
    targets: src?.targets ?? '',
    manufacturer: src?.manufacturer ?? '',
    notes: src?.notes ?? '',
    is_active: existing?.is_active ?? true,
  });
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const bio = f.product_type === 'biocontrol_agent' || f.product_type === 'pollinator';
  const chemical = !bio && f.product_type !== 'fertilizer';
  const types = allowedTypes?.length ? allowedTypes : (Object.keys(PRODUCT_TYPE_LABEL) as Product['product_type'][]);

  return (
    <Sheet title={existing ? 'تعديل مادة' : base ? `تخصيص ${base.name} للمزرعة` : 'مادة جديدة'} onClose={onClose}>
      {base && <p className="banner info">تُحفظ نسخة خاصة بالمزرعة تحل محل مادة الكتالوج العام في القوائم والتوصيات. سجّل فترة الأمان والجرعة من ملصق العبوة المسجلة.</p>}
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        const name = f.name.trim();
        if (!name) return setErr('الاسم التجاري مطلوب');
        const phi = toNum(f.phi_days);
        const rei = toNum(f.rei_hours);
        if (phi != null && (phi < 0 || !Number.isInteger(phi) || phi > 365)) return setErr('فترة الأمان بالأيام (رقم صحيح من 0 إلى 365)');
        if (rei != null && (rei < 0 || !Number.isInteger(rei) || rei > 720)) return setErr('فترة منع الدخول بالساعات (رقم صحيح)');
        const dose = toNum(f.default_dose);
        if (dose != null && dose < 0) return setErr('الجرعة لا يمكن أن تكون سالبة');
        const dup = (await db.products.toArray()).find((p) => alive(p) && p.id !== existing?.id && p.name.trim() === name
          && (p.farm_id === farmId || (p.farm_id == null && !base)));
        if (dup) return setErr('يوجد مادة بنفس الاسم');
        const values = {
          name, product_type: f.product_type, active_ingredient: f.active_ingredient.trim() || null, concentration: f.concentration.trim() || null,
          moa_code: f.moa_code.trim().toUpperCase() || null, phi_days: phi, rei_hours: rei, bio_species: f.bio_species.trim() || null,
          default_dose_unit: (f.default_dose_unit || null) as Product['default_dose_unit'], manufacturer: f.manufacturer.trim() || null,
          notes: f.notes.trim() || null, is_active: f.is_active,
          default_dose: dose, is_bio: bio || f.is_bio, targets: f.targets.trim() || null,
        };
        if (existing) {
          await update('products', existing.id, values);
          toast('تم حفظ المادة');
          onSaved({ ...existing, ...values });
        } else {
          const p = await create('products', { ...values, farm_id: farmId });
          toast(`تمت إضافة ${name}`);
          onSaved(p);
        }
      }}>
        <div className="form-grid tight">
          <Field label="الاسم التجاري"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
          <Field label="النوع">
            <select className="select" value={f.product_type} onChange={(e) => set('product_type', e.target.value as Product['product_type'])}>
              {types.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABEL[t]}</option>)}
            </select>
          </Field>
          {bio ? (
            <Field label="النوع العلمي"><input className="input ltr" value={f.bio_species} onChange={(e) => set('bio_species', e.target.value)} /></Field>
          ) : (
            <>
              <Field label="المادة الفعالة"><input className="input" value={f.active_ingredient} onChange={(e) => set('active_ingredient', e.target.value)} /></Field>
              <Field label="التركيز والمستحضر" hint="مثل 1.8% EC"><input className="input ltr" value={f.concentration} onChange={(e) => set('concentration', e.target.value)} /></Field>
            </>
          )}
          {chemical && (
            <>
              <Field label="مجموعة IRAC / FRAC" hint="مثل 6 أو 4A أو M5"><input className="input ltr" value={f.moa_code} onChange={(e) => set('moa_code', e.target.value)} /></Field>
              <Field label="فترة الأمان (يوم)"><input className="input ltr" inputMode="numeric" value={f.phi_days} onChange={(e) => set('phi_days', e.target.value)} /></Field>
              <Field label="منع الدخول (ساعة)"><input className="input ltr" inputMode="numeric" value={f.rei_hours} onChange={(e) => set('rei_hours', e.target.value)} /></Field>
            </>
          )}
          <Field label="الجرعة المعتادة" hint="تُملأ تلقائيًا عند التسجيل"><input className="input ltr" inputMode="decimal" value={f.default_dose} onChange={(e) => set('default_dose', e.target.value)} /></Field>
          <Field label="وحدة الجرعة المعتادة">
            <select className="select" value={f.default_dose_unit} onChange={(e) => set('default_dose_unit', e.target.value)}>
              <option value="">—</option>
              {Object.entries(DOSE_UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="الشركة"><input className="input" value={f.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} /></Field>
        </div>
        <Field label="الآفات المستهدفة / الاستخدام"><input className="input" value={f.targets} onChange={(e) => set('targets', e.target.value)} /></Field>
        {!bio && (
          <label className="toggle">
            <input type="checkbox" checked={f.is_bio} onChange={(e) => set('is_bio', e.target.checked)} />
            <span><b>منتج حيوي أو طبيعي</b><small>يظهر ضمن الخيارات الحيوية في التوصيات</small></span>
          </label>
        )}
        <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {existing && (
          <label className="toggle">
            <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            <span><b>مستخدمة حاليًا</b><small>المواد الموقوفة لا تظهر عند تسجيل معاملة جديدة</small></span>
          </label>
        )}
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" type="submit"><Icon name="check" /> حفظ</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Sheet>
  );
}
