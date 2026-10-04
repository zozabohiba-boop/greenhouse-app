import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, createMany, softDelete, update } from '../lib/repo';
import { cropAgeWeeks, formatDate, todayLocal } from '../lib/dates';
import { CYCLE_STATUS_LABEL, SUBSTRATE_LABEL } from '../lib/labels';
import { Field, numStr, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { byCode } from './Home';
import type { Row } from '../lib/schema';

function Back({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="back"><Icon name="back" size={18} /> {label}</Link>
  );
}

function RequireManage({ children }: { children: JSX.Element }) {
  const { can, role } = useApp();
  if (role && !can.manage) return <Navigate to="/" replace />;
  return children;
}

// ── قائمة الصوب ──────────────────────────────────────────────────────
export function SetupHome() {
  const { farmId } = useApp();
  const list = useLiveQuery(async () => {
    const ghs = (await db.greenhouses.where('farm_id').equals(farmId!).toArray()).filter(alive).sort(byCode);
    const cycles = (await db.crop_cycles.where('farm_id').equals(farmId!).toArray()).filter(alive);
    const crops = new Map((await db.crops.toArray()).map((c) => [c.id, c.name_ar]));
    return ghs.map((g) => {
      const active = cycles.find((c) => c.greenhouse_id === g.id && c.status !== 'finished');
      return { g, active, crop: active ? crops.get(active.crop_id) : undefined };
    });
  }, [farmId]);

  return (
    <RequireManage>
      <main className="page">
        <Back to="/" label="الرئيسية" />
        <div className="page-head">
          <div><h1>الصوب والدورات الزراعية</h1><p>هيكل المزرعة الذي يعتمد عليه التسجيل الميداني</p></div>
          <Link to="/setup/greenhouses/new" className="btn primary"><Icon name="plus" /> صوبة جديدة</Link>
        </div>
        {list?.length === 0 && (
          <div className="panel empty"><h3>لا توجد صوب</h3><p>أضف الصوب بأكوادها كما هي مكتوبة في المزرعة.</p></div>
        )}
        {!!list?.length && (
          <ul className="list panel">
            {list.map(({ g, active, crop }) => (
              <li key={g.id}>
                <Link to={`/setup/greenhouses/${g.id}`} className="list-item">
                  <b className="num" style={{ minWidth: 70, fontSize: 'var(--fs-lg)' }}>{g.code}</b>
                  <span className="grow">
                    {g.name && <span>{g.name}، </span>}
                    <span className="muted">{g.area_m2 ? `${g.area_m2} م²` : 'المساحة غير محددة'}</span>
                  </span>
                  {active ? <span className="chip ok">{crop} — قائمة</span> : <span className="chip">بدون دورة</span>}
                  <Icon name="chevron" size={20} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireManage>
  );
}

// ── إضافة / تعديل صوبة ───────────────────────────────────────────────
export function GreenhouseForm() {
  const { id } = useParams();
  const { farmId, toast } = useApp();
  const nav = useNavigate();
  const existing = useLiveQuery(async () => (id ? (await db.greenhouses.get(id)) ?? null : null), [id]);
  if (id && existing === undefined) return null;
  return (
    <RequireManage>
      <GreenhouseFormInner key={existing?.id ?? 'new'} existing={existing ?? null} farmId={farmId!} onDone={(gid, msg) => { toast(msg); nav(`/setup/greenhouses/${gid}`, { replace: true }); }} />
    </RequireManage>
  );
}

function GreenhouseFormInner({ existing, farmId, onDone }: { existing: Row<'greenhouses'> | null; farmId: string; onDone: (id: string, msg: string) => void }) {
  const [f, setF] = useState({
    code: existing?.code ?? '',
    name: existing?.name ?? '',
    greenhouse_type: existing?.greenhouse_type ?? '',
    area_m2: numStr(existing?.area_m2),
    spans_count: numStr(existing?.spans_count),
    rows_count: numStr(existing?.rows_count),
    row_length_m: numStr(existing?.row_length_m),
    cover_material: existing?.cover_material ?? '',
    notes: existing?.notes ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const code = f.code.trim().toUpperCase();
    if (!code) return setErr('كود الصوبة مطلوب');
    const dup = (await db.greenhouses.where('farm_id').equals(farmId).toArray()).find(
      (g) => alive(g) && g.code.toUpperCase() === code && g.id !== existing?.id,
    );
    if (dup) return setErr(`الكود ${code} مستخدم لصوبة أخرى`);
    const pos = (v: string, label: string) => {
      const n = toNum(v);
      if (n != null && n <= 0) throw new Error(`${label} يجب أن يكون أكبر من صفر`);
      return n;
    };
    try {
      const values = {
        code,
        name: f.name.trim() || null,
        greenhouse_type: f.greenhouse_type.trim() || null,
        area_m2: pos(f.area_m2, 'المساحة'),
        spans_count: pos(f.spans_count, 'عدد البواكي'),
        rows_count: pos(f.rows_count, 'عدد الخطوط'),
        row_length_m: pos(f.row_length_m, 'طول الخط'),
        cover_material: f.cover_material.trim() || null,
        notes: f.notes.trim() || null,
      };
      if (existing) {
        await update('greenhouses', existing.id, values);
        onDone(existing.id, 'تم حفظ التعديلات');
      } else {
        const g = await create('greenhouses', { ...values, farm_id: farmId });
        onDone(g.id, `تمت إضافة الصوبة ${code}`);
      }
    } catch (x) {
      setErr((x as Error).message);
    }
  }

  return (
    <main className="page">
      <Back to={existing ? `/setup/greenhouses/${existing.id}` : '/setup'} label={existing ? `صوبة ${existing.code}` : 'الصوب'} />
      <div className="page-head"><div><h1>{existing ? 'تعديل بيانات الصوبة' : 'صوبة جديدة'}</h1></div></div>
      <form className="panel panel-pad form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="كود الصوبة" hint="كما هو مكتوب على الصوبة، مثل GH-07">
            <input className="input ltr" required value={f.code} onChange={set('code')} autoFocus={!existing} />
          </Field>
          <Field label="اسم وصفي (اختياري)"><input className="input" value={f.name} onChange={set('name')} /></Field>
          <Field label="نوع الصوبة"><input className="input" list="gh-types" value={f.greenhouse_type} onChange={set('greenhouse_type')} /></Field>
          <Field label="المساحة (م²)"><input className="input ltr" inputMode="decimal" value={f.area_m2} onChange={set('area_m2')} /></Field>
          <Field label="عدد البواكي"><input className="input ltr" inputMode="numeric" value={f.spans_count} onChange={set('spans_count')} /></Field>
          <Field label="عدد الخطوط"><input className="input ltr" inputMode="numeric" value={f.rows_count} onChange={set('rows_count')} /></Field>
          <Field label="طول الخط (م)"><input className="input ltr" inputMode="decimal" value={f.row_length_m} onChange={set('row_length_m')} /></Field>
          <Field label="مادة الغطاء"><input className="input" list="gh-covers" value={f.cover_material} onChange={set('cover_material')} /></Field>
        </div>
        <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={set('notes')} /></Field>
        <datalist id="gh-types"><option value="صوبة مفردة" /><option value="متعددة البواكي" /><option value="شبكية" /><option value="أنفاق" /></datalist>
        <datalist id="gh-covers"><option value="بولي إيثيلين" /><option value="بولي كربونيت" /><option value="زجاج" /><option value="شبك" /></datalist>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions">
          <button className="btn primary">{existing ? 'حفظ التعديلات' : 'إضافة الصوبة'}</button>
        </div>
      </form>
    </main>
  );
}

// ── تفاصيل صوبة + دوراتها ────────────────────────────────────────────
export function GreenhouseDetail() {
  const { id } = useParams();
  const { toast } = useApp();
  const nav = useNavigate();
  const data = useLiveQuery(async () => {
    const g = await db.greenhouses.get(id!);
    const cycles = (await db.crop_cycles.where('greenhouse_id').equals(id!).toArray())
      .filter(alive)
      .sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1));
    const crops = new Map((await db.crops.toArray()).map((c) => [c.id, c.name_ar]));
    const vars = new Map((await db.varieties.toArray()).map((v) => [v.id, v.name]));
    return { g, cycles, crops, vars };
  }, [id]);
  const [confirm, setConfirm] = useState(false);
  if (!data) return null;
  const { g, cycles, crops, vars } = data;
  if (!alive(g)) return <main className="page"><div className="panel empty"><h3>الصوبة غير موجودة</h3><Link className="btn" to="/setup">رجوع</Link></div></main>;
  const active = cycles.find((c) => c.status !== 'finished');

  return (
    <RequireManage>
      <main className="page">
        <Back to="/setup" label="الصوب" />
        <div className="page-head">
          <div>
            <h1><span className="num">{g.code}</span>{g.name ? ` — ${g.name}` : ''}</h1>
            <p>
              {[g.area_m2 && `${g.area_m2} م²`, g.spans_count && `${g.spans_count} بواكي`, g.rows_count && `${g.rows_count} خط`, g.cover_material]
                .filter(Boolean).join('، ') || 'لم تُسجّل الأبعاد'}
            </p>
          </div>
          <div className="row">
            <Link className="btn" to={`/setup/greenhouses/${g.id}/edit`}><Icon name="edit" size={20} /> تعديل</Link>
            {!active && <Link className="btn primary" to={`/setup/greenhouses/${g.id}/cycles/new`}><Icon name="plus" /> دورة زراعية جديدة</Link>}
          </div>
        </div>

        <h2 className="section-title">الدورات الزراعية</h2>
        {cycles.length === 0 ? (
          <div className="panel empty">
            <h3>لا توجد دورات</h3>
            <p>أضف الدورة الزراعية الحالية (المحصول، الصنف، تاريخ الشتل) لتبدأ التسجيل.</p>
            <Link className="btn primary" to={`/setup/greenhouses/${g.id}/cycles/new`}><Icon name="plus" /> دورة زراعية جديدة</Link>
          </div>
        ) : (
          <ul className="list panel">
            {cycles.map((c) => (
              <li key={c.id}>
                <Link className="list-item" to={`/setup/cycles/${c.id}`}>
                  <span className="grow">
                    <b>{crops.get(c.crop_id)}{c.variety_id ? ` — ${vars.get(c.variety_id) ?? ''}` : ''}</b>
                    <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                      شتل {formatDate(c.planting_date)}{c.status !== 'finished' ? `، الأسبوع ${cropAgeWeeks(c.planting_date) + 1}` : c.end_date ? `، انتهت ${formatDate(c.end_date)}` : ''}
                    </p>
                  </span>
                  <span className={`chip ${c.status === 'active' ? 'ok' : ''}`}>{CYCLE_STATUS_LABEL[c.status]}</span>
                  <Icon name="chevron" size={20} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {cycles.length === 0 && (
          <div style={{ marginTop: 28 }}>
            <button className="btn danger" onClick={() => setConfirm(true)}>حذف الصوبة</button>
          </div>
        )}
        {confirm && (
          <Sheet title={`حذف الصوبة ${g.code}؟`} onClose={() => setConfirm(false)}>
            <p className="muted" style={{ marginBottom: 16 }}>الصوبة ليس لها دورات زراعية. سيتم إخفاؤها من كل الأجهزة.</p>
            <div className="form-actions">
              <button className="btn danger" onClick={async () => { await softDelete('greenhouses', g.id); toast('تم حذف الصوبة'); nav('/setup', { replace: true }); }}>حذف</button>
              <button className="btn" onClick={() => setConfirm(false)}>إلغاء</button>
            </div>
          </Sheet>
        )}
      </main>
    </RequireManage>
  );
}

// ── إضافة / تعديل دورة زراعية ────────────────────────────────────────
export function CycleForm() {
  const { ghId, id } = useParams();
  const existing = useLiveQuery(async () => (id ? (await db.crop_cycles.get(id)) ?? null : null), [id]);
  if (id && existing === undefined) return null;
  return (
    <RequireManage>
      <CycleFormInner key={existing?.id ?? 'new'} existing={existing ?? null} greenhouseId={existing?.greenhouse_id ?? ghId!} />
    </RequireManage>
  );
}

function CycleFormInner({ existing, greenhouseId }: { existing: Row<'crop_cycles'> | null; greenhouseId: string }) {
  const { farmId, toast } = useApp();
  const nav = useNavigate();
  const crops = useLiveQuery(() => db.crops.toArray(), []);
  const varieties = useLiveQuery(() => db.varieties.toArray(), []);
  const existingVariety = varieties?.find((v) => v.id === existing?.variety_id)?.name ?? '';
  const [f, setF] = useState({
    crop_id: existing?.crop_id ?? '',
    variety: '',
    rootstock: existing?.rootstock ?? '',
    substrate: existing?.substrate ?? '',
    planting_date: existing?.planting_date ?? todayLocal(),
    expected_end_date: existing?.expected_end_date ?? '',
    plants_count: numStr(existing?.plants_count),
    plant_density_m2: numStr(existing?.plant_density_m2),
    stem_density_m2: numStr(existing?.stem_density_m2),
    notes: existing?.notes ?? '',
  });
  const variety = f.variety || existingVariety;
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const cropId = f.crop_id || crops?.find((c) => c.code === 'tomato')?.id || '';
  const cropVarieties = useMemo(
    () => (varieties ?? []).filter((v) => alive(v) && v.crop_id === cropId && (!v.farm_id || v.farm_id === farmId)),
    [varieties, cropId, farmId],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!cropId) return setErr('اختر المحصول');
    if (!f.planting_date) return setErr('تاريخ الشتل مطلوب');
    if (f.expected_end_date && f.expected_end_date < f.planting_date) return setErr('تاريخ الانتهاء المتوقع قبل تاريخ الشتل');
    let variety_id: string | null = null;
    const vname = variety.trim();
    if (vname) {
      const found = cropVarieties.find((v) => v.name.trim().toLowerCase() === vname.toLowerCase());
      variety_id = found ? found.id : (await create('varieties', { farm_id: farmId!, crop_id: cropId, name: vname })).id;
    }
    const values = {
      crop_id: cropId,
      variety_id,
      rootstock: f.rootstock.trim() || null,
      substrate: (f.substrate || null) as Row<'crop_cycles'>['substrate'],
      planting_date: f.planting_date,
      expected_end_date: f.expected_end_date || null,
      plants_count: toNum(f.plants_count),
      plant_density_m2: toNum(f.plant_density_m2),
      stem_density_m2: toNum(f.stem_density_m2),
      notes: f.notes.trim() || null,
    };
    if (existing) {
      await update('crop_cycles', existing.id, values);
      toast('تم حفظ الدورة');
      nav(`/setup/cycles/${existing.id}`, { replace: true });
    } else {
      const c = await create('crop_cycles', { ...values, farm_id: farmId!, greenhouse_id: greenhouseId, status: 'active' });
      toast('تمت إضافة الدورة — حدّد الآن النباتات المرجعية');
      nav(`/setup/cycles/${c.id}`, { replace: true });
    }
  }

  return (
    <main className="page">
      <Back to={existing ? `/setup/cycles/${existing.id}` : `/setup/greenhouses/${greenhouseId}`} label="رجوع" />
      <div className="page-head"><div><h1>{existing ? 'تعديل الدورة الزراعية' : 'دورة زراعية جديدة'}</h1></div></div>
      <form className="panel panel-pad form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="المحصول">
            <select className="select" value={cropId} onChange={set('crop_id')}>
              {crops?.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="الصنف" hint="اكتب اسم الصنف — يُحفظ تلقائيًا للمرات القادمة">
            <input className="input" list="varieties" value={variety} onChange={(e) => setF({ ...f, variety: e.target.value })} />
          </Field>
          <Field label="الأصل (للمطعوم)"><input className="input" value={f.rootstock} onChange={set('rootstock')} /></Field>
          <Field label="بيئة الزراعة">
            <select className="select" value={f.substrate} onChange={set('substrate')}>
              <option value="">— اختر —</option>
              {Object.entries(SUBSTRATE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="تاريخ الشتل"><input className="input ltr" type="date" required value={f.planting_date} onChange={set('planting_date')} /></Field>
          <Field label="نهاية متوقعة"><input className="input ltr" type="date" value={f.expected_end_date} onChange={set('expected_end_date')} /></Field>
          <Field label="عدد النباتات"><input className="input ltr" inputMode="numeric" value={f.plants_count} onChange={set('plants_count')} /></Field>
          <Field label="كثافة النبات (نبات/م²)"><input className="input ltr" inputMode="decimal" value={f.plant_density_m2} onChange={set('plant_density_m2')} /></Field>
          <Field label="كثافة السيقان (ساق/م²)"><input className="input ltr" inputMode="decimal" value={f.stem_density_m2} onChange={set('stem_density_m2')} /></Field>
        </div>
        <datalist id="varieties">{cropVarieties.map((v) => <option key={v.id} value={v.name} />)}</datalist>
        <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={set('notes')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions"><button className="btn primary">{existing ? 'حفظ' : 'إضافة الدورة'}</button></div>
      </form>
    </main>
  );
}

// ── تفاصيل الدورة: النباتات المرجعية + القيم المستهدفة ──────────────
export function CycleDetail() {
  const { id } = useParams();
  const { toast } = useApp();
  const data = useLiveQuery(async () => {
    const c = await db.crop_cycles.get(id!);
    if (!c) return { c };
    const [g, crop, variety, plants, targets] = await Promise.all([
      db.greenhouses.get(c.greenhouse_id),
      db.crops.get(c.crop_id),
      c.variety_id ? db.varieties.get(c.variety_id) : Promise.resolve(undefined),
      db.reference_plants.where('crop_cycle_id').equals(c.id).toArray(),
      db.balance_targets.where('crop_cycle_id').equals(c.id).toArray(),
    ]);
    return {
      c, g, crop, variety,
      plants: plants.filter(alive).sort((a, b) => a.row_no - b.row_no || a.label.localeCompare(b.label, 'en', { numeric: true })),
      targets: targets.filter(alive).sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1)),
    };
  }, [id]);
  const [gen, setGen] = useState(false);
  const [tgt, setTgt] = useState<Row<'balance_targets'> | 'new' | null>(null);
  const [finish, setFinish] = useState(false);
  if (!data) return null;
  const { c } = data;
  if (!alive(c)) return <main className="page"><div className="panel empty"><h3>الدورة غير موجودة</h3></div></main>;
  const { g, crop, variety, plants = [], targets = [] } = data as Required<typeof data>;
  const activePlants = plants.filter((p) => p.is_active);
  const current = targets.find((t) => t.valid_from <= todayLocal() && (!t.valid_to || t.valid_to >= todayLocal()));

  return (
    <RequireManage>
      <main className="page">
        <Back to={`/setup/greenhouses/${c.greenhouse_id}`} label={`صوبة ${g?.code ?? ''}`} />
        <div className="page-head">
          <div>
            <h1>{crop?.name_ar}{variety ? ` — ${variety.name}` : ''}</h1>
            <p>
              صوبة <span className="num">{g?.code}</span>، شتل {formatDate(c.planting_date)}
              {c.status !== 'finished' && `، الأسبوع ${cropAgeWeeks(c.planting_date) + 1}`}
              {c.substrate && `، ${SUBSTRATE_LABEL[c.substrate]}`}
            </p>
          </div>
          <div className="row">
            <Link className="btn" to={`/setup/cycles/${c.id}/edit`}><Icon name="edit" size={20} /> تعديل</Link>
            {c.status !== 'finished' && <button className="btn" onClick={() => setFinish(true)}>إنهاء الدورة</button>}
          </div>
        </div>

        <h2 className="section-title">
          <span>النباتات المرجعية <span className="chip">{activePlants.length}</span></span>
          <button className="btn primary" onClick={() => setGen(true)}><Icon name="plus" /> إضافة نباتات</button>
        </h2>
        {plants.length === 0 ? (
          <div className="panel empty">
            <h3>لم تُحدد نباتات مرجعية</h3>
            <p>اختر النباتات المعلّمة التي ستُقاس كل أسبوع — عادةً 2 إلى 4 نباتات في كل خط مختار.</p>
            <button className="btn primary" onClick={() => setGen(true)}><Icon name="plus" /> إضافة نباتات</button>
          </div>
        ) : (
          <div className="panel panel-pad">
            <div className="row" style={{ gap: 8 }}>
              {plants.map((p) => (
                <button key={p.id} className={`chip ${p.is_active ? 'ok' : ''}`} style={{ fontSize: 'var(--fs-sm)', padding: '6px 12px', direction: 'ltr', textDecoration: p.is_active ? 'none' : 'line-through' }}
                  title={p.is_active ? 'اضغط لإيقاف القياس على هذا النبات' : 'اضغط لإعادة تفعيله'}
                  onClick={async () => { await update('reference_plants', p.id, { is_active: !p.is_active }); toast(p.is_active ? `تم إيقاف ${p.label}` : `تم تفعيل ${p.label}`); }}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 10 }}>اضغط على نبات لإيقافه (لو مات أو اتكسر) أو إعادة تفعيله. القياسات السابقة لا تُحذف.</p>
          </div>
        )}

        <h2 className="section-title">
          <span>القيم المستهدفة لتوازن النبات</span>
          <button className="btn" onClick={() => setTgt('new')}><Icon name="plus" /> {current ? 'قيم لمرحلة جديدة' : 'تحديد القيم'}</button>
        </h2>
        <div className="panel panel-pad">
          {targets.length === 0 ? (
            <p className="muted">لم تُحدد بعد. بدونها يظهر حكم التوازن "غير محدد". يحددها الاستشاري حسب الصنف ومرحلة النمو.</p>
          ) : (
            <div className="scroll-x">
              <table className="tbl">
                <thead><tr><th>من تاريخ</th><th>الاستطالة الأسبوعية (سم)</th><th>سمك الساق (مم)</th><th>ارتفاع العنقود المزهر (سم)</th><th /></tr></thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.valid_from)}{t === current && <span className="chip ok" style={{ marginInlineStart: 6 }}>الحالية</span>}</td>
                      <td className="n">{rng(t.weekly_growth_min_cm, t.weekly_growth_max_cm)}</td>
                      <td className="n">{rng(t.stem_diameter_min_mm, t.stem_diameter_max_mm)}</td>
                      <td className="n">{rng(t.flowering_height_min_cm, t.flowering_height_max_cm)}</td>
                      <td><button className="btn ghost" onClick={() => setTgt(t)}><Icon name="edit" size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {gen && <GeneratePlants cycle={c} existing={plants} rowsCount={g?.rows_count ?? null} onClose={() => setGen(false)} />}
        {tgt && <TargetSheet cycle={c} target={tgt === 'new' ? null : tgt} onClose={() => setTgt(null)} />}
        {finish && (
          <Sheet title="إنهاء الدورة الزراعية" onClose={() => setFinish(false)}>
            <p className="muted" style={{ marginBottom: 16 }}>بعد الإنهاء تتوقف الدورة عن الظهور في التسجيل الأسبوعي، وتبقى بياناتها للتحليل. يمكنك بعدها إضافة دورة جديدة للصوبة.</p>
            <div className="form-actions">
              <button className="btn primary" onClick={async () => { await update('crop_cycles', c.id, { status: 'finished', end_date: todayLocal() < c.planting_date ? c.planting_date : todayLocal() }); toast('تم إنهاء الدورة'); setFinish(false); }}>إنهاء الدورة اليوم</button>
              <button className="btn" onClick={() => setFinish(false)}>إلغاء</button>
            </div>
          </Sheet>
        )}
      </main>
    </RequireManage>
  );
}

const rng = (a: unknown, b: unknown) => (a == null && b == null ? '—' : `${a ?? '…'} – ${b ?? '…'}`);

/** يحوّل "1-4, 7, 9-10" إلى [1,2,3,4,7,9,10] */
export function parseRows(spec: string): number[] | null {
  const out = new Set<number>();
  const norm = spec.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[،]/g, ',');
  for (const part of norm.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*(?:-|–|إلى)\s*(\d+)$/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])].sort((x, y) => x - y);
      if (b - a > 500) return null;
      for (let i = a; i <= b; i++) out.add(i);
    } else if (/^\d+$/.test(part)) out.add(Number(part));
    else return null;
  }
  const list = [...out].filter((n) => n > 0).sort((a, b) => a - b);
  return list.length ? list : null;
}

function GeneratePlants({ cycle, existing, rowsCount, onClose }: { cycle: Row<'crop_cycles'>; existing: Row<'reference_plants'>[]; rowsCount: number | null; onClose: () => void }) {
  const { toast } = useApp();
  const [rows, setRows] = useState('');
  const [perRow, setPerRow] = useState('2');
  const parsed = parseRows(rows);
  const n = Math.max(0, Math.min(20, Math.floor(toNum(perRow) ?? 0)));
  const taken = new Set(existing.map((p) => p.label));
  const preview = (parsed ?? []).flatMap((r) =>
    Array.from({ length: n }, (_, i) => ({ row_no: r, label: `R${r}-P${i + 1}` })),
  ).filter((p) => !taken.has(p.label));
  const tooMany = rowsCount != null && parsed?.some((r) => r > rowsCount);

  async function save() {
    await createMany('reference_plants', preview.map((p) => ({ ...p, farm_id: cycle.farm_id, crop_cycle_id: cycle.id })));
    toast(`تمت إضافة ${preview.length} نبات مرجعي`);
    onClose();
  }
  return (
    <Sheet title="إضافة نباتات مرجعية" onClose={onClose}>
      <div className="form">
        <Field label="الخطوط" hint="مثال: 2, 5, 8 أو 1-6">
          <input className="input ltr" value={rows} onChange={(e) => setRows(e.target.value)} placeholder="2, 5, 8" autoFocus />
        </Field>
        <Field label="عدد النباتات في كل خط">
          <input className="input ltr" inputMode="numeric" value={perRow} onChange={(e) => setPerRow(e.target.value)} />
        </Field>
        {rows && !parsed && <p className="form-error">صيغة الخطوط غير مفهومة. اكتب أرقامًا مفصولة بفاصلة أو مدى مثل 1-6.</p>}
        {tooMany && <p className="banner warn">بعض الخطوط أكبر من عدد خطوط الصوبة ({rowsCount}).</p>}
        {preview.length > 0 && (
          <div>
            <p className="muted" style={{ marginBottom: 8 }}>سيتم إنشاء {preview.length} نبات، يُكتب كود كل نبات على كارت معلّق عليه:</p>
            <div className="row" style={{ gap: 6 }}>
              {preview.slice(0, 40).map((p) => <span key={p.label} className="chip" style={{ direction: 'ltr' }}>{p.label}</span>)}
              {preview.length > 40 && <span className="chip">+{preview.length - 40}</span>}
            </div>
          </div>
        )}
        <div className="form-actions">
          <button className="btn primary" disabled={!preview.length || n === 0} onClick={save}>إنشاء {preview.length || ''} نبات</button>
          <button className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </Sheet>
  );
}

function TargetSheet({ cycle, target, onClose }: { cycle: Row<'crop_cycles'>; target: Row<'balance_targets'> | null; onClose: () => void }) {
  const { toast } = useApp();
  const [f, setF] = useState({
    valid_from: target?.valid_from ?? todayLocal(),
    weekly_growth_min_cm: numStr(target?.weekly_growth_min_cm), weekly_growth_max_cm: numStr(target?.weekly_growth_max_cm),
    stem_diameter_min_mm: numStr(target?.stem_diameter_min_mm), stem_diameter_max_mm: numStr(target?.stem_diameter_max_mm),
    flowering_height_min_cm: numStr(target?.flowering_height_min_cm), flowering_height_max_cm: numStr(target?.flowering_height_max_cm),
    notes: target?.notes ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const pair = (label: string, a: keyof typeof f, b: keyof typeof f, unit: string) => (
    <div>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label} <span className="faint">({unit})</span></p>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input className="input ltr" inputMode="decimal" placeholder="الحد الأدنى" aria-label={`${label} الحد الأدنى`} value={f[a]} onChange={set(a)} />
        <span className="faint">إلى</span>
        <input className="input ltr" inputMode="decimal" placeholder="الحد الأعلى" aria-label={`${label} الحد الأعلى`} value={f[b]} onChange={set(b)} />
      </div>
    </div>
  );
  async function save() {
    const v = {
      valid_from: f.valid_from,
      weekly_growth_min_cm: toNum(f.weekly_growth_min_cm), weekly_growth_max_cm: toNum(f.weekly_growth_max_cm),
      stem_diameter_min_mm: toNum(f.stem_diameter_min_mm), stem_diameter_max_mm: toNum(f.stem_diameter_max_mm),
      flowering_height_min_cm: toNum(f.flowering_height_min_cm), flowering_height_max_cm: toNum(f.flowering_height_max_cm),
      notes: f.notes.trim() || null,
    };
    const pairs: [number | null, number | null][] = [
      [v.weekly_growth_min_cm, v.weekly_growth_max_cm], [v.stem_diameter_min_mm, v.stem_diameter_max_mm], [v.flowering_height_min_cm, v.flowering_height_max_cm],
    ];
    if (pairs.some(([a, b]) => a != null && b != null && a > b)) return setErr('الحد الأدنى أكبر من الحد الأعلى في أحد المؤشرات');
    if (pairs.every(([a, b]) => a == null && b == null)) return setErr('أدخل حدًا واحدًا على الأقل');
    if (!v.valid_from) return setErr('حدد تاريخ البداية');
    if (target) await update('balance_targets', target.id, v);
    else {
      // القيم السابقة تنتهي في اليوم السابق لبداية الجديدة
      const prev = (await db.balance_targets.where('crop_cycle_id').equals(cycle.id).toArray()).filter((t) => alive(t) && !t.valid_to && t.valid_from < v.valid_from);
      const dayBefore = new Date(Date.parse(v.valid_from) - 86400000).toISOString().slice(0, 10);
      for (const p of prev) await update('balance_targets', p.id, { valid_to: dayBefore });
      await create('balance_targets', { ...v, farm_id: cycle.farm_id, crop_cycle_id: cycle.id });
    }
    toast('تم حفظ القيم المستهدفة');
    onClose();
  }
  return (
    <Sheet title="القيم المستهدفة" onClose={onClose}>
      <div className="form">
        <p className="muted">فوق الحد الأعلى = اتجاه خضري، تحت الحد الأدنى = اتجاه ثمري. ارتفاع العنقود المزهر يُقاس من القمة النامية.</p>
        <Field label="تبدأ من تاريخ"><input className="input ltr" type="date" value={f.valid_from} onChange={set('valid_from')} /></Field>
        {pair('الاستطالة الأسبوعية', 'weekly_growth_min_cm', 'weekly_growth_max_cm', 'سم')}
        {pair('سمك الساق', 'stem_diameter_min_mm', 'stem_diameter_max_mm', 'مم')}
        {pair('ارتفاع العنقود المزهر', 'flowering_height_min_cm', 'flowering_height_max_cm', 'سم')}
        <Field label="ملاحظات"><input className="input" value={f.notes} onChange={set('notes')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="form-actions"><button className="btn primary" onClick={save}>حفظ</button><button className="btn" onClick={onClose}>إلغاء</button></div>
      </div>
    </Sheet>
  );
}
