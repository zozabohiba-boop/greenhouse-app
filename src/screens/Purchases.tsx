// طلبات الشراء: أي عضو يقدّم طلب ← مدير الشركة يعتمد أو يرفض ← المشتريات تطلب من المورد ← المخزن يستلم
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, update } from '../lib/repo';
import { formatDate, todayLocal } from '../lib/dates';
import { useCatalog, useCatalogProducts, type Product } from '../lib/catalog';
import { usePeople } from '../lib/hooks';
import { PRIORITY_LABEL, PR_STATUS_LABEL, STOCK_UNITS } from '../lib/labels';
import { Field, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { ProductPickButton, ProductPickerSheet } from '../components/Catalog';
import { ProductSheet } from './Activities';
import type { Row } from '../lib/schema';

type PR = Row<'purchase_requests'>;
type Item = Row<'purchase_request_items'>;
const OPEN = ['draft', 'submitted', 'approved', 'ordered', 'partially_received'];
const TONE: Record<string, string> = { submitted: 'warn', approved: 'info', ordered: 'info', partially_received: 'warn', received: 'ok', rejected: 'bad', cancelled: '', draft: '' };
const fmt = (n: number) => Number(n.toFixed(3)).toLocaleString('en-US', { maximumFractionDigits: 3 });

export function PurchasesScreen() {
  const { farmId, can, user, toast } = useApp();
  const people = usePeople();
  const products = useCatalogProducts(farmId, true);
  const data = useLiveQuery(async () => {
    if (!farmId) return null;
    const [prs, items, moves] = await Promise.all([
      db.purchase_requests.where('farm_id').equals(farmId).toArray(),
      db.purchase_request_items.where('farm_id').equals(farmId).toArray(),
      db.stock_movements.where('farm_id').equals(farmId).toArray(),
    ]);
    return { prs: prs.filter(alive), items: items.filter(alive), moves: moves.filter(alive) };
  }, [farmId]);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [form, setForm] = useState(false);
  const [decide, setDecide] = useState<{ pr: PR; to: 'approved' | 'rejected' } | null>(null);
  const [receive, setReceive] = useState<PR | null>(null);
  if (!can.requestPurchase) return <Navigate to="/" replace />;
  if (!data || !products) return null;
  const prod = new Map(products.map((p) => [p.id, p]));
  const list = data.prs
    .filter((r) => filter === 'all' || OPEN.includes(r.status))
    .sort((a, b) => (a.requested_on === b.requested_on ? (a.created_at < b.created_at ? 1 : -1) : a.requested_on < b.requested_on ? 1 : -1));
  const itemsOf = (id: string) => data.items.filter((i) => i.request_id === id);
  const receivedOf = (prId: string, productId: string | null) => data.moves
    .filter((m) => m.purchase_request_id === prId && m.movement_type === 'receipt' && (!productId || m.product_id === productId))
    .reduce((s, m) => s + Number(m.qty), 0);
  const pending = data.prs.filter((r) => r.status === 'submitted').length;

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>المشتريات</h1><p>{can.approvePurchases && pending ? `${pending} طلب بانتظار اعتمادك` : 'الطلب ← الاعتماد ← الطلب من المورد ← الاستلام في المخزن'}</p></div>
        <button className="btn primary" onClick={() => setForm(true)}><Icon name="plus" /> طلب شراء جديد</button>
      </div>
      <div className="seg" style={{ marginBottom: 12 }}>
        <button aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>الطلبات الجارية</button>
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>كل الطلبات</button>
      </div>
      {list.length === 0 && <div className="panel empty"><h3>لا توجد طلبات {filter === 'open' ? 'جارية' : ''}</h3><p>أي عضو في المشروع يقدر يقدّم طلب شراء، ومدير الشركة يعتمده.</p></div>}
      <div className="pr-list">
        {list.map((r) => {
          const its = itemsOf(r.id);
          const mine = r.created_by === user?.id;
          return (
            <article key={r.id} className="panel pr-card">
              <header>
                <span className="grow"><b className="num">{r.request_no ?? 'طلب'}</b> <span className="faint">— {formatDate(r.requested_on)}، {people.get(r.created_by ?? '') ?? ''}</span></span>
                {r.priority !== 'normal' && <span className={`chip ${r.priority === 'urgent' || r.priority === 'high' ? 'bad' : ''}`}>{PRIORITY_LABEL[r.priority]}</span>}
                <span className={`chip ${TONE[r.status]}`}>{PR_STATUS_LABEL[r.status]}</span>
              </header>
              <ul className="pr-items">
                {its.map((i) => {
                  const p = i.product_id ? prod.get(i.product_id) : undefined;
                  const got = receivedOf(r.id, i.product_id);
                  return <li key={i.id}><span className="grow">{p?.name ?? i.item_name}</span><span className="num">{fmt(Number(i.qty))} {i.unit}</span>{got > 0 && <span className="chip ok sm">استُلم {fmt(got)}</span>}</li>;
                })}
              </ul>
              {(r.needed_by || r.supplier || r.notes || r.decision_note) && (
                <p className="muted pr-meta">{[r.needed_by && `مطلوب قبل ${formatDate(r.needed_by)}`, r.supplier && `المورد: ${r.supplier}`, r.notes, r.decision_note && `قرار المدير: ${r.decision_note}`].filter(Boolean).join(' · ')}</p>
              )}
              <div className="row pr-actions">
                {can.approvePurchases && r.status === 'submitted' && <>
                  <button className="btn primary" onClick={() => setDecide({ pr: r, to: 'approved' })}><Icon name="check" size={18} /> اعتماد</button>
                  <button className="btn danger" onClick={() => setDecide({ pr: r, to: 'rejected' })}>رفض</button>
                </>}
                {(can.canRecord('purchasing') || can.approvePurchases) && r.status === 'approved' && (
                  <button className="btn" onClick={async () => {
                    const supplier = window.prompt('اسم المورد (اختياري)', r.supplier ?? '') ?? r.supplier;
                    await update('purchase_requests', r.id, { status: 'ordered', supplier: supplier?.trim() || null });
                    toast('تم تسجيل الطلب من المورد');
                  }}>تم الطلب من المورد</button>
                )}
                {can.canRecord('store') && ['approved', 'ordered', 'partially_received'].includes(r.status) && (
                  <button className="btn primary" onClick={() => setReceive(r)}><Icon name="download" size={18} /> استلام في المخزن</button>
                )}
                {mine && ['draft', 'submitted'].includes(r.status) && (
                  <button className="btn ghost" onClick={async () => { await update('purchase_requests', r.id, { status: 'cancelled' }); toast('تم إلغاء الطلب'); }}>إلغاء الطلب</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {form && <RequestSheet farmId={farmId!} count={data.prs.length} products={products} onClose={() => setForm(false)} />}
      {decide && <DecisionSheet pr={decide.pr} to={decide.to} onClose={() => setDecide(null)} />}
      {receive && <ReceiveSheet farmId={farmId!} pr={receive} items={itemsOf(receive.id)} prod={prod} received={(pid) => receivedOf(receive.id, pid)} onClose={() => setReceive(null)} />}
    </main>
  );
}

interface Line { key: string; product?: Product; item_name: string; qty: string; unit: string }
const blank = (): Line => ({ key: Math.random().toString(36).slice(2), item_name: '', qty: '', unit: 'كجم' });

function RequestSheet({ farmId, count, products, onClose }: { farmId: string; count: number; products: Product[]; onClose: () => void }) {
  const { toast, can } = useApp();
  const cat = useCatalog(farmId);
  const [lines, setLines] = useState<Line[]>([blank()]);
  const [f, setF] = useState({ needed_by: '', priority: 'normal' as PR['priority'], notes: '' });
  const [picking, setPicking] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ key: string; name: string; cat: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (!cat) return null;
  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  return (
    <Sheet title="طلب شراء جديد" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const filled = lines.filter((l) => l.product || l.item_name.trim());
        if (!filled.length) return setErr('أضف صنفًا واحدًا على الأقل');
        for (const l of filled) { const q = toNum(l.qty); if (q == null || q <= 0) return setErr(`حدد كمية ${l.product?.name ?? l.item_name}`); }
        const year = todayLocal().slice(0, 4);
        const pr = await create('purchase_requests', {
          farm_id: farmId, request_no: `PR-${year}-${String(count + 1).padStart(4, '0')}`, requested_on: todayLocal(),
          needed_by: f.needed_by || null, priority: f.priority, status: 'submitted', notes: f.notes.trim() || null,
        });
        for (const l of filled) await create('purchase_request_items', { farm_id: farmId, request_id: pr.id, product_id: l.product?.id ?? null, item_name: l.product ? null : l.item_name.trim(), qty: toNum(l.qty)!, unit: l.unit });
        toast('تم تقديم الطلب لمدير الشركة');
        onClose();
      }}>
        {lines.map((l, i) => (
          <div key={l.key} className="line">
            <div className="line-head"><b>{i + 1}</b>
              <ProductPickButton product={l.product} cat={cat} onOpen={() => setPicking(l.key)} placeholder="اختر صنفًا من الكتالوج…" />
              {lines.length > 1 && <button type="button" className="iconbtn" aria-label="حذف السطر" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}><Icon name="close" size={18} /></button>}
            </div>
            <div className="form-grid tight">
              {!l.product && <Field label="أو اكتب الصنف"><input className="input" value={l.item_name} onChange={(e) => setLine(l.key, { item_name: e.target.value })} /></Field>}
              <Field label="الكمية"><input className="input ltr" inputMode="decimal" value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} /></Field>
              <Field label="الوحدة"><select className="select" value={l.unit} onChange={(e) => setLine(l.key, { unit: e.target.value })}>{STOCK_UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setLines([...lines, blank()])}><Icon name="plus" /> صنف آخر</button>
        <div className="form-grid">
          <Field label="مطلوب قبل"><input className="input" type="date" min={todayLocal()} value={f.needed_by} onChange={(e) => setF({ ...f, needed_by: e.target.value })} /></Field>
          <Field label="الأولوية"><select className="select" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as PR['priority'] })}>{Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <Field label="ملاحظات / سبب الطلب"><textarea className="textarea" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions"><button className="btn primary"><Icon name="check" /> تقديم الطلب</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
      {picking && (
        <ProductPickerSheet products={products.filter((p) => p.is_active)} cat={cat} title="اختيار الصنف" canAdd={can.addCatalog} onClose={() => setPicking(null)}
          onPick={(p) => { setLine(picking, { product: p }); setPicking(null); }}
          onAddNew={(name, c) => { setAdding({ key: picking, name, cat: c }); setPicking(null); }} />
      )}
      {adding && <ProductSheet farmId={farmId} defaultName={adding.name} defaultCategory={adding.cat} onClose={() => setAdding(null)} onSaved={(p) => { setLine(adding.key, { product: p }); setAdding(null); }} />}
    </Sheet>
  );
}

function DecisionSheet({ pr, to, onClose }: { pr: PR; to: 'approved' | 'rejected'; onClose: () => void }) {
  const { toast } = useApp();
  const [note, setNote] = useState('');
  return (
    <Sheet title={to === 'approved' ? `اعتماد ${pr.request_no ?? 'الطلب'}` : `رفض ${pr.request_no ?? 'الطلب'}`} onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        if (to === 'rejected' && !note.trim()) return;
        await update('purchase_requests', pr.id, { status: to, decision_note: note.trim() || null });
        toast(to === 'approved' ? 'تم اعتماد الطلب' : 'تم رفض الطلب');
        onClose();
      }}>
        <Field label={to === 'rejected' ? 'سبب الرفض (مطلوب)' : 'ملاحظة (اختياري)'}><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} autoFocus /></Field>
        <div className="form-actions"><button className={`btn ${to === 'approved' ? 'primary' : 'danger'}`}>{to === 'approved' ? 'اعتماد' : 'رفض'}</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}

function ReceiveSheet({ farmId, pr, items, prod, received, onClose }: {
  farmId: string; pr: PR; items: Item[]; prod: Map<string, Product>; received: (pid: string | null) => number; onClose: () => void;
}) {
  const { toast } = useApp();
  const whs = useLiveQuery(async () => (await db.warehouses.where('farm_id').equals(farmId).toArray()).filter(alive), [farmId]);
  const stockItems = useLiveQuery(async () => (await db.stock_items.where('farm_id').equals(farmId).toArray()).filter(alive), [farmId]);
  const moves = useLiveQuery(async () => (await db.stock_movements.where('farm_id').equals(farmId).toArray()).filter(alive), [farmId]);
  const withProduct = items.filter((i) => i.product_id);
  const [rows, setRows] = useState(() => withProduct.map((i) => ({ id: i.id, qty: String(Math.max(0, Number(i.qty) - received(i.product_id))), batch: '', expiry: '' })));
  const [wh, setWh] = useState('');
  const [doc, setDoc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!whs || !stockItems || !moves) return null;
  return (
    <Sheet title={`استلام ${pr.request_no ?? 'طلب الشراء'}`} onClose={onClose}>
      {whs.length === 0 ? <p className="banner warn">عرّف المخازن أولًا من شاشة المخزن.</p> : (
        <form className="form" onSubmit={async (e) => {
          e.preventDefault();
          const w = wh || whs[0].id;
          let any = false;
          for (const r of rows) {
            const q = toNum(r.qty);
            if (q == null || q <= 0) continue;
            const it = withProduct.find((x) => x.id === r.id)!;
            await create('stock_movements', {
              farm_id: farmId, warehouse_id: w, product_id: it.product_id!, movement_type: 'receipt', qty: q, unit: it.unit, moved_on: todayLocal(),
              batch_no: r.batch.trim() || null, expiry_date: r.expiry || null, supplier: pr.supplier, document_no: doc.trim() || null, purchase_request_id: pr.id,
            });
            if (!stockItems.some((s) => s.product_id === it.product_id)) await create('stock_items', { farm_id: farmId, product_id: it.product_id!, stock_unit: it.unit, default_warehouse_id: w });
            any = true;
          }
          if (!any) return setErr('اكتب الكمية المستلمة لصنف واحد على الأقل');
          const complete = withProduct.every((it) => {
            const r = rows.find((x) => x.id === it.id);
            return received(it.product_id) + (toNum(r?.qty ?? '') ?? 0) >= Number(it.qty) - 0.0005;
          }) && withProduct.length === items.length;
          await update('purchase_requests', pr.id, { status: complete ? 'received' : 'partially_received' });
          toast(complete ? 'تم استلام الطلب بالكامل' : 'تم تسجيل استلام جزئي');
          onClose();
        }}>
          <div className="form-grid">
            <Field label="المخزن"><select className="select" value={wh} onChange={(e) => setWh(e.target.value)}>{whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            <Field label="رقم إذن الاستلام / الفاتورة"><input className="input ltr" value={doc} onChange={(e) => setDoc(e.target.value)} /></Field>
          </div>
          {withProduct.map((it) => {
            const r = rows.find((x) => x.id === it.id)!;
            const set = (patch: Partial<typeof r>) => setRows((rs) => rs.map((x) => (x.id === it.id ? { ...x, ...patch } : x)));
            return (
              <div key={it.id} className="line">
                <p style={{ margin: 0 }}><b>{prod.get(it.product_id!)?.name}</b> <span className="faint">المطلوب {fmt(Number(it.qty))} {it.unit}، استُلم {fmt(received(it.product_id))}</span></p>
                <div className="form-grid tight">
                  <Field label="المستلم الآن"><input className="input ltr" inputMode="decimal" value={r.qty} onChange={(e) => set({ qty: e.target.value })} /></Field>
                  <Field label="التشغيلة"><input className="input ltr" value={r.batch} onChange={(e) => set({ batch: e.target.value })} /></Field>
                  <Field label="انتهاء الصلاحية"><input className="input" type="date" value={r.expiry} onChange={(e) => set({ expiry: e.target.value })} /></Field>
                </div>
              </div>
            );
          })}
          {items.length > withProduct.length && <p className="faint">الأصناف المكتوبة نصًا (غير الموجودة في الكتالوج) تُضاف للكتالوج أولًا ثم تُستلم من شاشة المخزن.</p>}
          {err && <p className="form-error">{err}</p>}
          <div className="form-actions"><button className="btn primary"><Icon name="check" /> تسجيل الاستلام</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
        </form>
      )}
    </Sheet>
  );
}
