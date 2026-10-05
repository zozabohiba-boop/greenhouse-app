// التوصيات: الاستشاري/المدير يكتبها (غالبًا من ملاحظة فحص)، والمهندس ينفذها بمعاملة مرتبطة
// فتُغلق تلقائيًا على السيرفر (migration 008) — ونعكس ذلك محليًا فورًا.

import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, update } from '../lib/repo';
import { formatDate, todayLocal } from '../lib/dates';
import { useGreenhouses, usePeople } from '../lib/hooks';
import { ghLabels, indexZones, useZones } from '../lib/zones';
import { GhOptions } from '../components/ZoneBrowser';
import { PRIORITY_LABEL, REC_STATUS_LABEL, SEVERITY } from '../lib/labels';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import type { Row } from '../lib/schema';

type Rec = Row<'recommendations'>;
const PRIORITIES = Object.keys(PRIORITY_LABEL) as Rec['priority'][];
const PRIO_CLASS: Record<Rec['priority'], string> = { low: '', normal: 'info', high: 'warn', urgent: 'bad' };

export function RecList() {
  const { farmId, user, can, toast } = useApp();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const people = usePeople();
  const data = useLiveQuery(async () => {
    const [recs, ghs, acts, obs, pests] = await Promise.all([
      db.recommendations.where('farm_id').equals(farmId!).toArray(),
      db.greenhouses.where('farm_id').equals(farmId!).toArray(),
      db.activities.where('farm_id').equals(farmId!).toArray(),
      db.scouting_observations.where('farm_id').equals(farmId!).toArray(),
      db.pests.toArray(),
    ]);
    const executed = new Map<string, Row<'activities'>>();
    for (const a of acts) if (alive(a) && a.recommendation_id) executed.set(a.recommendation_id, a);
    return {
      recs: recs.filter(alive),
      ghCode: ghLabels(indexZones(await db.farm_zones.where('farm_id').equals(farmId!).toArray()), ghs.filter(alive)),
      executed,
      obs: new Map(obs.map((o) => [o.id, o])),
      pest: new Map(pests.map((p) => [p.id, p.name_ar])),
    };
  }, [farmId]);
  if (!data) return null;
  const today = todayLocal();
  // المنفّذة محليًا ولسه السيرفر ما قفلهاش تُعامل كمنفذة
  const statusOf = (r: Rec): Rec['status'] => (data.executed.has(r.id) && (r.status === 'open' || r.status === 'in_progress') ? 'done' : r.status);
  const rank: Record<Rec['priority'], number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  const list = data.recs
    .filter((r) => (tab === 'open') === ['open', 'in_progress'].includes(statusOf(r)))
    .sort((a, b) => tab === 'open'
      ? rank[a.priority] - rank[b.priority] || (a.due_on ?? '9') .localeCompare(b.due_on ?? '9')
      : (b.resolved_at ?? b.updated_at).localeCompare(a.resolved_at ?? a.updated_at));
  const openCount = data.recs.filter((r) => ['open', 'in_progress'].includes(statusOf(r))).length;

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>التوصيات</h1><p>{openCount ? `${openCount} توصية مفتوحة` : 'لا توجد توصيات مفتوحة'}</p></div>
        {can.advise && <Link to="/recs/new" className="btn primary"><Icon name="plus" /> توصية جديدة</Link>}
      </div>
      <div className="filters">
        <div className="seg" role="group">
          <button aria-pressed={tab === 'open'} onClick={() => setTab('open')}>المفتوحة</button>
          <button aria-pressed={tab === 'closed'} onClick={() => setTab('closed')}>المنتهية</button>
        </div>
      </div>
      {list.length === 0 && <div className="panel empty"><h3>{tab === 'open' ? 'لا توجد توصيات مفتوحة' : 'لا توجد توصيات منتهية'}</h3></div>}
      <div className="rec-list">
        {list.map((r) => {
          const st = statusOf(r);
          const o = r.observation_id ? data.obs.get(r.observation_id) : undefined;
          const act = data.executed.get(r.id);
          const overdue = r.due_on && r.due_on < today && (st === 'open' || st === 'in_progress');
          const mine = r.author_id === user?.id || r.created_by === user?.id;
          const canStatus = mine || can.supervise;
          return (
            <article key={r.id} className="panel rec" data-p={r.priority}>
              <header className="row">
                <span className={`chip ${PRIO_CLASS[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span>
                {r.greenhouse_id && <span className="chip lbl">{data.ghCode.get(r.greenhouse_id)}</span>}
                <span className={`chip ${st === 'done' ? 'ok' : st === 'cancelled' ? '' : st === 'in_progress' ? 'info' : ''}`}>{REC_STATUS_LABEL[st]}</span>
                {r.due_on && <span className={`chip ${overdue ? 'bad' : ''}`}><Icon name="clock" size={13} /> {overdue ? 'متأخرة — ' : ''}{formatDate(r.due_on)}</span>}
              </header>
              <h3>{r.title}</h3>
              {r.body && <p className="rec-body">{r.body}</p>}
              {o && (
                <p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>
                  من ملاحظة فحص: {data.pest.get(o.pest_id)} — {SEVERITY[o.severity].label}{o.row_no ? `، خط ${o.row_no}` : ''}
                </p>
              )}
              <footer className="row">
                <small className="faint grow">{people.get(r.author_id ?? r.created_by ?? '') ?? ''}، {formatDate(r.created_at.slice(0, 10))}</small>
                {act && <Link to={`/activities/${act.id}`} className="btn ghost"><Icon name="check" size={18} /> نُفذت {formatDate(act.performed_on)}</Link>}
                {!act && can.record && (st === 'open' || st === 'in_progress') && (
                  <Link className="btn primary" to={`/activities/new?rec=${r.id}${r.greenhouse_id ? `&gh=${r.greenhouse_id}` : ''}${o ? `&pest=${o.pest_id}` : ''}`}><Icon name="spray" size={20} /> سجّل التنفيذ</Link>
                )}
                {canStatus && st === 'open' && <button className="btn" onClick={async () => { await update('recommendations', r.id, { status: 'in_progress' }); toast('تم'); }}>جاري التنفيذ</button>}
                {canStatus && (st === 'open' || st === 'in_progress') && !act && (
                  <>
                    <button className="btn" onClick={async () => { await update('recommendations', r.id, { status: 'done', resolved_at: new Date().toISOString() }); toast('أُغلقت التوصية'); }}>تمت</button>
                    <button className="btn danger" onClick={async () => { if (confirm('إلغاء التوصية؟')) { await update('recommendations', r.id, { status: 'cancelled', resolved_at: new Date().toISOString() }); toast('أُلغيت التوصية'); } }}>إلغاء</button>
                  </>
                )}
                {canStatus && (st === 'open' || st === 'in_progress') && <Link className="btn ghost" to={`/recs/${r.id}/edit`}><Icon name="edit" size={18} /></Link>}
                {canStatus && (st === 'done' || st === 'cancelled') && !act && (
                  <button className="btn ghost" onClick={async () => { await update('recommendations', r.id, { status: 'open', resolved_at: null }); toast('أُعيد فتح التوصية'); }}>إعادة فتح</button>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function RecForm() {
  const { id } = useParams();
  const { farmId, user, can, toast } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const ghs = useGreenhouses(farmId);
  const existing = useLiveQuery(async () => (id ? (await db.recommendations.get(id)) ?? null : null), [id]);
  const ctx = useLiveQuery(async () => {
    const obsId = existing?.observation_id ?? sp.get('obs');
    if (!obsId) return null;
    const o = await db.scouting_observations.get(obsId);
    if (!o) return null;
    const p = await db.pests.get(o.pest_id);
    return { o, pest: p?.name_ar };
  }, [existing?.observation_id, sp.get('obs')]);
  if (!can.advise) return <Navigate to="/recs" replace />;
  if (id && existing === undefined) return null;
  if ((existing?.observation_id || sp.get('obs')) && ctx === undefined) return null;
  if (existing && existing.author_id !== user?.id && existing.created_by !== user?.id && !can.supervise) return <Navigate to="/recs" replace />;
  return <RecFormInner key={`${existing?.id ?? 'new'}-${ctx?.o.id ?? ''}`} existing={existing ?? null} ghs={ghs ?? []} ctx={ctx ?? null}
    defaults={{ gh: sp.get('gh') ?? '', obs: sp.get('obs') }} onDone={(msg) => { toast(msg); nav('/recs', { replace: true }); }} farmId={farmId!} />;
}

function RecFormInner({ existing, ghs, ctx, defaults, onDone, farmId }: {
  existing: Rec | null; ghs: { g: Row<'greenhouses'> }[]; ctx: { o: Row<'scouting_observations'>; pest?: string } | null;
  defaults: { gh: string; obs: string | null }; onDone: (m: string) => void; farmId: string;
}) {
  const today = todayLocal();
  const idx = useZones(farmId);
  const [f, setF] = useState({
    greenhouse_id: existing?.greenhouse_id ?? defaults.gh,
    title: existing?.title ?? (ctx?.pest ? `مكافحة ${ctx.pest}` : ''),
    body: existing?.body ?? '',
    priority: existing?.priority ?? (ctx && ctx.o.severity >= 3 ? 'high' : 'normal') as Rec['priority'],
    due_on: existing?.due_on ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return setErr('عنوان التوصية مطلوب');
    if (f.due_on && f.due_on < today && !existing) return setErr('موعد التنفيذ في الماضي');
    const cycles = f.greenhouse_id ? await db.crop_cycles.where('greenhouse_id').equals(f.greenhouse_id).toArray() : [];
    const cycle = cycles.filter((c) => alive(c) && c.status !== 'finished').sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))[0];
    const values = {
      greenhouse_id: f.greenhouse_id || null,
      crop_cycle_id: cycle?.id ?? null,
      title: f.title.trim(),
      body: f.body.trim() || null,
      priority: f.priority,
      due_on: f.due_on || null,
    };
    if (existing) {
      await update('recommendations', existing.id, values);
      onDone('تم حفظ التوصية');
    } else {
      await create('recommendations', { ...values, farm_id: farmId, observation_id: defaults.obs || null });
      onDone('تم إرسال التوصية للفريق');
    }
  }
  return (
    <main className="page">
      <Link to="/recs" className="back"><Icon name="back" size={18} /> التوصيات</Link>
      <div className="page-head"><div><h1>{existing ? 'تعديل توصية' : 'توصية جديدة'}</h1>
        {ctx && <p>من ملاحظة فحص: {ctx.pest} — {SEVERITY[ctx.o.severity].label}{ctx.o.row_no ? `، خط ${ctx.o.row_no}` : ''}</p>}</div></div>
      <form className="panel panel-pad form" onSubmit={submit} style={{ maxWidth: 760 }}>
        <div className="form-grid">
          <Field label="الصوبة">
            <select className="select" value={f.greenhouse_id} onChange={(e) => setF({ ...f, greenhouse_id: e.target.value })}>
              <option value="">كل المزرعة</option>
              <GhOptions idx={idx} ghs={ghs.map((x) => x.g)} />
            </select>
          </Field>
          <Field label="موعد التنفيذ"><input className="input" type="date" value={f.due_on} min={existing ? undefined : today} onChange={(e) => setF({ ...f, due_on: e.target.value })} /></Field>
        </div>
        <div>
          <p className="field-label">الأولوية</p>
          <div className="seg" role="group">
            {PRIORITIES.map((p) => <button type="button" key={p} aria-pressed={f.priority === p} onClick={() => setF({ ...f, priority: p })}>{PRIORITY_LABEL[p]}</button>)}
          </div>
        </div>
        <Field label="التوصية"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="مثلًا: رش أكاروسي للخطوط 3–8" /></Field>
        <Field label="التفاصيل" hint="المادة والجرعة المقترحة، النطاق، أي احتياطات">
          <textarea className="textarea" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        </Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" type="submit"><Icon name="check" /> {existing ? 'حفظ' : 'إرسال التوصية'}</button>
          <Link to="/recs" className="btn">إلغاء</Link>
        </div>
      </form>
    </main>
  );
}
