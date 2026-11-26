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
import { ACTIVITY_DOMAIN, DOMAIN_LABEL, type Domain } from '../lib/access';
import { MAJORS_FOR, complianceFor, cropKey, productMatches, useCatalog, useRegistry } from '../lib/catalog';
import { CategoryField, ProductPickButton, ProductPickerSheet } from '../components/Catalog';
import { mixWarnings } from '../lib/mixing';
import { QUALITY_LABEL } from '../lib/labels';
import { PhotoStrip } from '../components/Photos';
import type { Row } from '../lib/schema';

type Activity = Row<'activities'>;
type AType = Activity['activity_type'];
type Product = Row<'products'>;

const TYPES = Object.keys(ACTIVITY_TYPE_LABEL) as AType[];
const DEFAULT_METHOD: Record<AType, Activity['method']> = {
  chemical_spray: 'foliar_spray',
  fertigation_injection: 'fertigation',
  foliar_nutrition: 'foliar_spray',
  bio_release: 'release',
  cultural_operation: 'manual',
};
const METHODS_FOR: Record<AType, NonNullable<Activity['method']>[]> = {
  chemical_spray: ['foliar_spray', 'fogging', 'drench'],
  fertigation_injection: ['fertigation', 'drench'],
  foliar_nutrition: ['foliar_spray'],
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
  const domain = (sp.get('domain') as Domain | null) ?? null;
  const visibleTypes = TYPES.filter((t) => can.canRead(ACTIVITY_DOMAIN[t]) && (!domain || ACTIVITY_DOMAIN[t] === domain));
  const recordTypes = visibleTypes.filter((t) => can.canRecord(ACTIVITY_DOMAIN[t]));
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
      .filter((a) => a.performed_on >= from && (!type || a.activity_type === type) && (!domain || ACTIVITY_DOMAIN[a.activity_type] === domain))
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
  }, [data, ghs, labels, type, domain, ghFilter, days, today]);

  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    setSp(n, { replace: true });
  };

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>{domain ? `سجل ${DOMAIN_LABEL[domain]}` : 'سجل المعاملات'}</h1><p>{visibleTypes.map((t) => ACTIVITY_TYPE_LABEL[t]).join('، ')}</p></div>
        <div className="row">
          <Link to="/products" className="btn"><Icon name="box" size={20} /> المواد</Link>
          {recordTypes.length > 0 && <Link to={`/activities/new${type && recordTypes.includes(type) ? `?type=${type}` : `?type=${recordTypes[0]}`}`} className="btn primary"><Icon name="plus" /> معاملة جديدة</Link>}
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
          {visibleTypes.map((t) => <button key={t} aria-pressed={type === t} onClick={() => setParam('type', t)}>{ACTIVITY_TYPE_LABEL[t]}</button>)}
        </div>
        <select className="select" style={{ width: 'auto', minWidth: 150 }} value={ghFilter ?? ''} onChange={(e) => setParam('gh', e.target.value || null)} aria-label="الصوبة">
          <option value="">كل الصوب</option>
          <GhOptions idx={idx} ghs={(ghs ?? []).map((x) => x.g)} />
        </select>
      </div>

      {view && view.count === 0 && (
        <div className="panel empty">
          <h3>لا توجد معاملات {type ? `(${ACTIVITY_TYPE_LABEL[type]})` : ''} في آخر {days} يوم</h3>
          {recordTypes.length > 0 && <Link to={`/activities/new?type=${type && recordTypes.includes(type) ? type : recordTypes[0]}`} className="btn primary"><Icon name="plus" /> سجّل أول معاملة</Link>}
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
                    {(a.workers_count != null || a.quality != null) && <small className="muted" style={{ display: 'block' }}>{[a.workers_count != null && `${a.workers_count} عامل`, a.labor_hours != null && `${Number(a.labor_hours)} ساعة عمل`, a.quality != null && `التنفيذ: ${QUALITY_LABEL[a.quality]}`].filter(Boolean).join(' · ')}</small>}
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
  const editable = can.canRecord(ACTIVITY_DOMAIN[a.activity_type]) && (a.created_by === user?.id || can.supervise);
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
          {can.canRecord(ACTIVITY_DOMAIN[a.activity_type]) && <Link to={`/activities/new?copy=${a.id}`} className="btn"><Icon name="sync" size={20} /> كرّر المعاملة</Link>}
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
        {a.workers_count != null && <Detail k="العمالة"><span className="num">{a.workers_count}</span> عامل{a.labor_hours != null ? <> — <span className="num">{Number(a.labor_hours)}</span> ساعة عمل</> : null}</Detail>}
        {a.quality != null && <Detail k="جودة التنفيذ"><span className="quality-chip" data-q={a.quality}>{QUALITY_LABEL[a.quality]}</span></Detail>}
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
              <thead><tr><th>المادة</th><th>النوع</th><th>الجرعة</th><th>الكمية المستخدمة فعليًا</th><th>المجموعة</th><th>فترة الأمان</th><th>التشغيلة</th></tr></thead>
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
  if (existing && !can.canRecord(ACTIVITY_DOMAIN[existing.a.activity_type])) return <Navigate to="/activities" replace />;
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
  const cat = useCatalog(farmId);
  const reg = useRegistry(farmId);
  const markets = useLiveQuery(async () => ((await db.farm_profiles.where('farm_id').equals(farmId!).first())?.export_markets ?? []) as string[], [farmId]);
  const cropCodes = useLiveQuery(async () => {
    const [cycles, crops] = await Promise.all([db.crop_cycles.where('farm_id').equals(farmId!).toArray(), db.crops.toArray()]);
    const code = new Map(crops.map((c) => [c.id, c.code]));
    return new Map(cycles.filter((c) => alive(c) && c.status !== 'finished').map((c) => [c.greenhouse_id, code.get(c.crop_id) ?? null]));
  }, [farmId]);
  const actData = useActivityData(farmId);
  const formTypes = TYPES.filter((t) => can.canRecord(ACTIVITY_DOMAIN[t]));
  const ops = useLiveQuery(async () => (await db.operation_types.toArray()).filter((o) => alive(o) && (o.farm_id == null || o.farm_id === farmId)).sort((a, b) => a.sort_order - b.sort_order), [farmId]);
  const openRecs = useLiveQuery(async () => (await db.recommendations.where('farm_id').equals(farmId!).toArray())
    .filter((r) => alive(r) && (r.status === 'open' || r.status === 'in_progress' || r.id === existing?.a.recommendation_id)), [farmId]);
  const today = todayLocal();
  // تكرار معاملة: نفس المحتوى بتاريخ اليوم، كسجل جديد
  const src = existing ?? template;
  const a = src?.a;

  const recParam = sp.get('rec');
  const wanted = (a?.activity_type ?? sp.get('type')) as AType | null;
  const [type, setType] = useState<AType>(wanted && formTypes.includes(wanted) ? wanted : formTypes[0] ?? 'chemical_spray');
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
    workers_count: numStr(a?.workers_count),
    labor_hours: numStr(a?.labor_hours),
    quality: a?.quality ?? null as number | null,
    op_search: '',
  });
  const [picking, setPicking] = useState<string | null>(null); // مفتاح السطر الذي يختار مادة
  const [newOp, setNewOp] = useState<string | null>(null);
  const [ghIds, setGhIds] = useState<Set<string>>(() => new Set(src ? src.ags.map((x) => x.greenhouse_id) : sp.get('gh') ? [sp.get('gh')!] : []));
  const [lines, setLines] = useState<Line[]>(() => src?.aps.length
    ? src.aps.map((x) => ({ key: x.id, id: existing ? x.id : undefined, product_id: x.product_id, dose: numStr(x.dose), dose_unit: x.dose_unit ?? '', total_quantity: numStr(x.total_quantity), total_unit: x.total_unit ?? '', batch_no: x.batch_no ?? '' }))
    : [blankLine()]);
  const [files, setFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newProduct, setNewProduct] = useState<{ key: string; name: string; category: string | null } | null>(null); // سطر يضيف منتجًا
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  // المواد المستخدمة: إلزامية لكل المعاملات ماعدا العمليات الزراعية (اختيارية فيها)
  const usesProducts = true;
  const requireProducts = type !== 'cultural_operation';
  const allowedTypes = PRODUCT_TYPES_FOR[type];
  const majorCodes = MAJORS_FOR[type];
  const choosable = (products ?? []).filter((p) => {
    const m = cat?.majorOf(p.category_id);
    return m ? majorCodes.includes(m.code) : allowedTypes.includes(p.product_type);
  });
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

  // فحص التصدير: اعتماد الاتحاد الأوروبي + حدود المتبقيات لكل سوق على محاصيل الصوب المختارة
  const compliance = useMemo(() => {
    if (!reg || !chosen.length || type === 'cultural_operation' || type === 'bio_release') return [];
    const crops = [...new Set([...ghIds].map((g) => cropKey(cropCodes?.get(g))).filter(Boolean) as string[])];
    const out = new Map<string, { level: string; text: string }>();
    for (const p of chosen) {
      for (const c of crops.length ? crops : [null]) for (const x of complianceFor(p, reg, c, markets ?? [])) out.set(x.text, x);
    }
    return [...out.values()].sort((x, y) => (x.level === 'bad' ? -1 : 0) - (y.level === 'bad' ? -1 : 0));
  }, [reg, chosen.map((p) => p.id).join(), [...ghIds].join(), cropCodes, markets, type]);
  // توافق الخلط في نفس التنك
  const mix = useMemo(() => (chosen.length > 1 && type !== 'bio_release' && type !== 'cultural_operation' ? mixWarnings(chosen, cat) : []),
    [chosen.map((p) => p.id).join(), cat, type]);

  const recs = (openRecs ?? []).filter((r) => !r.greenhouse_id || ghIds.size === 0 || ghIds.has(r.greenhouse_id));

  function switchType(t: AType) {
    setType(t);
    setF((x) => ({ ...x, method: DEFAULT_METHOD[t] }));
    setLines((ls) => {
      const ok = ls.filter((l) => {
        const p = prodById.get(l.product_id);
        if (!p) return false;
        const m = cat?.majorOf(p.category_id);
        return m ? MAJORS_FOR[t].includes(m.code) : PRODUCT_TYPES_FOR[t].includes(p.product_type);
      });
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
    if (requireProducts && filled.length === 0) return setErr('أضف مادة واحدة على الأقل');
    const workers = toNum(f.workers_count);
    const hours = toNum(f.labor_hours);
    if (workers != null && (workers < 0 || !Number.isInteger(workers) || workers > 2000)) return setErr('عدد العمال رقم صحيح');
    if (hours != null && hours < 0) return setErr('ساعات العمل غير صحيحة');
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
        water_volume_l: type !== 'bio_release' && type !== 'cultural_operation' ? water : null,
        target_pest_id: (type === 'chemical_spray' || type === 'bio_release' || type === 'fertigation_injection') && f.target_pest_id ? f.target_pest_id : null,
        workers_count: workers,
        labor_hours: hours,
        quality: type === 'cultural_operation' ? f.quality : null,
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

  if (!ghs || !products || !pests || !ops || !cat) return null;
  const linesUi = (
    <div className="lines">
              {lines.map((l, i) => {
                const p = prodById.get(l.product_id);
                return (
                  <div key={l.key} className="line">
                    <div className="line-head">
                      <b>{i + 1}</b>
                      <ProductPickButton product={p} cat={cat} onOpen={() => setPicking(l.key)} />
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
                      <Field label="الكمية المستخدمة فعليًا"><input className="input ltr" inputMode="decimal" value={l.total_quantity} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, total_quantity: e.target.value } : x))} /></Field>
                      <Field label="وحدة الكمية"><input className="input" list="total-units" value={l.total_unit} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, total_unit: e.target.value } : x))} /></Field>
                      <Field label="رقم التشغيلة"><input className="input ltr" value={l.batch_no} onChange={(e) => setLines(lines.map((x) => x.key === l.key ? { ...x, batch_no: e.target.value } : x))} /></Field>
                    </div>
                  </div>
                );
              })}
              <datalist id="total-units">{['لتر', 'مل', 'كجم', 'جم', 'عبوة', 'خلية', 'كرتونة'].map((u) => <option key={u} value={u} />)}</datalist>
              <button type="button" className="btn ghost" onClick={() => setLines([...lines, blankLine()])}><Icon name="plus" /> مادة أخرى</button>
              {choosable.length === 0 && (
                <p className="banner warn" style={{ margin: 0 }}><Icon name="alert" /> لا توجد مواد من هذا النوع بعد. افتح اختيار المادة واضغط "إضافة مادة جديدة".</p>
              )}
            </div>
  );
  const opTerm = f.op_search.trim();
  const opsShown = ops.filter((o) => !opTerm || productMatches({ name: o.name_ar, active_ingredient: o.name_en } as Product, opTerm));

  return (
    <main className="page">
      <Link to={existing ? `/activities/${existing.a.id}` : '/activities'} className="back"><Icon name="back" size={18} /> {existing ? 'تفاصيل المعاملة' : 'سجل المعاملات'}</Link>
      <div className="page-head"><div><h1>{existing ? 'تعديل معاملة' : 'معاملة جديدة'}</h1></div></div>

      <form className="form act-form" onSubmit={submit}>
        <div className="type-pick" role="group" aria-label="نوع المعاملة">
          {formTypes.map((t) => (
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
            <Field label={type === 'cultural_operation' ? 'الخطوط / النطاق' : 'مكان المعالجة'} hint="مثلًا: الخطوط 1–12، أو البؤرة فقط"><input className="input" value={f.rows_scope} onChange={(e) => set('rows_scope', e.target.value)} /></Field>
          </div>
        </section>

        {type === 'cultural_operation' ? (
          <>
          <section className="panel panel-pad form">
            <h2 className="form-h">العملية</h2>
            <label className="search-box">
              <Icon name="search" size={20} />
              <input className="input" placeholder="ابحث عن العملية (حرث، تسوية، توريق، تطويش…)" value={f.op_search} onChange={(e) => set('op_search', e.target.value)} aria-label="بحث في العمليات" />
            </label>
            <div className="op-pick">
              {Object.entries(OP_CATEGORY_LABEL).map(([cat2, label]) => {
                const list = opsShown.filter((o) => o.category === cat2);
                if (!list.length && !can.addCatalog) return null;
                if (!list.length && opTerm) return null;
                return (
                  <div key={cat2}>
                    <h3>{label}</h3>
                    <div className="chips-pick">
                      {list.map((o) => <button type="button" key={o.id} aria-pressed={f.operation_type_id === o.id} onClick={() => set('operation_type_id', o.id)}>{o.name_ar}</button>)}
                      {can.addCatalog && <button type="button" className="add" onClick={() => setNewOp(cat2)}><Icon name="plus" size={16} /> عملية جديدة</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            {newOp && (
              <div className="inline-add">
                <input className="input" autoFocus placeholder={`عملية جديدة في ${OP_CATEGORY_LABEL[newOp as keyof typeof OP_CATEGORY_LABEL]}`} defaultValue={opTerm} id="new-op-name" />
                <button type="button" className="btn primary" onClick={async () => {
                  const el = document.getElementById('new-op-name') as HTMLInputElement | null;
                  const name = el?.value.trim();
                  if (!name) return;
                  const o = await create('operation_types', { farm_id: farmId!, code: `farm_${Date.now().toString(36)}`, name_ar: name, name_en: name, category: newOp as Row<'operation_types'>['category'], sort_order: 900 });
                  set('operation_type_id', o.id);
                  setNewOp(null);
                }}>إضافة</button>
                <button type="button" className="btn" onClick={() => setNewOp(null)}>إلغاء</button>
              </div>
            )}
          </section>
          <section className="panel panel-pad form">
            <h2 className="form-h">التنفيذ</h2>
            <div className="form-grid">
              <Field label="عدد العمال"><input className="input ltr" inputMode="numeric" value={f.workers_count} onChange={(e) => set('workers_count', e.target.value)} /></Field>
              <Field label="إجمالي ساعات العمل" hint="عدد العمال × ساعات كل عامل"><input className="input ltr" inputMode="decimal" value={f.labor_hours} onChange={(e) => set('labor_hours', e.target.value)} /></Field>
            </div>
            <div className="field">
              <span>جودة التنفيذ</span>
              <div className="quality-pick" role="group" aria-label="جودة التنفيذ">
                {[1, 2, 3, 4].map((q) => <button type="button" key={q} data-q={q} aria-pressed={f.quality === q} onClick={() => set('quality', f.quality === q ? null : q)}>{QUALITY_LABEL[q]}</button>)}
              </div>
            </div>
          </section>
          <section className="panel panel-pad form">
            <h2 className="form-h">مواد مستخدمة (اختياري)</h2>
            {linesUi}
          </section>
          </>
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

            {linesUi}

            {phiUntil && (
              <div className={`banner ${phiUntil > today ? 'bad' : 'info'}`} style={{ margin: 0 }}>
                <Icon name="shield" /> فترة الأمان {maxPhi} يوم — الحصاد مسموح من {formatDate(phiUntil)}
              </div>
            )}
            {moaWarn.map((w) => <div key={w} className="banner warn" style={{ margin: 0 }}><Icon name="alert" /> {w}</div>)}
            {mix.map((w) => <div key={w.text} className={`banner ${w.level}`} style={{ margin: 0 }}><Icon name="alert" /> <span><b>توافق الخلط:</b> {w.text}{w.source && <small className="faint" style={{ display: 'block' }}>المصدر: {w.source}</small>}</span></div>)}
            {compliance.length > 0 && (
              <div className="compliance">
                <h3><Icon name="globe" size={18} /> التصدير وحدود المتبقيات{markets?.length ? ` (${markets.join('، ')})` : ''}</h3>
                {compliance.map((c) => <p key={c.text} className={`cmp ${c.level}`}>{c.text}</p>)}
              </div>
            )}
            {!markets?.length && type === 'chemical_spray' && chosen.length > 0 && (
              <p className="faint" style={{ margin: 0 }}>حدّد أسواق التصدير من بيانات الموقع لعرض حدود المتبقيات واعتماد الاتحاد الأوروبي لكل مادة.</p>
            )}
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

      {picking && (
        <ProductPickerSheet
          products={choosable}
          cat={cat}
          majorCodes={majorCodes}
          title={type === 'bio_release' ? 'اختيار العدو الحيوي' : 'اختيار المادة'}
          canAdd={can.addCatalog}
          onClose={() => setPicking(null)}
          onPick={(np) => {
            setLines(lines.map((x) => x.key === picking ? {
              ...x, product_id: np.id,
              dose: x.dose || (np.default_dose != null ? String(Number(np.default_dose)) : ''),
              dose_unit: x.dose_unit || np.default_dose_unit || '',
            } : x));
            setPicking(null);
          }}
          onAddNew={(name, sub) => { setNewProduct({ key: picking, name, category: sub }); setPicking(null); }}
        />
      )}
      {newProduct && (
        <ProductSheet
          farmId={farmId!}
          defaultType={allowedTypes[0]}
          defaultName={newProduct.name}
          defaultCategory={newProduct.category}
          majorCodes={majorCodes}
          onClose={() => setNewProduct(null)}
          onSaved={(p) => {
            setLines(lines.map((x) => x.key === newProduct.key ? { ...x, product_id: p.id, dose_unit: x.dose_unit || p.default_dose_unit || '' } : x));
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

// ── كتالوج المواد (بالتصنيف العلمي) ─────────────────────────────────
export function ProductList() {
  const { farmId, can } = useApp();
  const products = useProducts(farmId, true);
  const cat = useCatalog(farmId);
  const reg = useRegistry(farmId);
  const [sp, setSp] = useSearchParams();
  const major = sp.get('m') ?? '';
  const sub = sp.get('s') ?? '';
  const [edit, setEdit] = useState<{ existing?: Product; base?: Product; category?: string | null; name?: string } | null>(null);
  const [kind, setKind] = useState<'' | 'bio' | 'chem'>('');
  const [q, setQ] = useState('');
  if (!products || !cat) return null;
  const setParam = (m: string, s2: string) => {
    const n = new URLSearchParams(sp);
    if (m) n.set('m', m); else n.delete('m');
    if (s2) n.set('s', s2); else n.delete('s');
    setSp(n, { replace: true });
  };
  const inMajor = (p: Product) => !major || cat.majorOf(p.category_id)?.id === major || (major === 'none' && !p.category_id);
  const list = products.filter((p) => inMajor(p) && (!sub || p.category_id === sub)
    && (!kind || (kind === 'bio') === !!p.is_bio) && productMatches(p, q, cat));
  const count = (mid: string) => products.filter((p) => cat.majorOf(p.category_id)?.id === mid).length;
  const uncategorized = products.filter((p) => !p.category_id || !cat.byId.has(p.category_id)).length;
  const groups = new Map<string, Product[]>();
  for (const p of list) {
    const k = p.category_id && cat.byId.has(p.category_id) ? p.category_id : '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  const order = [...groups.keys()].sort((a, b) => {
    const ma = cat.majorOf(a), mb = cat.majorOf(b);
    return ((ma?.sort_order ?? 9999) - (mb?.sort_order ?? 9999)) || ((cat.byId.get(a)?.sort_order ?? 9999) - (cat.byId.get(b)?.sort_order ?? 9999));
  });
  const scopeName = sub ? cat.byId.get(sub)?.name_ar : major && major !== 'none' ? cat.byId.get(major)?.name_ar : major === 'none' ? 'غير المصنّف' : 'كل المواد';
  const euBadge = (p: Product) => {
    const subs = reg?.substancesOf(p) ?? [];
    if (!subs.length) return null;
    const bad = subs.some((x) => x.eu_status === 'not_approved');
    const ok = subs.every((x) => x.eu_status === 'approved');
    return bad ? <span className="chip bad sm" title="غير معتمدة في الاتحاد الأوروبي">EU ✕</span> : ok ? <span className="chip ok sm" title="معتمدة في الاتحاد الأوروبي">EU ✓</span> : null;
  };
  return (
    <main className="page">
      <Link to="/activities" className="back"><Icon name="back" size={18} /> سجل المعاملات</Link>
      <div className="page-head">
        <div><h1>كتالوج المواد</h1><p>{products.length} مادة مصنّفة علميًا: أسمدة ومنشطات ومبيدات كيميائية وحيوية وأعداء حيوية وزيوت ومصائد ومواد خدمة الأرض</p></div>
        <div className="row">
          <Link to="/registry" className="btn"><Icon name="globe" size={20} /> سجل المبيدات</Link>
          {can.addCatalog && <button className="btn primary" onClick={() => setEdit({ category: sub || null, name: q.trim() })}><Icon name="plus" /> مادة جديدة</button>}
        </div>
      </div>
      <div className="cat-tabs" role="group" aria-label="الفئة الكبرى">
        <button type="button" aria-pressed={!major} onClick={() => setParam('', '')}>الكل <span className="num">{products.length}</span></button>
        {cat.majors.map((m) => (
          <button type="button" key={m.id} aria-pressed={major === m.id} onClick={() => setParam(m.id, '')}>{m.name_ar} <span className="num">{count(m.id)}</span></button>
        ))}
        {uncategorized > 0 && <button type="button" aria-pressed={major === 'none'} onClick={() => setParam('none', '')}>غير مصنّف <span className="num">{uncategorized}</span></button>}
      </div>
      {major && major !== 'none' && (
        <div className="chips-scroll sub" role="group" aria-label="الفئة الصغرى">
          <button type="button" aria-pressed={!sub} onClick={() => setParam(major, '')}>كل {cat.byId.get(major)?.name_ar}</button>
          {cat.subs(major).map((s2) => <button type="button" key={s2.id} aria-pressed={sub === s2.id} onClick={() => setParam(major, s2.id)}>{s2.name_ar}</button>)}
        </div>
      )}
      <div className="filters">
        <label className="search-box" style={{ flex: '1 1 220px' }}>
          <Icon name="search" size={20} />
          <input className="input" placeholder={`ابحث في ${scopeName} بالاسم أو المادة الفعالة أو الآفة`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في المواد" />
        </label>
        <div className="seg" role="group" aria-label="المصدر">
          {([['', 'الكل'], ['bio', 'حيوي وطبيعي'], ['chem', 'كيميائي وأسمدة']] as const).map(([k, l]) => (
            <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
          ))}
        </div>
      </div>
      {order.map((k) => (
        <section key={k || 'none'} className="cat-section">
          <h2 className="section-title">
            <span>{k ? cat.path(k) : 'غير مصنّف'} <span className="faint num">({groups.get(k)!.length})</span></span>
            {can.addCatalog && k && <button className="btn ghost" onClick={() => setEdit({ category: k, name: q.trim() })}><Icon name="plus" size={18} /> إضافة في {cat.byId.get(k)?.name_ar}</button>}
          </h2>
          <div className="panel scroll-x">
            <table className="tbl prod-tbl">
              <thead><tr><th>المادة</th><th>المادة الفعالة</th><th>المجموعة</th><th>الجرعة</th><th>فترة الأمان</th><th /></tr></thead>
              <tbody>
                {groups.get(k)!.map((p) => (
                  <tr key={p.id} style={!p.is_active ? { opacity: 0.5 } : undefined}>
                    <td>
                      <b>{p.name}</b>{p.is_bio && <span className="chip ok sm" style={{ marginInlineStart: 6 }}>حيوي</span>}{euBadge(p)}
                      {p.targets && <small className="muted" style={{ display: 'block' }}>{p.targets}</small>}
                      {p.farm_id == null ? <small className="faint" style={{ display: 'block' }}>كتالوج عام</small> : <small className="faint" style={{ display: 'block' }}>خاص بالمشروع{p.eg_reg_no ? ` · تسجيل ${p.eg_reg_no}` : ''}</small>}
                    </td>
                    <td>{p.active_ingredient ?? p.bio_species ?? '—'}{p.concentration ? ` ${p.concentration}` : ''}</td>
                    <td className="n">{p.moa_code ?? '—'}</td>
                    <td className="n">{doseText(p) ?? '—'}</td>
                    <td className="n">{p.phi_days != null ? `${p.phi_days} يوم` : '—'}</td>
                    <td>
                      {p.farm_id
                        ? (can.addCatalog && <button className="btn ghost" onClick={() => setEdit({ existing: p })}><Icon name="edit" size={18} /> تعديل</button>)
                        : (can.addCatalog && <button className="btn ghost" title="انسخها للمشروع لتسجيل فترة الأمان والجرعة حسب العبوة المسجلة" onClick={() => setEdit({ base: p })}><Icon name="edit" size={18} /> خصّص</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {list.length === 0 && (
        <div className="panel empty" style={{ marginTop: 12 }}>
          <h3>لا توجد مواد مطابقة في {scopeName}</h3>
          {can.addCatalog && <button className="btn primary" onClick={() => setEdit({ category: sub || null, name: q.trim() })}><Icon name="plus" /> {q.trim() ? `إضافة "${q.trim()}"` : 'إضافة مادة'}</button>}
        </div>
      )}
      {edit && <ProductSheet farmId={farmId!} existing={edit.existing} base={edit.base} defaultCategory={edit.category} defaultName={edit.name} onClose={() => setEdit(null)} onSaved={() => setEdit(null)} />}
    </main>
  );
}

export function ProductSheet({ farmId, existing, base, defaultType, allowedTypes, defaultName, defaultCategory, majorCodes, onClose, onSaved }: {
  farmId: string; existing?: Product; base?: Product; defaultType?: Product['product_type']; allowedTypes?: Product['product_type'][];
  defaultName?: string; defaultCategory?: string | null; majorCodes?: string[];
  onClose: () => void; onSaved: (p: Product) => void;
}) {
  const { toast, can } = useApp();
  const cat = useCatalog(farmId);
  // base = نسخة من مادة الكتالوج العام تُحفظ للمزرعة (تغطي الأصل بنفس الاسم)
  const src = existing ?? base;
  const [f, setF] = useState({
    name: src?.name ?? defaultName ?? '',
    category_id: (src?.category_id ?? defaultCategory ?? null) as string | null,
    eg_reg_no: src?.eg_reg_no ?? '',
    eg_registered_crops: src?.eg_registered_crops ?? '',
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
          category_id: f.category_id, eg_reg_no: f.eg_reg_no.trim() || null, eg_registered_crops: f.eg_registered_crops.trim() || null,
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
        {cat && (
          <CategoryField cat={cat} value={f.category_id} farmId={farmId} canAdd={can.addCatalog} majorCodes={existing || base ? undefined : majorCodes}
            onChange={(id, c) => setF((x) => ({
              ...x, category_id: id,
              product_type: c?.default_product_type && (!allowedTypes?.length || allowedTypes.includes(c.default_product_type)) ? c.default_product_type : x.product_type,
              is_bio: c ? c.is_bio || x.is_bio : x.is_bio,
            }))} />
        )}
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
              <Field label="رقم التسجيل (لجنة المبيدات)"><input className="input ltr" value={f.eg_reg_no} onChange={(e) => set('eg_reg_no', e.target.value)} /></Field>
              <Field label="المحاصيل المسجّل عليها"><input className="input" value={f.eg_registered_crops} onChange={(e) => set('eg_registered_crops', e.target.value)} /></Field>
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
