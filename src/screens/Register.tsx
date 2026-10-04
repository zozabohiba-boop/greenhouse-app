import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, update } from '../lib/repo';
import { cropAgeWeeks, formatDate, isoWeek, todayLocal } from '../lib/dates';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { useGreenhouseBoard } from './Home';
import { FIELDS, FIELD_BY_KEY, GROUPS, checkField, hasAny, type Draft, type MKey } from './fields';
import type { Row } from '../lib/schema';

type M = Row<'plant_measurements'>;

// ── اختيار الصوبة ────────────────────────────────────────────────────
export function RegisterPick() {
  const { farmId, can } = useApp();
  const board = useGreenhouseBoard(farmId);
  if (!can.record) return <Navigate to="/" replace />;
  const ready = board?.filter((b) => b.cycle && b.plants > 0) ?? [];
  const { week } = isoWeek(todayLocal());
  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head"><div><h1>تسجيل المحصول</h1><p>الأسبوع {week} — اختر الصوبة</p></div></div>
      {board && ready.length === 0 && (
        <div className="panel empty">
          <h3>لا توجد صوب جاهزة للتسجيل</h3>
          <p>كل صوبة تحتاج دورة زراعية قائمة ونباتات مرجعية محددة.</p>
          {can.manage && <Link className="btn primary" to="/setup">إعداد الصوب</Link>}
        </div>
      )}
      <div className="gh-list">
        {ready.map(({ g, cycle, crop, variety, plants, measured }) => (
          <Link key={g.id} to={`/register/${cycle!.id}`} className="gh">
            <span className="code">{g.code}</span>
            <span className="meta">
              <b>{crop}{variety ? ` — ${variety}` : ''}</b>
              <span>الأسبوع {cropAgeWeeks(cycle!.planting_date) + 1} من الشتل</span>
            </span>
            {measured >= plants ? (
              <span className="chip ok"><Icon name="check" size={14} /> مكتمل</span>
            ) : measured > 0 ? (
              <span className="chip warn">{measured} من {plants}</span>
            ) : (
              <span className="chip">{plants} نبات</span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}

// ── بيانات شاشة التسجيل ─────────────────────────────────────────────
function useRegistration(cycleId: string, date: string) {
  return useLiveQuery(async () => {
    const cycle = await db.crop_cycles.get(cycleId);
    if (!alive(cycle)) return { cycle: null };
    const { year, week } = isoWeek(date);
    const [gh, crop, plantsAll, weekMs, allMs, sessions] = await Promise.all([
      db.greenhouses.get(cycle.greenhouse_id),
      db.crops.get(cycle.crop_id),
      db.reference_plants.where('crop_cycle_id').equals(cycleId).toArray(),
      db.plant_measurements.where('[crop_cycle_id+iso_year+iso_week]').equals([cycleId, year, week]).toArray(),
      db.plant_measurements.where('crop_cycle_id').equals(cycleId).toArray(),
      db.crop_registration_sessions.where('[crop_cycle_id+iso_year+iso_week]').equals([cycleId, year, week]).toArray(),
    ]);
    const plants = plantsAll
      .filter((p) => alive(p) && p.is_active)
      .sort((a, b) => a.row_no - b.row_no || a.label.localeCompare(b.label, 'en', { numeric: true }));
    const byPlant = new Map<string, M>();
    for (const m of weekMs.filter(alive)) byPlant.set(m.reference_plant_id, m);
    // آخر قياس قبل هذا الأسبوع لكل نبات
    const wk = year * 100 + week;
    const prevByPlant = new Map<string, M>();
    for (const m of allMs.filter(alive)) {
      const k = (m.iso_year ?? 0) * 100 + (m.iso_week ?? 0);
      if (k >= wk) continue;
      const cur = prevByPlant.get(m.reference_plant_id);
      if (!cur || m.measured_on > cur.measured_on) prevByPlant.set(m.reference_plant_id, m);
    }
    const session = sessions.filter(alive).sort((a, b) => (a.created_at < b.created_at ? -1 : 1))[0] ?? null;
    return { cycle, gh, crop, plants, byPlant, prevByPlant, session, year, week };
  }, [cycleId, date]);
}

function toDraft(m: Partial<M> | undefined | null): Draft {
  const d: Draft = {};
  if (!m) return d;
  for (const f of FIELDS) if (m[f.key] != null) d[f.key] = String(m[f.key]);
  return d;
}

// ── شاشة الإدخال ────────────────────────────────────────────────────
export function RegisterEntry() {
  const { cycleId } = useParams();
  const [sp, setSp] = useSearchParams();
  const date = sp.get('d') ?? todayLocal();
  const { can, toast } = useApp();
  const nav = useNavigate();
  const data = useRegistration(cycleId!, date);

  // الحالة محفوظة في refs حتى تكون صحيحة فورًا مع الإدخال السريع (لوحة مفاتيح خارجية/ضغطات متتالية)
  const [, rerender] = useState(0);
  const bump = () => rerender((n) => n + 1);
  const idxRef = useRef(0);
  const fieldRef = useRef<MKey>(FIELDS[0].key);
  const drafts = useRef(new Map<string, Draft>()); // مسودات هذه الجلسة لكل نبات
  const versions = useRef(new Map<string, number>()); // عدّاد تعديلات لكل نبات
  const dirtySet = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chain = useRef<Promise<void>>(Promise.resolve());
  const [dateSheet, setDateSheet] = useState(false);

  const plants = data && 'plants' in data ? data.plants! : [];
  const dataRef = useRef(data);
  dataRef.current = data;
  const plantsRef = useRef(plants);
  plantsRef.current = plants;

  const idx = Math.min(idxRef.current, Math.max(0, plants.length - 1));
  const plant = plants[idx];
  const field = fieldRef.current;
  const draftOf = (pid: string): Draft =>
    drafts.current.get(pid) ?? toDraft(dataRef.current && 'byPlant' in dataRef.current ? dataRef.current.byPlant!.get(pid) : null);
  const draft = plant ? draftOf(plant.id) : {};

  const prev = plant && data && 'prevByPlant' in data ? data.prevByPlant!.get(plant.id) ?? null : null;
  const checks = useMemo(() => Object.fromEntries(FIELDS.map((f) => [f.key, checkField(f, draft, prev)])), [draft, prev]);
  const hasErrors = Object.values(checks).some((c) => c.error);

  /** حفظ نبات محليًا. الحفظ متسلسل، ويقرأ من القاعدة مباشرة فلا يُنشئ سجلًا مكررًا أبدًا */
  const savePlant = useCallback((pid: string): Promise<void> => {
    clearTimeout(timers.current.get(pid));
    if (!dirtySet.current.has(pid)) return chain.current;
    const d = dataRef.current;
    if (!d || !('cycle' in d) || !d.cycle) return chain.current;
    const cycle = d.cycle;
    const snapshot = { ...draftOf(pid) };
    const ver = versions.current.get(pid) ?? 0;
    const prevM = d.prevByPlant!.get(pid) ?? null;
    const values: Partial<M> = {};
    for (const f of FIELDS) {
      const raw = snapshot[f.key];
      const bad = checkField(f, snapshot, prevM).error;
      (values as any)[f.key] = raw == null || raw === '' || bad ? null : Number(raw);
    }
    const { year, week } = isoWeek(date);
    chain.current = chain.current.then(async () => {
      const existing = (await db.plant_measurements
        .where('[reference_plant_id+iso_year+iso_week]').equals([pid, year, week]).toArray()).find(alive);
      if (existing) {
        await update('plant_measurements', existing.id, values);
      } else if (hasAny(values)) {
        let session = (await db.crop_registration_sessions
          .where('[crop_cycle_id+iso_year+iso_week]').equals([cycle.id, year, week]).toArray())
          .filter(alive).sort((a, b) => (a.created_at < b.created_at ? -1 : 1))[0] ?? null;
        if (!session) {
          session = await create('crop_registration_sessions', {
            farm_id: cycle.farm_id, crop_cycle_id: cycle.id, measured_on: date, started_at: new Date().toISOString(),
          });
        }
        await create('plant_measurements', {
          ...values, farm_id: cycle.farm_id, crop_cycle_id: cycle.id, session_id: session.id,
          reference_plant_id: pid, measured_on: date,
        });
      }
      if ((versions.current.get(pid) ?? 0) === ver) {
        dirtySet.current.delete(pid);
        bump();
      }
    }).catch((e) => { console.error('save failed', e); });
    return chain.current;
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushAll = useCallback(async () => {
    for (const pid of [...dirtySet.current]) void savePlant(pid);
    await chain.current;
  }, [savePlant]);

  const goPlant = useCallback((i: number) => {
    const list = plantsRef.current;
    const cur = list[idxRef.current];
    if (cur) void savePlant(cur.id);
    idxRef.current = Math.max(0, Math.min(list.length - 1, i));
    fieldRef.current = FIELDS[0].key;
    bump();
  }, [savePlant]);

  const setField = (k: MKey) => { fieldRef.current = k; bump(); };

  const nextField = useCallback(() => {
    const i = FIELDS.findIndex((f) => f.key === fieldRef.current);
    if (i < FIELDS.length - 1) { fieldRef.current = FIELDS[i + 1].key; bump(); }
    else if (idxRef.current < plantsRef.current.length - 1) goPlant(idxRef.current + 1);
    else { const cur = plantsRef.current[idxRef.current]; if (cur) void savePlant(cur.id); toast('آخر نبات — راجع الملخص'); }
  }, [goPlant, savePlant, toast]);

  const press = useCallback((k: string) => {
    const cur = plantsRef.current[idxRef.current];
    if (!cur) return;
    const fk = fieldRef.current;
    const def = FIELD_BY_KEY[fk];
    const d = draftOf(cur.id);
    let v = d[fk] ?? '';
    if (k === 'back') v = v.slice(0, -1);
    else if (k === 'clear') v = '';
    else if (k === '.') { if (def.decimals === 0 || v.includes('.')) return; v = v === '' ? '0.' : v + '.'; }
    else {
      if (v === '0') v = '';
      const dot = v.indexOf('.');
      if (dot >= 0 && v.length - dot > def.decimals) return;
      if (v.replace('.', '').length >= 5) return;
      v += k;
    }
    drafts.current.set(cur.id, { ...d, [fk]: v });
    versions.current.set(cur.id, (versions.current.get(cur.id) ?? 0) + 1);
    dirtySet.current.add(cur.id);
    clearTimeout(timers.current.get(cur.id));
    timers.current.set(cur.id, setTimeout(() => void savePlant(cur.id), 900));
    bump();
  }, [savePlant]); // eslint-disable-line react-hooks/exhaustive-deps

  // لوحة مفاتيح خارجية
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select,[role=dialog]')) return;
      const map: Record<string, string> = { Backspace: 'back', Delete: 'clear', '.': '.', ',': '.' };
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (map[e.key]) press(map[e.key]);
      else if (e.key === 'Enter' || e.key === 'Tab') nextField();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, nextField]);

  // حفظ كل المعلّق عند مغادرة الشاشة أو إخفاء التطبيق
  const flushRef = useRef(flushAll);
  flushRef.current = flushAll;
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void flushRef.current();
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); void flushRef.current(); };
  }, []);

  const dirty = plant ? dirtySet.current.has(plant.id) : false;

  // على الشاشات الضيقة لوحة الأرقام ثابتة أسفل الشاشة: نُظهر الحقل النشط فوقها دائمًا
  useEffect(() => {
    if (window.matchMedia('(min-width: 900px)').matches) return;
    const el = document.querySelector('.mfield[aria-pressed="true"]');
    const pad = document.querySelector('.pad-col');
    if (!el || !pad) return;
    const r = el.getBoundingClientRect();
    const padTop = pad.getBoundingClientRect().top;
    if (r.bottom > padTop - 8 || r.top < 80) {
      window.scrollBy({ top: r.top - (padTop - r.height) / 2, behavior: 'smooth' });
    }
  }, [field, idx]);

  if (!can.record) return <Navigate to="/" replace />;
  if (!data) return null;
  if (!data.cycle) return <main className="page"><div className="panel empty"><h3>الدورة غير موجودة</h3><Link className="btn" to="/register">رجوع</Link></div></main>;
  const { gh, crop, week } = data as Required<typeof data>;
  if (!plants.length) {
    return <main className="page"><div className="panel empty"><h3>لا توجد نباتات مرجعية نشطة</h3><Link className="btn" to={`/setup/cycles/${cycleId}`}>تحديد النباتات</Link></div></main>;
  }
  const doneCount = plants.filter((p) => hasAny(draftOf(p.id))).length;
  const cur = FIELD_BY_KEY[field];
  const isToday = date === todayLocal();

  return (
    <main className="page" style={{ maxWidth: 1280 }}>
      <Link to="/register" className="back"><Icon name="back" size={18} /> اختيار صوبة</Link>
      <div className="page-head">
        <div>
          <h1><span className="num">{gh?.code}</span> — {crop?.name_ar}</h1>
          <p>
            الأسبوع {week}، {isToday ? 'اليوم' : formatDate(date)}{' '}
            <button className="btn ghost" style={{ minHeight: 32, padding: '0 8px', fontSize: 'var(--fs-sm)' }} onClick={() => setDateSheet(true)}>تغيير التاريخ</button>
          </p>
        </div>
        <div className="row">
          <span className={`chip ${doneCount === plants.length ? 'ok' : 'warn'}`} style={{ fontSize: 'var(--fs-sm)', padding: '6px 12px' }}>
            {doneCount} من {plants.length} نبات
          </span>
          <button className="btn primary" onClick={async () => {
            await flushAll();
            if (data.session && !data.session.completed_at && doneCount === plants.length)
              await update('crop_registration_sessions', data.session.id, { completed_at: new Date().toISOString() });
            nav(`/register/${cycleId}/summary?d=${date}`);
          }}><Icon name="chart" size={20} /> الملخص</button>
        </div>
      </div>

      <div className="reg">
        <nav className="panel rail" aria-label="النباتات المرجعية">
          <ol>
            {plants.map((p, i) => (
              <li key={p.id}>
                <button aria-current={i === idx} data-done={hasAny(draftOf(p.id))} onClick={() => goPlant(i)}>
                  <span className="lbl">{p.label}</span>
                  <span className="st">{hasAny(draftOf(p.id)) && <Icon name="check" size={14} stroke={3} />}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section className="panel" aria-label="القياسات">
          <div className="plant-head">
            <span className="big">{plant?.label}</span>
            <span className="muted">خط {plant?.row_no}</span>
            {prev ? <span className="faint">آخر قياس {formatDate(prev.measured_on)}</span> : <span className="faint">أول قياس لهذا النبات</span>}
            {dirty ? <span className="chip warn" style={{ marginInlineStart: 'auto' }}>غير محفوظ</span> : hasAny(draft) && <span className="chip ok" style={{ marginInlineStart: 'auto' }}>محفوظ على الجهاز</span>}
          </div>
          <div className="meas-groups">
            {GROUPS.map((g) => (
              <div key={g.title} className="meas-group">
                <h3>{g.title}</h3>
                <div className="meas-grid">
                  {g.fields.map((f) => {
                    const c = checks[f.key];
                    return (
                      <button key={f.key} type="button" className="mfield" aria-pressed={field === f.key}
                        data-warn={!!c.warn} data-err={!!c.error} onClick={() => setField(f.key)}
                        aria-label={`${f.label}: ${draft[f.key] ?? 'فارغ'} ${f.unit}`}>
                        <span className="k">{f.label} <span className="u">({f.unit})</span></span>
                        <span className="v">{draft[f.key] ?? ''}</span>
                        {c.error || c.warn ? (
                          <span className="hint">{c.error ?? c.warn}</span>
                        ) : (
                          <span className="prev">{prev?.[f.key] != null ? `الأسبوع الماضي: ${prev[f.key]}` : ' '}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="pad-col">
          <div className="panel keypad">
            <div className="current">
              <span className="k">{cur.label} ({cur.unit})</span>
              <div className="v" aria-live="polite">{draft[field] ?? ''}</div>
            </div>
            <div className="keys">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
                <button key={k} onClick={() => press(k)}>{k}</button>
              ))}
              <button onClick={() => press('.')} disabled={cur.decimals === 0} aria-label="فاصلة عشرية">.</button>
              <button onClick={() => press('0')}>0</button>
              <button onClick={() => press('back')} aria-label="مسح رقم">⌫</button>
            </div>
            <div className="nav">
              <button className="btn" onClick={() => press('clear')}>مسح الحقل</button>
              <button className="btn primary" onClick={() => nextField()}>التالي</button>
            </div>
            <div className="nav">
              <button className="btn" disabled={idx === 0} onClick={() => goPlant(idx - 1)}>النبات السابق</button>
              <button className="btn" disabled={idx === plants.length - 1} onClick={() => goPlant(idx + 1)}>النبات التالي</button>
            </div>
            {hasErrors && <p className="form-error" style={{ fontSize: 'var(--fs-sm)' }}>صحّح الحقول باللون الأحمر — لن تُحفظ قيمها حتى تُصحح.</p>}
          </div>
        </aside>
      </div>

      {dateSheet && (
        <DateSheet value={date} min={data.cycle.planting_date} onClose={() => setDateSheet(false)}
          onPick={async (d) => {
            await flushAll();
            drafts.current.clear(); versions.current.clear(); dirtySet.current.clear();
            idxRef.current = 0; fieldRef.current = FIELDS[0].key;
            setSp(d === todayLocal() ? {} : { d }, { replace: true }); setDateSheet(false);
          }} />
      )}
    </main>
  );
}

function DateSheet({ value, min, onPick, onClose }: { value: string; min: string; onPick: (d: string) => void; onClose: () => void }) {
  const [v, setV] = useState(value);
  const today = todayLocal();
  return (
    <Sheet title="تاريخ القياس" onClose={onClose}>
      <div className="form">
        <p className="muted">استخدمه لو القياسات اتعملت في يوم سابق ولم تُسجل في وقتها.</p>
        <input className="input ltr" type="date" value={v} min={min} max={today} onChange={(e) => setV(e.target.value)} />
        <p className="faint">الأسبوع {v ? isoWeek(v).week : '—'}</p>
        <div className="form-actions">
          <button className="btn primary" disabled={!v || v > today || v < min} onClick={() => onPick(v)}>اعتماد</button>
          <button className="btn" onClick={() => onPick(today)}>اليوم</button>
        </div>
      </div>
    </Sheet>
  );
}
