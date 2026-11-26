// المخازن: الرصيد لحظيًا من حركات الاستلام والصرف (بالتشغيلة وتاريخ الصلاحية)، وحد إعادة الطلب، ووزن الحصاد.
import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, update } from '../lib/repo';
import { addDays, phiByGreenhouse } from '../lib/ipm';
import { formatDate, isoWeek, todayLocal, weekSpan } from '../lib/dates';
import { useCatalog, useCatalogProducts, productMatches, type Product } from '../lib/catalog';
import { useGreenhouses, usePeople } from '../lib/hooks';
import { useZones, useGhLabels } from '../lib/zones';
import { useOverview } from '../lib/overview';
import { HARVEST_GRADE_LABEL, MOVEMENT_LABEL, STOCK_UNITS, WAREHOUSE_KIND_LABEL } from '../lib/labels';
import { GhOptions } from '../components/ZoneBrowser';
import { Field, numStr, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { ProductPickButton, ProductPickerSheet } from '../components/Catalog';
import { ProductSheet } from './Activities';
import type { Row } from '../lib/schema';
import { computeBalances, sign, type Balance } from '../lib/store';
export { computeBalances };

type MType = 'receipt' | 'issue' | 'return' | 'adjust_in' | 'adjust_out' | 'transfer_out';
const fmt = (n: number) => Number(n.toFixed(3)).toLocaleString('en-US', { maximumFractionDigits: 3 });

function useStore(farmId: string | null) {
  return useLiveQuery(async () => {
    if (!farmId) return null;
    const [whs, items, moves] = await Promise.all([
      db.warehouses.where('farm_id').equals(farmId).toArray(),
      db.stock_items.where('farm_id').equals(farmId).toArray(),
      db.stock_movements.where('farm_id').equals(farmId).toArray(),
    ]);
    return { whs: whs.filter(alive).sort((a, b) => a.name.localeCompare(b.name, 'ar')), items: items.filter(alive), moves: moves.filter(alive) };
  }, [farmId]);
}

export function StoreHome() {
  const { farmId, can, toast } = useApp();
  const data = useStore(farmId);
  const products = useCatalogProducts(farmId, true);
  const cat = useCatalog(farmId);
  const people = usePeople();
  const ghs = useGreenhouses(farmId);
  const labels = useGhLabels(farmId);
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') ?? 'balance';
  const [q, setQ] = useState('');
  const [major, setMajor] = useState('');
  const [move, setMove] = useState<{ type: MType; product?: Product; warehouse?: string } | null>(null);
  const [whSheet, setWhSheet] = useState(false);
  const [itemSheet, setItemSheet] = useState<{ product: Product; item?: Row<'stock_items'> } | null>(null);
  const today = todayLocal();

  const balances = useMemo(() => (data ? computeBalances(data.moves) : []), [data]);
  if (!can.store) return <Navigate to="/" replace />;
  if (!data || !products || !cat) return null;
  const write = can.canRecord('store');
  const prod = new Map(products.map((p) => [p.id, p]));
  const allProds = new Map<string, Product>(products.map((p) => [p.id, p]));
  const wh = new Map(data.whs.map((w) => [w.id, w]));
  const itemOf = new Map(data.items.map((i) => [i.product_id, i]));
  // إجمالي الصنف عبر المخازن (لحد إعادة الطلب)
  const totalBy = new Map<string, number>();
  for (const b of balances) totalBy.set(b.product_id, (totalBy.get(b.product_id) ?? 0) + b.qty);
  const rows = balances.filter((b) => {
    const p = allProds.get(b.product_id);
    if (!p) return false;
    if (major && cat.majorOf(p.category_id)?.id !== major) return false;
    return productMatches(p, q, cat) || (wh.get(b.warehouse_id)?.name ?? '').includes(q);
  }).sort((a, b) => (allProds.get(a.product_id)?.name ?? '').localeCompare(allProds.get(b.product_id)?.name ?? '', 'ar'));
  const low = [...totalBy.entries()].filter(([pid, t]) => { const mi = itemOf.get(pid)?.min_qty; return mi != null && t <= Number(mi); });
  const expiring = balances.flatMap((b) => b.batches.filter((x) => x.expiry && x.expiry <= addDays(today, 60)).map((x) => ({ b, x })));
  const recent = [...data.moves].sort((a, b) => (a.moved_on === b.moved_on ? (a.created_at < b.created_at ? 1 : -1) : a.moved_on < b.moved_on ? 1 : -1)).slice(0, 200);
  const setTab = (t: string) => { const n = new URLSearchParams(sp); n.set('tab', t); setSp(n, { replace: true }); };

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>المخزن</h1><p>{data.whs.length} مخزن، {totalBy.size} صنف له رصيد</p></div>
        <div className="row">
          <Link to="/harvest" className="btn"><Icon name="scale" size={20} /> الحصاد</Link>
          {can.requestPurchase && <Link to="/purchases" className="btn"><Icon name="cart" size={20} /> المشتريات</Link>}
        </div>
      </div>

      {data.whs.length === 0 ? (
        <div className="panel empty">
          <h3>ابدأ بتعريف المخازن</h3>
          <p>مثلًا: مخزن المبيدات، مخزن الأسمدة، المستلزمات، ثلاجة الحصاد.</p>
          {write && <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={async () => {
              for (const [name, kind] of [['مخزن المبيدات', 'pesticides'], ['مخزن الأسمدة', 'fertilizers'], ['مخزن المستلزمات', 'supplies'], ['ثلاجة الحصاد', 'harvest']] as const)
                await create('warehouses', { farm_id: farmId!, name, kind });
              toast('تم إنشاء المخازن الأساسية');
            }}><Icon name="plus" /> إنشاء المخازن الأساسية</button>
            <button className="btn" onClick={() => setWhSheet(true)}>مخزن مخصص</button>
          </div>}
        </div>
      ) : (
        <>
          {write && (
            <div className="store-actions">
              <button className="action primary" onClick={() => setMove({ type: 'receipt' })}><span className="ico"><Icon name="download" size={26} /></span><b>استلام</b><small>وارد من مورد أو طلب شراء</small></button>
              <button className="action" onClick={() => setMove({ type: 'issue' })}><span className="ico"><Icon name="upload" size={26} /></span><b>صرف</b><small>لصوبة أو مهندس أو معاملة</small></button>
              <button className="action" onClick={() => setMove({ type: 'return' })}><span className="ico"><Icon name="sync" size={26} /></span><b>مرتجع</b><small>رجوع كمية للمخزن</small></button>
              <button className="action" onClick={() => setMove({ type: 'adjust_out' })}><span className="ico"><Icon name="edit" size={26} /></span><b>تسوية جرد</b><small>عجز أو زيادة أو تالف</small></button>
            </div>
          )}
          {(low.length > 0 || expiring.length > 0) && (
            <div className="store-alerts">
              {low.map(([pid, t]) => <div key={pid} className="banner warn"><Icon name="alert" /> {prod.get(pid)?.name ?? allProds.get(pid)?.name}: الرصيد {fmt(t)} — وصل لحد إعادة الطلب ({fmt(Number(itemOf.get(pid)!.min_qty))})</div>)}
              {expiring.slice(0, 6).map(({ b, x }) => <div key={`${b.product_id}${b.warehouse_id}${x.batch}`} className={`banner ${x.expiry! < today ? 'bad' : 'info'}`}><Icon name="clock" /> {allProds.get(b.product_id)?.name} — تشغيلة {x.batch}: {x.expiry! < today ? 'منتهية الصلاحية' : 'تنتهي'} {formatDate(x.expiry!)} ({fmt(x.qty)} {b.unit})</div>)}
            </div>
          )}
          <div className="seg" role="tablist" style={{ marginBottom: 12 }}>
            <button aria-pressed={tab === 'balance'} onClick={() => setTab('balance')}>الرصيد</button>
            <button aria-pressed={tab === 'moves'} onClick={() => setTab('moves')}>الحركات</button>
            <button aria-pressed={tab === 'whs'} onClick={() => setTab('whs')}>المخازن</button>
          </div>

          {tab === 'balance' && (
            <>
              <div className="filters">
                <label className="search-box" style={{ flex: '1 1 220px' }}>
                  <Icon name="search" size={20} />
                  <input className="input" placeholder="ابحث عن صنف أو مخزن" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في الرصيد" />
                </label>
                <select className="select" style={{ width: 'auto' }} value={major} onChange={(e) => setMajor(e.target.value)} aria-label="الفئة">
                  <option value="">كل الفئات</option>
                  {cat.majors.map((m) => <option key={m.id} value={m.id}>{m.name_ar}</option>)}
                </select>
              </div>
              {rows.length === 0 ? <div className="panel empty"><h3>لا يوجد رصيد بعد</h3><p>سجّل أول استلام، والرصيد يتحسب تلقائيًا من الحركات.</p></div> : (
                <div className="panel scroll-x">
                  <table className="tbl">
                    <thead><tr><th>الصنف</th><th>المخزن</th><th>الرصيد</th><th>التشغيلات (الأقرب انتهاءً أولًا)</th><th /></tr></thead>
                    <tbody>
                      {rows.map((b) => {
                        const p = allProds.get(b.product_id)!;
                        const it = itemOf.get(b.product_id);
                        const isLow = it?.min_qty != null && (totalBy.get(b.product_id) ?? 0) <= Number(it.min_qty);
                        return (
                          <tr key={`${b.product_id}|${b.warehouse_id}`}>
                            <td><b>{p.name}</b><small className="faint" style={{ display: 'block' }}>{cat.path(p.category_id)}</small></td>
                            <td>{wh.get(b.warehouse_id)?.name ?? '—'}</td>
                            <td className="n"><b className={b.qty < 0 ? 'neg' : isLow ? 'low' : ''}>{fmt(b.qty)}</b> {b.unit}{it?.min_qty != null && <small className="faint" style={{ display: 'block' }}>حد الطلب {fmt(Number(it.min_qty))}</small>}</td>
                            <td>{b.batches.length ? b.batches.slice(0, 3).map((x) => <span key={x.batch} className={`chip sm ${x.expiry && x.expiry < today ? 'bad' : ''}`}>{x.batch} · {fmt(x.qty)}{x.expiry ? ` · ${formatDate(x.expiry)}` : ''}</span>) : '—'}</td>
                            <td className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                              {write && <button className="btn ghost sm" onClick={() => setMove({ type: 'issue', product: p, warehouse: b.warehouse_id })}>صرف</button>}
                              {write && <button className="btn ghost sm" onClick={() => setItemSheet({ product: p, item: it })}>حد الطلب</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'moves' && (
            <ul className="list panel">
              {recent.length === 0 && <li className="list-item muted">لا توجد حركات بعد</li>}
              {recent.map((m) => {
                const p = allProds.get(m.product_id);
                return (
                  <li key={m.id} className="list-item">
                    <span className={`mv-badge ${sign(m.movement_type) > 0 ? 'in' : 'out'}`}>{sign(m.movement_type) > 0 ? '+' : '−'}</span>
                    <span className="grow">
                      <b>{MOVEMENT_LABEL[m.movement_type]} — {p?.name ?? 'صنف'}</b>
                      <small className="muted" style={{ display: 'block' }}>
                        {[formatDate(m.moved_on), wh.get(m.warehouse_id)?.name, m.batch_no && `تشغيلة ${m.batch_no}`, m.supplier && `المورد: ${m.supplier}`,
                          m.greenhouse_id && `صوبة ${labels?.get(m.greenhouse_id) ?? ''}`, m.issued_to && `استلمها: ${m.issued_to}`, m.document_no && `مستند ${m.document_no}`,
                          `سجّلها ${people.get(m.created_by ?? '') ?? '—'}`].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                    <b className="num">{fmt(Number(m.qty))} {m.unit}</b>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === 'whs' && (
            <>
              <ul className="list panel">
                {data.whs.map((w) => (
                  <li key={w.id} className="list-item">
                    <Icon name="store" />
                    <span className="grow"><b>{w.name}</b><small className="muted" style={{ display: 'block' }}>{WAREHOUSE_KIND_LABEL[w.kind]}</small></span>
                    <span className="faint num">{balances.filter((b) => b.warehouse_id === w.id && b.qty > 0).length} صنف</span>
                  </li>
                ))}
              </ul>
              {write && <button className="btn" style={{ marginTop: 12 }} onClick={() => setWhSheet(true)}><Icon name="plus" /> مخزن جديد</button>}
            </>
          )}
        </>
      )}

      {move && <MovementSheet farmId={farmId!} type={move.type} product={move.product} warehouseId={move.warehouse ?? data.whs[0]?.id}
        whs={data.whs} balances={balances} items={itemOf} products={products} ghs={(ghs ?? []).map((x) => x.g)} onClose={() => setMove(null)} />}
      {whSheet && <WarehouseSheet farmId={farmId!} onClose={() => setWhSheet(false)} />}
      {itemSheet && <ItemSheet farmId={farmId!} product={itemSheet.product} item={itemSheet.item} whs={data.whs} onClose={() => setItemSheet(null)} />}
    </main>
  );
}

function WarehouseSheet({ farmId, onClose }: { farmId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('general');
  return (
    <Sheet title="مخزن جديد" onClose={onClose}>
      <form className="form" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await create('warehouses', { farm_id: farmId, name: name.trim(), kind }); onClose(); }}>
        <Field label="اسم المخزن"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        <Field label="النوع"><select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(WAREHOUSE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <div className="form-actions"><button className="btn primary">حفظ</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}

function ItemSheet({ farmId, product, item, whs, onClose }: { farmId: string; product: Product; item?: Row<'stock_items'>; whs: Row<'warehouses'>[]; onClose: () => void }) {
  const [unit, setUnit] = useState(item?.stock_unit ?? 'كجم');
  const [min, setMin] = useState(numStr(item?.min_qty));
  const [whId, setWhId] = useState(item?.default_warehouse_id ?? '');
  return (
    <Sheet title={`إعدادات ${product.name}`} onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        const v = { stock_unit: unit, min_qty: toNum(min), default_warehouse_id: whId || null };
        if (item) await update('stock_items', item.id, v); else await create('stock_items', { ...v, farm_id: farmId, product_id: product.id });
        onClose();
      }}>
        <div className="form-grid">
          <Field label="وحدة التخزين"><select className="select" value={unit} onChange={(e) => setUnit(e.target.value)}>{STOCK_UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="حد إعادة الطلب" hint="تنبيه لما الرصيد يوصل له"><input className="input ltr" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
          <Field label="المخزن الافتراضي"><select className="select" value={whId} onChange={(e) => setWhId(e.target.value)}><option value="">—</option>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        </div>
        <div className="form-actions"><button className="btn primary">حفظ</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}

export function MovementSheet({ farmId, type: initialType, product: initialProduct, warehouseId, whs, balances, items, products, ghs, purchaseRequestId, onClose, onSaved }: {
  farmId: string; type: MType; product?: Product; warehouseId?: string; whs: Row<'warehouses'>[]; balances: Balance[];
  items: Map<string, Row<'stock_items'>>; products: Product[]; ghs: Row<'greenhouses'>[]; purchaseRequestId?: string;
  onClose: () => void; onSaved?: () => void;
}) {
  const { toast, can } = useApp();
  const cat = useCatalog(farmId);
  const idx = useZones(farmId);
  const prs = useLiveQuery(async () => (await db.purchase_requests.where('farm_id').equals(farmId).toArray())
    .filter((r) => alive(r) && ['approved', 'ordered', 'partially_received'].includes(r.status)), [farmId]);
  const [type, setType] = useState<MType>(initialType);
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState<{ name: string; cat: string | null } | null>(null);
  const it = product ? items.get(product.id) : undefined;
  const [f, setF] = useState({
    warehouse_id: warehouseId ?? '', qty: '', unit: it?.stock_unit ?? 'كجم', moved_on: todayLocal(), batch_no: '', expiry_date: '',
    supplier: '', document_no: '', unit_price: '', greenhouse_id: '', issued_to: '', notes: '', purchase_request_id: purchaseRequestId ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const bal = product ? balances.find((b) => b.product_id === product.id && b.warehouse_id === f.warehouse_id) : undefined;
  const out = sign(type) < 0;
  const isAdjust = type === 'adjust_in' || type === 'adjust_out';
  if (!cat) return null;

  return (
    <Sheet title={MOVEMENT_LABEL[type]} onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        if (!product) return setErr('اختر الصنف');
        if (!f.warehouse_id) return setErr('اختر المخزن');
        const qty = toNum(f.qty);
        if (qty == null || qty <= 0) return setErr('الكمية لازم تكون أكبر من صفر');
        if (f.moved_on > todayLocal()) return setErr('التاريخ لا يمكن أن يكون في المستقبل');
        if (out && type !== 'adjust_out' && (bal?.qty ?? 0) < qty) return setErr(`الرصيد غير كافٍ: المتاح ${fmt(bal?.qty ?? 0)} ${bal?.unit ?? f.unit}`);
        if (out && f.batch_no) {
          const b = bal?.batches.find((x) => x.batch === f.batch_no);
          if (b && b.qty < qty) return setErr(`رصيد التشغيلة ${f.batch_no} هو ${fmt(b.qty)} فقط`);
        }
        const price = toNum(f.unit_price);
        await create('stock_movements', {
          farm_id: farmId, warehouse_id: f.warehouse_id, product_id: product.id, movement_type: type, qty, unit: f.unit,
          moved_on: f.moved_on, batch_no: f.batch_no.trim() || null, expiry_date: type === 'receipt' && f.expiry_date ? f.expiry_date : null,
          supplier: type === 'receipt' ? f.supplier.trim() || null : null, document_no: f.document_no.trim() || null,
          unit_price: type === 'receipt' ? price : null, purchase_request_id: type === 'receipt' && f.purchase_request_id ? f.purchase_request_id : null,
          greenhouse_id: type === 'issue' && f.greenhouse_id ? f.greenhouse_id : null, issued_to: out ? f.issued_to.trim() || null : null,
          notes: f.notes.trim() || null,
        });
        if (!it) await create('stock_items', { farm_id: farmId, product_id: product.id, stock_unit: f.unit, default_warehouse_id: f.warehouse_id });
        toast(`تم تسجيل ${MOVEMENT_LABEL[type]} ${fmt(qty)} ${f.unit} ${product.name}`);
        onSaved?.();
        onClose();
      }}>
        {isAdjust && (
          <div className="seg" role="group" aria-label="نوع التسوية">
            <button type="button" aria-pressed={type === 'adjust_out'} onClick={() => setType('adjust_out')}>عجز / تالف</button>
            <button type="button" aria-pressed={type === 'adjust_in'} onClick={() => setType('adjust_in')}>زيادة في الجرد</button>
          </div>
        )}
        <div className="field"><span>الصنف</span><ProductPickButton product={product} cat={cat} onOpen={() => setPicking(true)} placeholder="اختر الصنف…" /></div>
        <div className="form-grid">
          <Field label="المخزن"><select className="select" value={f.warehouse_id} onChange={(e) => set('warehouse_id', e.target.value)}><option value="">—</option>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          <Field label="التاريخ"><input className="input" type="date" max={todayLocal()} value={f.moved_on} onChange={(e) => set('moved_on', e.target.value)} /></Field>
          <Field label="الكمية"><input className="input ltr" inputMode="decimal" value={f.qty} onChange={(e) => set('qty', e.target.value)} autoFocus={!!product} /></Field>
          <Field label="الوحدة"><select className="select" value={f.unit} onChange={(e) => set('unit', e.target.value)}>{STOCK_UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
        </div>
        {product && f.warehouse_id && <p className="faint" style={{ margin: 0 }}>الرصيد الحالي في المخزن: <b className="num">{fmt(bal?.qty ?? 0)}</b> {bal?.unit ?? f.unit}</p>}
        {out && bal && bal.batches.length > 0 && (
          <div className="field">
            <span>التشغيلة (الأقرب انتهاءً أولًا)</span>
            <div className="chips-pick">
              {bal.batches.map((b) => <button type="button" key={b.batch} aria-pressed={f.batch_no === b.batch} onClick={() => set('batch_no', b.batch === '—' ? '' : b.batch)}>{b.batch} · {fmt(b.qty)}{b.expiry ? ` · ${formatDate(b.expiry)}` : ''}</button>)}
            </div>
          </div>
        )}
        {type === 'receipt' && (
          <div className="form-grid">
            <Field label="رقم التشغيلة"><input className="input ltr" value={f.batch_no} onChange={(e) => set('batch_no', e.target.value)} /></Field>
            <Field label="تاريخ انتهاء الصلاحية"><input className="input" type="date" value={f.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} /></Field>
            <Field label="المورد"><input className="input" value={f.supplier} onChange={(e) => set('supplier', e.target.value)} /></Field>
            <Field label="رقم الفاتورة / إذن الاستلام"><input className="input ltr" value={f.document_no} onChange={(e) => set('document_no', e.target.value)} /></Field>
            <Field label="سعر الوحدة (اختياري)"><input className="input ltr" inputMode="decimal" value={f.unit_price} onChange={(e) => set('unit_price', e.target.value)} /></Field>
            {prs && prs.length > 0 && (
              <Field label="طلب الشراء"><select className="select" value={f.purchase_request_id} onChange={(e) => set('purchase_request_id', e.target.value)}><option value="">—</option>{prs.map((r) => <option key={r.id} value={r.id}>{r.request_no ?? formatDate(r.requested_on)}</option>)}</select></Field>
            )}
          </div>
        )}
        {type === 'issue' && (
          <div className="form-grid">
            <Field label="الصوبة"><select className="select" value={f.greenhouse_id} onChange={(e) => set('greenhouse_id', e.target.value)}><option value="">—</option><GhOptions idx={idx} ghs={ghs} /></select></Field>
            <Field label="المستلم" hint="المهندس أو المشرف"><input className="input" value={f.issued_to} onChange={(e) => set('issued_to', e.target.value)} /></Field>
            <Field label="رقم إذن الصرف"><input className="input ltr" value={f.document_no} onChange={(e) => set('document_no', e.target.value)} /></Field>
          </div>
        )}
        <Field label={isAdjust ? 'سبب التسوية' : 'ملاحظات'}><input className="input" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions"><button className="btn primary"><Icon name="check" /> حفظ</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
      {picking && (
        <ProductPickerSheet products={products.filter((p) => p.is_active)} cat={cat} title="اختيار الصنف" canAdd={can.addCatalog}
          onClose={() => setPicking(false)}
          onPick={(p) => { setProduct(p); const s = items.get(p.id); setF((x) => ({ ...x, unit: s?.stock_unit ?? x.unit, warehouse_id: x.warehouse_id || s?.default_warehouse_id || '' })); setPicking(false); }}
          onAddNew={(name, c) => { setAdding({ name, cat: c }); setPicking(false); }} />
      )}
      {adding && <ProductSheet farmId={farmId} defaultName={adding.name} defaultCategory={adding.cat} onClose={() => setAdding(null)} onSaved={(p) => { setProduct(p); setAdding(null); }} />}
    </Sheet>
  );
}

// ── الحصاد ───────────────────────────────────────────────────────────
export function HarvestScreen() {
  const { farmId, can, toast } = useApp();
  const ghs = useGreenhouses(farmId);
  const idx = useZones(farmId);
  const labels = useGhLabels(farmId);
  const overview = useOverview(farmId).data;
  const today = todayLocal();
  const { year, week } = isoWeek(today);
  const records = useLiveQuery(async () => (farmId ? (await db.harvest_records.where('farm_id').equals(farmId).toArray()).filter(alive) : []), [farmId]);
  const whs = useLiveQuery(async () => (farmId ? (await db.warehouses.where('farm_id').equals(farmId).toArray()).filter(alive) : []), [farmId]);
  // فترة الأمان: من المعاملات المحلية لو مرئية، وإلا من اللوحة العامة (أرقام مجمّعة من السيرفر)
  const localPhi = useLiveQuery(async () => {
    if (!farmId) return new Map<string, string>();
    const [acts, ags, aps, prods] = await Promise.all([
      db.activities.where('farm_id').equals(farmId).toArray(), db.activity_greenhouses.where('farm_id').equals(farmId).toArray(),
      db.activity_products.where('farm_id').equals(farmId).toArray(), db.products.toArray()]);
    const m = phiByGreenhouse(acts, ags, aps, prods, today);
    return new Map([...m.entries()].map(([g, v]) => [g, v.until]));
  }, [farmId]);
  const [f, setF] = useState({ greenhouse_id: '', harvested_on: today, grade: 'first', weight_kg: '', boxes_count: '', warehouse_id: '', notes: '' });
  const [err, setErr] = useState<string | null>(null);
  const [confirmPhi, setConfirmPhi] = useState(false);
  if (!can.store) return <Navigate to="/" replace />;
  if (!ghs || !records) return null;
  const write = can.canRecord('store');
  const phiUntil = (gid: string) => {
    const a = localPhi?.get(gid) ?? null;
    const b = overview?.greenhouses.find((x) => x.id === gid)?.harvest_allowed_from ?? null;
    const u = [a, b].filter(Boolean).sort().pop() as string | undefined;
    return u && u > f.harvested_on ? u : null;
  };
  const blocked = f.greenhouse_id ? phiUntil(f.greenhouse_id) : null;
  const weekRecs = records.filter((r) => r.iso_year === year && r.iso_week === week);
  const byGrade = new Map<string, number>();
  for (const r of weekRecs) byGrade.set(r.grade, (byGrade.get(r.grade) ?? 0) + Number(r.weight_kg));
  const total = [...byGrade.values()].reduce((a, b) => a + b, 0);
  const byGh = new Map<string, number>();
  for (const r of weekRecs) byGh.set(r.greenhouse_id, (byGh.get(r.greenhouse_id) ?? 0) + Number(r.weight_kg));
  const latest = [...records].sort((a, b) => (a.harvested_on === b.harvested_on ? (a.created_at < b.created_at ? 1 : -1) : a.harvested_on < b.harvested_on ? 1 : -1)).slice(0, 60);

  return (
    <main className="page">
      <Link to="/store" className="back"><Icon name="back" size={18} /> المخزن</Link>
      <div className="page-head"><div><h1>وزن الحصاد</h1><p>الأسبوع {week} — {weekSpan(today)}</p></div></div>
      <div className="kpis" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="k">حصاد الأسبوع</span><b className="num">{fmt(total)}</b><small>كجم</small></div>
        {Object.keys(HARVEST_GRADE_LABEL).filter((g) => byGrade.get(g)).map((g) => (
          <div className="kpi" key={g}><span className="k">{HARVEST_GRADE_LABEL[g]}</span><b className="num">{fmt(byGrade.get(g)!)}</b><small>{total ? Math.round((byGrade.get(g)! / total) * 100) : 0}%</small></div>
        ))}
      </div>
      {write && (
        <form className="panel panel-pad form" onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          if (!f.greenhouse_id) return setErr('اختر الصوبة');
          const w = toNum(f.weight_kg);
          if (w == null || w <= 0) return setErr('الوزن لازم يكون أكبر من صفر');
          if (f.harvested_on > today) return setErr('التاريخ لا يمكن أن يكون في المستقبل');
          const boxes = toNum(f.boxes_count);
          if (blocked && !confirmPhi) return setErr(`الصوبة في فترة أمان حتى ${formatDate(blocked)}. أكّد إن الحصاد تم فعلًا لتسجيله مع تنبيه.`);
          const cycle = ghs.find((x) => x.g.id === f.greenhouse_id)?.cycle;
          await create('harvest_records', {
            farm_id: farmId!, greenhouse_id: f.greenhouse_id, crop_cycle_id: cycle?.id ?? null, harvested_on: f.harvested_on, grade: f.grade,
            weight_kg: w, boxes_count: boxes, warehouse_id: f.warehouse_id || null, phi_warning: !!blocked, notes: f.notes.trim() || null,
          });
          toast(`تم تسجيل ${fmt(w)} كجم من ${labels?.get(f.greenhouse_id) ?? ''}`);
          setF((x) => ({ ...x, weight_kg: '', boxes_count: '', notes: '' }));
          setConfirmPhi(false);
        }}>
          <h2 className="form-h">تسجيل وزنة</h2>
          <div className="form-grid">
            <Field label="الصوبة"><select className="select" value={f.greenhouse_id} onChange={(e) => { setF({ ...f, greenhouse_id: e.target.value }); setConfirmPhi(false); }}><option value="">—</option><GhOptions idx={idx} ghs={ghs.map((x) => x.g)} /></select></Field>
            <Field label="التاريخ"><input className="input" type="date" max={today} value={f.harvested_on} onChange={(e) => setF({ ...f, harvested_on: e.target.value })} /></Field>
            <Field label="الوزن (كجم)"><input className="input ltr" inputMode="decimal" value={f.weight_kg} onChange={(e) => setF({ ...f, weight_kg: e.target.value })} /></Field>
            <Field label="عدد الكراتين"><input className="input ltr" inputMode="numeric" value={f.boxes_count} onChange={(e) => setF({ ...f, boxes_count: e.target.value })} /></Field>
            {whs && whs.length > 0 && <Field label="المخزن / الثلاجة"><select className="select" value={f.warehouse_id} onChange={(e) => setF({ ...f, warehouse_id: e.target.value })}><option value="">—</option>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>}
          </div>
          <div className="field"><span>الدرجة</span>
            <div className="chips-pick">{Object.entries(HARVEST_GRADE_LABEL).map(([k, v]) => <button type="button" key={k} aria-pressed={f.grade === k} onClick={() => setF({ ...f, grade: k })}>{v}</button>)}</div>
          </div>
          <Field label="ملاحظات"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          {blocked && (
            <div className="banner bad"><Icon name="shield" /> <span>الصوبة دي في فترة أمان حتى {formatDate(blocked)} — الحصاد ممنوع.
              <label className="toggle" style={{ marginTop: 8 }}><input type="checkbox" checked={confirmPhi} onChange={(e) => setConfirmPhi(e.target.checked)} /><span><b>الحصاد تم فعلًا</b><small>يتسجل مع تنبيه فترة الأمان للمراجعة</small></span></label></span></div>
          )}
          {err && <p className="form-error" role="alert">{err}</p>}
          <div className="form-actions"><button className="btn primary lg"><Icon name="check" /> تسجيل الوزنة</button></div>
        </form>
      )}
      {byGh.size > 0 && (
        <>
          <h2 className="section-title"><span>هذا الأسبوع حسب الصوبة</span></h2>
          <div className="panel scroll-x"><table className="tbl"><thead><tr><th>الصوبة</th><th>الوزن (كجم)</th></tr></thead><tbody>
            {[...byGh.entries()].sort((a, b) => b[1] - a[1]).map(([g, w]) => <tr key={g}><td>{labels?.get(g) ?? '؟'}</td><td className="n">{fmt(w)}</td></tr>)}
          </tbody></table></div>
        </>
      )}
      <h2 className="section-title"><span>آخر الوزنات</span></h2>
      <ul className="list panel">
        {latest.length === 0 && <li className="list-item muted">لا توجد وزنات بعد</li>}
        {latest.map((r) => (
          <li key={r.id} className="list-item">
            <span className="grow"><b>{labels?.get(r.greenhouse_id) ?? '؟'} — {HARVEST_GRADE_LABEL[r.grade]}</b><small className="muted" style={{ display: 'block' }}>{formatDate(r.harvested_on)}{r.boxes_count != null ? ` · ${r.boxes_count} كرتونة` : ''}{r.notes ? ` · ${r.notes}` : ''}</small></span>
            {r.phi_warning && <span className="chip bad"><Icon name="shield" size={14} /> فترة أمان</span>}
            <b className="num">{fmt(Number(r.weight_kg))} كجم</b>
          </li>
        ))}
      </ul>
    </main>
  );
}
