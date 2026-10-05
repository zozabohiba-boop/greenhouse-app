// الفحص الحشري (IPM Scouting)
// الصوبة ← جولة فحص (اليوم) ← ملاحظات: آفة + شدة 0–4 + الخط + العدد + بؤرة + صور
// المهندس يمشي خط بخط: يحدد "الخط الحالي" مرة، وكل ملاحظة تاخده تلقائيًا.

import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, softDelete, update } from '../lib/repo';
import { formatDate, isoWeek, todayLocal, weekKey } from '../lib/dates';
import { addDays, pressureGrid, severityByRow } from '../lib/ipm';
import { usePeople, usePests } from '../lib/hooks';
import { addPhoto, removePhoto, usePhotos } from '../lib/photos';
import {
  COUNT_UNIT_LABEL, LIFE_STAGES, PEST_CATEGORY_LABEL, PEST_GROUPS, SCOUT_METHOD_LABEL, SEVERITY,
} from '../lib/labels';
import { Field, numStr, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { PhotoStrip } from '../components/Photos';
import { byCode } from './Home';
import { useZones } from '../lib/zones';
import { GhPlace, PlaceLine, ZoneBrowser } from '../components/ZoneBrowser';
import type { Row } from '../lib/schema';

type Session = Row<'scouting_sessions'>;
type Obs = Row<'scouting_observations'>;
type Pest = Row<'pests'>;

export function SevChip({ v, hotspot }: { v: number; hotspot?: boolean }) {
  return (
    <span className="sev" data-v={v}>
      {hotspot && <Icon name="flag" size={13} />}
      {SEVERITY[v]?.short ?? v}
    </span>
  );
}

// ── اختيار الصوبة ───────────────────────────────────────────────────
export function ScoutPick() {
  const { farmId, can } = useApp();
  const idx = useZones(farmId);
  const today = todayLocal();
  const { year, week } = isoWeek(today);
  const data = useLiveQuery(async () => {
    const [ghs, sessions] = await Promise.all([
      db.greenhouses.where('farm_id').equals(farmId!).toArray(),
      db.scouting_sessions.where('farm_id').equals(farmId!).toArray(),
    ]);
    const live = sessions.filter(alive);
    const thisWeek = live.filter((s) => s.iso_year === year && s.iso_week === week);
    const obs = thisWeek.length
      ? await db.scouting_observations.where('session_id').anyOf(thisWeek.map((s) => s.id)).toArray()
      : [];
    const grid = pressureGrid(thisWeek, obs);
    const last = new Map<string, string>();
    for (const s of live) if (!last.has(s.greenhouse_id) || s.scouted_on > last.get(s.greenhouse_id)!) last.set(s.greenhouse_id, s.scouted_on);
    return { ghs: ghs.filter(alive).sort(byCode), grid, last };
  }, [farmId, year, week]);

  if (!can.record) return <Navigate to="/" replace />;
  const scouted = data ? data.ghs.filter((g) => data.grid.has(`${g.id}|${weekKey(year, week)}`)).length : 0;

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div>
          <h1>الفحص الحشري</h1>
          <p>الأسبوع {week}{data ? `، فُحصت ${scouted} من ${data.ghs.length} صوبة` : ''}</p>
        </div>
      </div>
      {data?.ghs.length === 0 && <div className="panel empty"><h3>لا توجد صوب</h3><p>يضيفها مدير المزرعة من شاشة إدارة الصوب.</p></div>}
      {data && idx && data.ghs.length > 0 && (
        <ZoneBrowser
          idx={idx}
          items={data.ghs}
          summary={(items) => {
            const n = items.filter((g) => data.grid.has(`${g.id}|${weekKey(year, week)}`)).length;
            const worst = Math.max(0, ...items.map((g) => data.grid.get(`${g.id}|${weekKey(year, week)}`)?.max ?? 0));
            return (
              <>
                <span className={`chip ${n === items.length ? 'ok' : n ? 'warn' : 'bad'}`}>فُحصت {n} من {items.length}</span>
                {worst > 0 && <SevChip v={worst} />}
              </>
            );
          }}
          render={(g) => {
            const c = data.grid.get(`${g.id}|${weekKey(year, week)}`);
            const last = data.last.get(g.id);
            return (
              <Link to={`/scout/gh/${g.id}`} className="gh">
                <span className="code">{g.code}</span>
                <span className="meta">
                  <b>{g.name || 'صوبة'}</b>
                  <span>{last ? `آخر فحص ${formatDate(last)}` : 'لم تُفحص من قبل'}</span>
                </span>
                {c ? (
                  c.observations === 0 ? <span className="chip ok"><Icon name="check" size={14} /> نظيفة هذا الأسبوع</span>
                    : <span className="row" style={{ gap: 6 }}><SevChip v={c.max} hotspot={c.hotspots > 0} /><span className="chip">{c.pests.size} آفة</span></span>
                ) : <span className="chip bad">لم تُفحص هذا الأسبوع</span>}
              </Link>
            );
          }}
        />
      )}
    </main>
  );
}

// ── صوبة: الجولات السابقة + بدء جولة ─────────────────────────────────
export function ScoutGreenhouse() {
  const { ghId } = useParams();
  const { farmId, user, can, toast } = useApp();
  const nav = useNavigate();
  const people = usePeople();
  const idx = useZones(farmId);
  const [start, setStart] = useState(false);
  const data = useLiveQuery(async () => {
    const g = await db.greenhouses.get(ghId!);
    if (!alive(g)) return null;
    const sessions = (await db.scouting_sessions.where('greenhouse_id').equals(g.id).toArray())
      .filter(alive).sort((a, b) => (a.scouted_on === b.scouted_on ? (a.created_at < b.created_at ? 1 : -1) : a.scouted_on < b.scouted_on ? 1 : -1));
    const obs = sessions.length ? (await db.scouting_observations.where('session_id').anyOf(sessions.map((s) => s.id)).toArray()).filter(alive) : [];
    const pests = new Map((await db.pests.toArray()).map((p) => [p.id, p]));
    const cycles = (await db.crop_cycles.where('greenhouse_id').equals(g.id).toArray()).filter((c) => alive(c) && c.status !== 'finished');
    return { g, sessions: sessions.slice(0, 30), obs, pests, cycle: cycles.sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))[0] };
  }, [ghId]);

  if (data === undefined) return null;
  if (data === null) return <main className="page"><div className="panel empty"><h3>الصوبة غير موجودة</h3></div></main>;
  const { g, sessions, obs, pests, cycle } = data;
  const today = todayLocal();
  const mineToday = sessions.find((s) => s.scouted_on === today && s.created_by === user?.id);

  async function begin(date: string, plants: number | null) {
    const s = await create('scouting_sessions', {
      farm_id: farmId!, greenhouse_id: g.id, crop_cycle_id: cycle?.id ?? null, scouted_on: date,
      plants_inspected: plants, started_at: new Date().toISOString(),
    });
    toast('بدأت جولة الفحص');
    nav(`/scout/s/${s.id}`);
  }

  return (
    <main className="page">
      <Link to={`/scout${g.zone_id ? `?z=${g.zone_id}` : ''}`} className="back"><Icon name="back" size={18} /> كل الصوب</Link>
      <div className="page-head">
        <div>
          <GhPlace idx={idx} zoneId={g.zone_id} />
          <h1>فحص <span className="num">{g.code}</span></h1>
          <p>{g.name ? `${g.name}، ` : ''}{g.rows_count ? `${g.rows_count} خط` : 'عدد الخطوط غير محدد'}</p>
        </div>
        {can.record && (mineToday
          ? <Link to={`/scout/s/${mineToday.id}`} className="btn primary lg"><Icon name="bug" /> أكمل جولة اليوم</Link>
          : <button className="btn primary lg" onClick={() => setStart(true)}><Icon name="plus" /> ابدأ جولة فحص</button>)}
      </div>

      {sessions.length === 0 ? (
        <div className="panel empty"><h3>لا توجد جولات فحص لهذه الصوبة</h3><p>ابدأ أول جولة، وسجّل كل آفة أو مرض تشوفه بشدته ومكانه.</p></div>
      ) : (
        <ul className="list panel">
          {sessions.map((s) => {
            const so = obs.filter((o) => o.session_id === s.id);
            const max = so.reduce((m, o) => Math.max(m, o.severity), 0);
            const hot = so.some((o) => o.is_hotspot);
            const top = [...new Set(so.filter((o) => o.severity >= 2).map((o) => pests.get(o.pest_id)?.name_ar).filter(Boolean))].slice(0, 3);
            return (
              <li key={s.id}>
                <Link to={`/scout/s/${s.id}`} className="list-item">
                  <span style={{ minWidth: 110 }}>
                    <b>{formatDate(s.scouted_on)}</b>
                    <small className="faint" style={{ display: 'block' }}>{people.get(s.scout_id ?? s.created_by ?? '') ?? ''}</small>
                  </span>
                  <span className="grow muted" style={{ fontSize: 'var(--fs-sm)' }}>
                    {so.length === 0 ? 'لا توجد إصابات' : `${so.length} ملاحظة${top.length ? ` — ${top.join('، ')}` : ''}`}
                    {!s.completed_at && <span className="chip warn" style={{ marginInlineStart: 8 }}>لم تُغلق</span>}
                  </span>
                  {so.length === 0 ? <span className="chip ok">نظيفة</span> : <SevChip v={max} hotspot={hot} />}
                  <Icon name="chevron" size={20} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {start && <StartSheet onClose={() => setStart(false)} onStart={begin} />}
    </main>
  );
}

function StartSheet({ onClose, onStart }: { onClose: () => void; onStart: (date: string, plants: number | null) => void }) {
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [plants, setPlants] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="جولة فحص جديدة" onClose={onClose}>
      <form className="form" onSubmit={(e) => {
        e.preventDefault();
        if (!date || date > today) return setErr('التاريخ لا يمكن أن يكون في المستقبل');
        if (date < addDays(today, -30)) return setErr('لا يمكن التسجيل لأكثر من 30 يومًا للخلف');
        onStart(date, toNum(plants));
      }}>
        <Field label="تاريخ الفحص"><input className="input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="عدد النباتات التي ستفحصها" hint="اختياري — يُستخدم لحساب نسبة الإصابة">
          <input className="input ltr" inputMode="numeric" value={plants} onChange={(e) => setPlants(e.target.value)} />
        </Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" type="submit"><Icon name="bug" /> ابدأ</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Sheet>
  );
}

// ── جولة الفحص ───────────────────────────────────────────────────────
export function ScoutSession() {
  const { id } = useParams();
  const { farmId, user, can, toast } = useApp();
  const nav = useNavigate();
  const pests = usePests(farmId);
  const [rowSel, setRowSel] = useState<number | null | undefined>(undefined);
  const [picked, setPicked] = useState<{ pest: Pest; obs?: Obs } | null>(null);
  const [q, setQ] = useState('');
  const [info, setInfo] = useState(false);
  const [addPest, setAddPest] = useState(false);

  const data = useLiveQuery(async () => {
    const s = await db.scouting_sessions.get(id!);
    if (!alive(s)) return null;
    const g = await db.greenhouses.get(s.greenhouse_id);
    const obs = (await db.scouting_observations.where('session_id').equals(s.id).toArray())
      .filter(alive).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    // آخر جولة سابقة في نفس الصوبة (خلال 3 أسابيع) — للمقارنة
    const prevSessions = (await db.scouting_sessions.where('greenhouse_id').equals(s.greenhouse_id).toArray())
      .filter((p) => alive(p) && p.id !== s.id && p.scouted_on <= s.scouted_on && p.scouted_on >= addDays(s.scouted_on, -21));
    const prevObs = prevSessions.length
      ? (await db.scouting_observations.where('session_id').anyOf(prevSessions.map((p) => p.id)).toArray()).filter(alive)
      : [];
    const prevMax = new Map<string, number>();
    for (const o of prevObs) prevMax.set(o.pest_id, Math.max(prevMax.get(o.pest_id) ?? 0, o.severity));
    return { s, g, obs, prevMax };
  }, [id]);

  const photos = usePhotos('scouting_observations', data?.obs.map((o) => o.id) ?? []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (pests ?? []).filter((p) => !term || p.name_ar.includes(term) || p.name_en.toLowerCase().includes(term)
      || (p.scientific_name ?? '').toLowerCase().includes(term));
    return PEST_GROUPS.map((gr) => ({ ...gr, pests: list.filter((p) => gr.cats.includes(p.category)) })).filter((gr) => gr.pests.length);
  }, [pests, q]);

  if (data === undefined || !pests) return null;
  if (data === null) return <main className="page"><div className="panel empty"><h3>الجولة غير موجودة</h3></div></main>;
  const { s, g, obs, prevMax } = data;
  const mine = s.created_by === user?.id || s.created_by == null;
  const editable = can.record && (mine || can.supervise);
  const rows = g?.rows_count ?? null;
  const lastRow = obs.find((o) => o.row_no != null)?.row_no ?? null;
  const currentRow = rowSel === undefined ? (lastRow ?? (rows ? 1 : null)) : rowSel;
  const byRow = severityByRow(obs);
  const pestById = new Map(pests.map((p) => [p.id, p]));
  const sessionMax = new Map<string, number>();
  for (const o of obs) sessionMax.set(o.pest_id, Math.max(sessionMax.get(o.pest_id) ?? 0, o.severity));

  async function finish() {
    if (!s.completed_at) await update('scouting_sessions', s.id, { completed_at: new Date().toISOString() });
    toast(obs.length ? `تم حفظ الجولة — ${obs.length} ملاحظة` : 'تم تسجيل الصوبة نظيفة');
    nav(`/scout/gh/${s.greenhouse_id}`);
  }

  return (
    <main className="page">
      <Link to={`/scout/gh/${s.greenhouse_id}`} className="back"><Icon name="back" size={18} /> جولات الصوبة</Link>
      <div className="page-head">
        <div>
          <PlaceLine zoneId={g?.zone_id} />
          <h1>فحص <span className="num">{g?.code}</span> — {formatDate(s.scouted_on)}</h1>
          <p>
            {obs.length ? `${obs.length} ملاحظة` : 'لم تُسجل إصابات بعد'}
            {s.plants_inspected ? `، ${s.plants_inspected} نبات مفحوص` : ''}
            {s.completed_at ? '، الجولة مغلقة' : ''}
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setInfo(true)}><Icon name="note" size={20} /> بيانات الجولة</button>
          {editable && <button className="btn primary" onClick={finish}><Icon name="check" /> {s.completed_at ? 'تم' : 'إنهاء الجولة'}</button>}
        </div>
      </div>

      {!editable && can.record && <div className="banner info"><Icon name="alert" /> هذه جولة مهندس آخر — للعرض فقط.</div>}

      <div className="scout">
        <section className="scout-map">
          {rows ? (
            <div className="panel panel-pad">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <b>خريطة الصوبة</b>
                {editable && (
                  <div className="stepper" aria-label="الخط الحالي">
                    <button className="iconbtn" onClick={() => setRowSel(Math.max(1, (currentRow ?? 1) - 1))} aria-label="الخط السابق">−</button>
                    <span><small>الخط</small> <b className="num">{currentRow ?? '—'}</b></span>
                    <button className="iconbtn" onClick={() => setRowSel(Math.min(rows, (currentRow ?? 0) + 1))} aria-label="الخط التالي">+</button>
                  </div>
                )}
              </div>
              <div className="rowmap" style={{ gridTemplateColumns: `repeat(${Math.min(rows, 24)}, 1fr)` }}>
                {Array.from({ length: rows }, (_, i) => i + 1).map((r) => {
                  const c = byRow.get(r);
                  return (
                    <button key={r} className="rcell" data-v={c?.max ?? ''} aria-current={r === currentRow}
                      onClick={() => editable && setRowSel(r)} title={`الخط ${r}${c ? ` — ${SEVERITY[c.max].label}` : ''}`}>
                      <span className="num">{r}</span>
                      {c?.hotspot && <i />}
                    </button>
                  );
                })}
              </div>
              <div className="sev-legend">{SEVERITY.slice(1).map((x) => <span key={x.v}><i data-v={x.v} />{x.label}</span>)}</div>
            </div>
          ) : (
            editable && (
              <div className="panel panel-pad row">
                <span className="grow muted" style={{ fontSize: 'var(--fs-sm)' }}>حدد عدد خطوط الصوبة من إدارة الصوب لتظهر خريطة الإصابة.</span>
                <Field label="الخط الحالي">
                  <input className="input ltr" style={{ width: 110 }} inputMode="numeric" value={numStr(currentRow)}
                    onChange={(e) => setRowSel(toNum(e.target.value))} />
                </Field>
              </div>
            )
          )}
        </section>

        <section className="scout-list">
          <h2 className="section-title">ملاحظات الجولة</h2>
          {obs.length === 0 ? (
            <div className="panel empty" style={{ padding: 24 }}>
              <h3>لا توجد إصابات مسجلة</h3>
              <p>اختر الآفة من القائمة عند رؤيتها. لو الصوبة نظيفة، اضغط "إنهاء الجولة" وستسجل نظيفة.</p>
            </div>
          ) : (
            <ul className="list panel">
              {obs.map((o) => {
                const p = pestById.get(o.pest_id);
                const ph = photos.get(o.id) ?? [];
                return (
                  <li key={o.id}>
                    <button className="list-item btn ghost block obs-item" onClick={() => p && setPicked({ pest: p, obs: o })}>
                      <SevChip v={o.severity} hotspot={o.is_hotspot} />
                      <span className="grow" style={{ textAlign: 'start' }}>
                        <b>{p?.name_ar ?? 'آفة'}</b>
                        <small className="muted" style={{ display: 'block', fontWeight: 400 }}>
                          {[o.row_no != null && `خط ${o.row_no}`, o.span_no != null && `باكية ${o.span_no}`,
                            o.method !== 'plant_inspection' && SCOUT_METHOD_LABEL[o.method] + (o.trap_code ? ` ${o.trap_code}` : ''),
                            o.count_value != null && `${o.count_value} ${o.count_unit ? COUNT_UNIT_LABEL[o.count_unit] : ''}`,
                            o.life_stage, o.plants_infested != null && o.plants_inspected ? `${o.plants_infested}/${o.plants_inspected} نبات` : null,
                          ].filter(Boolean).join('، ')}
                        </small>
                      </span>
                      {ph.length > 0 && <span className="chip"><Icon name="camera" size={14} /> {ph.length}</span>}
                      {o._error && <span className="chip bad">مرفوض</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {editable && (
          <section className="panel pest-pick" aria-label="اختر الآفة">
            <div className="pest-search">
              <Icon name="search" size={20} />
              <input className="input" placeholder="ابحث باسم الآفة أو المرض" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {groups.map((gr) => (
              <div key={gr.title} className="pest-group">
                <h3>{gr.title}</h3>
                <div className="pest-grid">
                  {gr.pests.map((p) => {
                    const cur = sessionMax.get(p.id);
                    const prev = prevMax.get(p.id);
                    return (
                      <button key={p.id} className="pest-btn" data-v={cur ?? ''} onClick={() => setPicked({ pest: p })}>
                        <b>{p.name_ar}</b>
                        <small>
                          {cur != null ? `مسجلة: ${SEVERITY[cur].short}` : prev != null && prev > 0 ? `الجولة السابقة: ${SEVERITY[prev].short}` : p.scientific_name ?? ''}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="muted" style={{ padding: 16 }}>لا توجد نتائج.</p>}
            {can.advise && (
              <button className="btn ghost block" onClick={() => setAddPest(true)}><Icon name="plus" /> آفة غير موجودة في القائمة</button>
            )}
          </section>
        )}
      </div>

      {picked && (
        <ObsSheet
          key={picked.obs?.id ?? picked.pest.id}
          session={s}
          pest={picked.pest}
          existing={picked.obs}
          defaultRow={currentRow}
          spans={g?.spans_count ?? null}
          readOnly={!editable || (!!picked.obs && picked.obs.created_by !== user?.id && !can.supervise)}
          onClose={() => setPicked(null)}
        />
      )}
      {info && <SessionInfo s={s} editable={editable} onClose={() => setInfo(false)} />}
      {addPest && <AddPestSheet farmId={farmId!} onClose={() => setAddPest(false)} onAdded={(p) => { setAddPest(false); setPicked({ pest: p }); }} />}
    </main>
  );
}

// ── ملاحظة: آفة واحدة ───────────────────────────────────────────────
function ObsSheet({ session, pest, existing, defaultRow, spans, readOnly, onClose }: {
  session: Session; pest: Pest; existing?: Obs; defaultRow: number | null; spans: number | null; readOnly: boolean; onClose: () => void;
}) {
  const { farmId, can, toast } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({
    severity: existing?.severity ?? (null as number | null),
    method: existing?.method ?? ('plant_inspection' as Obs['method']),
    row_no: numStr(existing ? existing.row_no : defaultRow),
    span_no: numStr(existing?.span_no),
    trap_code: existing?.trap_code ?? '',
    count_value: numStr(existing?.count_value),
    count_unit: existing?.count_unit ?? pest.default_count_unit,
    stages: existing?.life_stage ? existing.life_stage.split('، ') : ([] as string[]),
    plants_inspected: numStr(existing?.plants_inspected),
    plants_infested: numStr(existing?.plants_infested),
    is_hotspot: existing?.is_hotspot ?? false,
    notes: existing?.notes ?? '',
  });
  const [files, setFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saved = usePhotos('scouting_observations', existing ? [existing.id] : []).get(existing?.id ?? '') ?? [];
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const trap = f.method === 'sticky_trap' || f.method === 'pheromone_trap';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.severity == null) return setErr('اختر شدة الإصابة');
    const ins = toNum(f.plants_inspected);
    const inf = toNum(f.plants_infested);
    const row = toNum(f.row_no);
    if (row != null && (row < 1 || !Number.isInteger(row))) return setErr('رقم الخط يجب أن يكون رقمًا صحيحًا من 1');
    const span = toNum(f.span_no);
    if (span != null && (span < 1 || !Number.isInteger(span))) return setErr('رقم الباكية يجب أن يكون رقمًا صحيحًا من 1');
    if (ins != null && inf != null && inf > ins) return setErr('النباتات المصابة أكثر من المفحوصة');
    const count = toNum(f.count_value);
    if (count != null && count < 0) return setErr('العدد لا يمكن أن يكون سالبًا');
    setBusy(true);
    try {
      const values = {
        severity: f.severity,
        method: f.method,
        row_no: row,
        span_no: span,
        trap_code: trap ? f.trap_code.trim() || null : null,
        count_value: f.count_unit === 'presence' ? null : count,
        count_unit: f.count_unit,
        life_stage: f.stages.length ? f.stages.join('، ') : null,
        plants_inspected: ins,
        plants_infested: inf,
        is_hotspot: f.is_hotspot,
        notes: f.notes.trim() || null,
      };
      let obsId = existing?.id;
      if (existing) await update('scouting_observations', existing.id, values);
      else obsId = (await create('scouting_observations', { ...values, farm_id: farmId!, session_id: session.id, pest_id: pest.id })).id;
      for (const x of files) await addPhoto(farmId!, 'scouting_observations', obsId!, x.file);
      files.forEach((x) => URL.revokeObjectURL(x.url));
      toast(existing ? 'تم تعديل الملاحظة' : `تم تسجيل ${pest.name_ar}`);
      onClose();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  return (
    <Sheet title={pest.name_ar} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="muted" style={{ marginTop: -8 }}>
          {PEST_CATEGORY_LABEL[pest.category]}{pest.scientific_name ? ` — ` : ''}<i className="num">{pest.scientific_name}</i>
        </p>
        <fieldset className="sev-pick" disabled={readOnly}>
          <legend>شدة الإصابة</legend>
          {SEVERITY.map((x) => (
            <button type="button" key={x.v} data-v={x.v} aria-pressed={f.severity === x.v}
              onClick={() => setF((s) => ({ ...s, severity: x.v, is_hotspot: x.v === 4 ? true : s.is_hotspot }))}>
              <b className="num">{x.v}</b><span>{x.label}</span>
            </button>
          ))}
        </fieldset>

        <fieldset disabled={readOnly} className="form" style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="seg" role="group" aria-label="طريقة الفحص">
            {(Object.keys(SCOUT_METHOD_LABEL) as Obs['method'][]).map((m) => (
              <button type="button" key={m} aria-pressed={f.method === m} onClick={() => set('method', m)}>{SCOUT_METHOD_LABEL[m]}</button>
            ))}
          </div>
          <div className="form-grid tight">
            <Field label="الخط"><input className="input ltr" inputMode="numeric" value={f.row_no} onChange={(e) => set('row_no', e.target.value)} /></Field>
            {(spans ?? 0) > 1 && <Field label="الباكية"><input className="input ltr" inputMode="numeric" value={f.span_no} onChange={(e) => set('span_no', e.target.value)} /></Field>}
            {trap && <Field label="رقم المصيدة"><input className="input ltr" value={f.trap_code} onChange={(e) => set('trap_code', e.target.value)} /></Field>}
            <Field label="وحدة العد">
              <select className="select" value={f.count_unit ?? 'presence'} onChange={(e) => set('count_unit', e.target.value as Pest['default_count_unit'])}>
                {Object.entries(COUNT_UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {f.count_unit !== 'presence' && (
              <Field label={f.count_unit === 'percent_plants' ? 'النسبة %' : 'العدد'}>
                <input className="input ltr" inputMode="decimal" value={f.count_value} onChange={(e) => set('count_value', e.target.value)} />
              </Field>
            )}
            <Field label="نباتات مفحوصة"><input className="input ltr" inputMode="numeric" value={f.plants_inspected} onChange={(e) => set('plants_inspected', e.target.value)} /></Field>
            <Field label="نباتات مصابة"><input className="input ltr" inputMode="numeric" value={f.plants_infested} onChange={(e) => set('plants_infested', e.target.value)} /></Field>
          </div>
          <div>
            <p className="field-label">الطور</p>
            <div className="chips-pick">
              {LIFE_STAGES.map((st) => (
                <button type="button" key={st} aria-pressed={f.stages.includes(st)}
                  onClick={() => set('stages', f.stages.includes(st) ? f.stages.filter((x) => x !== st) : [...f.stages, st])}>{st}</button>
              ))}
            </div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={f.is_hotspot} onChange={(e) => set('is_hotspot', e.target.checked)} />
            <span><b>بؤرة إصابة</b><small>تركّز واضح في مكان محدد يحتاج تدخل موضعي</small></span>
          </label>
          <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        </fieldset>

        <div>
          <p className="field-label">صور</p>
          <PhotoStrip
            photos={[...saved, ...files.map((x) => ({ id: x.id, url: x.url, pending: true }))]}
            onAdd={readOnly ? undefined : (fs) => setFiles((cur) => [...cur, ...fs.map((file) => ({ id: crypto.randomUUID?.() ?? String(Math.random()), file, url: URL.createObjectURL(file) }))])}
            onRemove={readOnly ? undefined : (pid) => {
              const local = files.find((x) => x.id === pid);
              if (local) { URL.revokeObjectURL(local.url); setFiles((cur) => cur.filter((x) => x.id !== pid)); }
              else void removePhoto(pid);
            }}
          />
        </div>

        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          {!readOnly && <button className="btn primary" type="submit" disabled={busy}><Icon name="check" /> {existing ? 'حفظ التعديل' : 'تسجيل'}</button>}
          <button className="btn" type="button" onClick={onClose}>{readOnly ? 'إغلاق' : 'إلغاء'}</button>
          {existing && can.advise && (
            <button className="btn" type="button" onClick={() => nav(`/recs/new?gh=${session.greenhouse_id}&obs=${existing.id}&pest=${pest.id}`)}>
              <Icon name="note" size={20} /> اكتب توصية
            </button>
          )}
          {existing && !readOnly && (
            <button className="btn danger" type="button" style={{ marginInlineStart: 'auto' }} onClick={async () => {
              if (!confirm('حذف هذه الملاحظة؟')) return;
              await softDelete('scouting_observations', existing.id);
              toast('تم حذف الملاحظة');
              onClose();
            }}><Icon name="trash" size={20} /> حذف</button>
          )}
        </div>
      </form>
    </Sheet>
  );
}

function SessionInfo({ s, editable, onClose }: { s: Session; editable: boolean; onClose: () => void }) {
  const { toast } = useApp();
  const nav = useNavigate();
  const people = usePeople();
  const [f, setF] = useState({
    plants_inspected: numStr(s.plants_inspected), air_temp_c: numStr(s.air_temp_c), air_rh_pct: numStr(s.air_rh_pct), notes: s.notes ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="بيانات الجولة" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        const rh = toNum(f.air_rh_pct);
        if (rh != null && (rh < 0 || rh > 100)) return setErr('الرطوبة بين 0 و100');
        const t = toNum(f.air_temp_c);
        if (t != null && (t < -10 || t > 60)) return setErr('درجة الحرارة غير منطقية');
        await update('scouting_sessions', s.id, { plants_inspected: toNum(f.plants_inspected), air_temp_c: t, air_rh_pct: rh, notes: f.notes.trim() || null });
        toast('تم الحفظ');
        onClose();
      }}>
        <p className="muted">المهندس: {people.get(s.scout_id ?? s.created_by ?? '') ?? '—'}</p>
        <fieldset disabled={!editable} className="form-grid tight" style={{ border: 0, padding: 0, margin: 0 }}>
          <Field label="نباتات مفحوصة"><input className="input ltr" inputMode="numeric" value={f.plants_inspected} onChange={(e) => setF({ ...f, plants_inspected: e.target.value })} /></Field>
          <Field label="الحرارة °م"><input className="input ltr" inputMode="decimal" value={f.air_temp_c} onChange={(e) => setF({ ...f, air_temp_c: e.target.value })} /></Field>
          <Field label="الرطوبة %"><input className="input ltr" inputMode="decimal" value={f.air_rh_pct} onChange={(e) => setF({ ...f, air_rh_pct: e.target.value })} /></Field>
        </fieldset>
        <Field label="ملاحظات عامة"><textarea className="textarea" disabled={!editable} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          {editable && <button className="btn primary" type="submit">حفظ</button>}
          <button className="btn" type="button" onClick={onClose}>إغلاق</button>
          {editable && (
            <button className="btn danger" type="button" style={{ marginInlineStart: 'auto' }} onClick={async () => {
              if (!confirm('حذف الجولة بكل ملاحظاتها؟')) return;
              const obs = await db.scouting_observations.where('session_id').equals(s.id).toArray();
              for (const o of obs.filter(alive)) await softDelete('scouting_observations', o.id);
              await softDelete('scouting_sessions', s.id);
              toast('تم حذف الجولة');
              nav(`/scout/gh/${s.greenhouse_id}`);
            }}><Icon name="trash" size={20} /> حذف الجولة</button>
          )}
        </div>
      </form>
    </Sheet>
  );
}

function AddPestSheet({ farmId, onClose, onAdded }: { farmId: string; onClose: () => void; onAdded: (p: Pest) => void }) {
  const [f, setF] = useState({ name_ar: '', name_en: '', scientific_name: '', category: 'insect' as Pest['category'], unit: 'presence' as Pest['default_count_unit'] });
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="إضافة آفة أو مرض للمزرعة" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        const name = f.name_ar.trim();
        if (!name) return setErr('الاسم بالعربي مطلوب');
        const dup = (await db.pests.toArray()).find((p) => alive(p) && (p.farm_id == null || p.farm_id === farmId) && p.name_ar === name);
        if (dup) return setErr('الاسم موجود بالفعل في القائمة');
        const p = await create('pests', {
          farm_id: farmId, code: `custom_${Date.now().toString(36)}`, name_ar: name, name_en: f.name_en.trim() || name,
          scientific_name: f.scientific_name.trim() || null, category: f.category, default_count_unit: f.unit, sort_order: 200,
        });
        onAdded(p);
      }}>
        <Field label="الاسم بالعربي"><input className="input" value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} autoFocus /></Field>
        <div className="form-grid tight">
          <Field label="الاسم بالإنجليزي"><input className="input ltr" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></Field>
          <Field label="الاسم العلمي"><input className="input ltr" value={f.scientific_name} onChange={(e) => setF({ ...f, scientific_name: e.target.value })} /></Field>
          <Field label="النوع">
            <select className="select" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Pest['category'] })}>
              {Object.entries(PEST_CATEGORY_LABEL).filter(([k]) => k !== 'oomycete').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="وحدة العد المعتادة">
            <select className="select" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as Pest['default_count_unit'] })}>
              {Object.entries(COUNT_UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions">
          <button className="btn primary" type="submit"><Icon name="plus" /> إضافة</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Sheet>
  );
}
