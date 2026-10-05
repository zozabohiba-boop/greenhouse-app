// بيانات الموقع: المالك والتواصل، الإحداثيات (للطقس)، المياه والتربة ونظام الري — وإنشاء موقع جديد
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive, create, update } from '../lib/repo';
import { supabase } from '../lib/supabase';
import { syncNow } from '../lib/sync';
import { parseCoords } from '../lib/weather';
import { Field, numStr, toNum } from '../components/Field';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { useFarmProfile } from './Weather';
import type { Row } from '../lib/schema';

const EMPTY = {
  owner_name: '', manager_name: '', contact_phone: '', address: '', coords: '', elevation_m: '', total_area_feddan: '',
  water_source: '', water_ec_ds_m: '', water_ph: '', soil_type: '', irrigation_system: '', climate_control: '',
  cover_transmission_pct: '70', notes: '',
};

export function FarmProfile() {
  const { farmId } = useApp();
  const profile = useFarmProfile(farmId);
  if (profile === undefined) return null;
  return <FarmProfileInner key={profile?.id ?? 'new'} profile={profile} />;
}

function FarmProfileInner({ profile }: { profile: Row<'farm_profiles'> | null }) {
  const { farmId, farm, can, toast } = useApp();
  const stats = useLiveQuery(async () => {
    const [zs, ghs, cycles, docs] = await Promise.all([
      db.farm_zones.where('farm_id').equals(farmId!).toArray(),
      db.greenhouses.where('farm_id').equals(farmId!).toArray(),
      db.crop_cycles.where('farm_id').equals(farmId!).toArray(),
      db.documents.where('farm_id').equals(farmId!).toArray(),
    ]);
    const live = ghs.filter(alive);
    return {
      zones: zs.filter(alive).length,
      ghs: live.length,
      area: live.reduce((a, g) => a + (Number(g.area_m2) || 0), 0),
      active: cycles.filter((c) => alive(c) && c.status !== 'finished').length,
      docs: docs.filter(alive).length,
    };
  }, [farmId]);
  const p = profile;
  const [f, setF] = useState(p ? {
    owner_name: p.owner_name ?? '', manager_name: p.manager_name ?? '', contact_phone: p.contact_phone ?? '', address: p.address ?? '',
    coords: p.latitude != null ? `${p.latitude}, ${p.longitude}` : '', elevation_m: numStr(p.elevation_m), total_area_feddan: numStr(p.total_area_feddan),
    water_source: p.water_source ?? '', water_ec_ds_m: numStr(p.water_ec_ds_m), water_ph: numStr(p.water_ph), soil_type: p.soil_type ?? '',
    irrigation_system: p.irrigation_system ?? '', climate_control: p.climate_control ?? '', cover_transmission_pct: numStr(p.cover_transmission_pct), notes: p.notes ?? '',
  } : EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [gps, setGps] = useState(false);
  const [rename, setRename] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const coords = parseCoords(f.coords);
  const readOnly = !can.manage;

  function locate() {
    if (!('geolocation' in navigator)) return setErr('الجهاز لا يدعم تحديد الموقع');
    setGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps(false);
        setF((cur) => ({ ...cur, coords: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`, elevation_m: pos.coords.altitude != null ? String(Math.round(pos.coords.altitude)) : cur.elevation_m }));
        setErr(null);
      },
      (e) => { setGps(false); setErr(e.code === 1 ? 'اسمح للتطبيق بالوصول للموقع من إعدادات المتصفح' : 'تعذر تحديد الموقع — جرّب في مكان مفتوح أو الصق الإحداثيات'); },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (f.coords.trim() && !coords) return setErr('الإحداثيات غير مفهومة. اكتبها مثل 29.3081، 30.8421 أو الصق رابط خرائط جوجل');
    const num = (v: string, label: string, lo: number, hi: number) => {
      const n = toNum(v);
      if (n != null && (n < lo || n > hi)) throw new Error(`${label} خارج النطاق المعقول`);
      return n;
    };
    try {
      const values = {
        owner_name: f.owner_name.trim() || null, manager_name: f.manager_name.trim() || null, contact_phone: f.contact_phone.trim() || null,
        address: f.address.trim() || null, latitude: coords?.lat ?? null, longitude: coords?.lon ?? null,
        elevation_m: num(f.elevation_m, 'الارتفاع', -500, 6000), total_area_feddan: num(f.total_area_feddan, 'المساحة', 0.01, 100000),
        water_source: f.water_source.trim() || null, water_ec_ds_m: num(f.water_ec_ds_m, 'EC المياه', 0, 59), water_ph: num(f.water_ph, 'pH المياه', 0, 14),
        soil_type: f.soil_type.trim() || null, irrigation_system: f.irrigation_system.trim() || null, climate_control: f.climate_control.trim() || null,
        cover_transmission_pct: num(f.cover_transmission_pct, 'نفاذية الغطاء', 20, 100) ?? 70, notes: f.notes.trim() || null,
      };
      if (p) await update('farm_profiles', p.id, values);
      else await create('farm_profiles', { ...values, id: farmId!, farm_id: farmId! });
      toast('تم حفظ بيانات الموقع');
    } catch (x) {
      setErr((x as Error).message);
    }
  }

  return (
    <main className="page">
      <Link to="/" className="back"><Icon name="back" size={18} /> الرئيسية</Link>
      <div className="page-head">
        <div><h1>{farm?.name}</h1><p>{farm?.location_text || 'بيانات الموقع ومصادر المياه والإحداثيات'}</p></div>
        {can.admin && <button className="btn" onClick={() => setRename(true)}><Icon name="edit" size={20} /> تعديل الاسم</button>}
      </div>

      {stats && (
        <div className="farm-stats">
          <div className="stat"><span className="k">التقسيمات</span><span className="v num">{stats.zones}</span></div>
          <div className="stat"><span className="k">الصوب</span><span className="v num">{stats.ghs}</span></div>
          <div className="stat"><span className="k">مساحة الصوب</span><span className="v num">{Math.round(stats.area).toLocaleString('en')}</span><span className="d">م²</span></div>
          <div className="stat"><span className="k">دورات قائمة</span><span className="v num">{stats.active}</span></div>
          <div className="stat"><span className="k">الملفات</span><span className="v num">{stats.docs}</span></div>
        </div>
      )}
      <div className="quick-links">
        {can.manage && <Link className="btn" to="/setup"><Icon name="layers" size={20} /> هيكل الموقع والصوب</Link>}
        <Link className="btn" to="/files"><Icon name="folder" size={20} /> الملفات والتقارير</Link>
        <Link className="btn" to="/weather"><Icon name="sun" size={20} /> الطقس</Link>
      </div>

      <form className="form" onSubmit={save}>
        <fieldset disabled={readOnly} className="plain-fieldset">
          <section className="panel panel-pad form">
            <h2 className="form-h">الإحداثيات (لتوقعات الطقس)</h2>
            <Field label="خط العرض، خط الطول" hint="اضغط «موقعي الحالي» وأنت في المزرعة، أو الصق الإحداثيات أو رابط خرائط جوجل">
              <input className="input ltr" value={f.coords} onChange={set('coords')} placeholder="29.308100, 30.842100" />
            </Field>
            <div className="coords">
              <button type="button" className="btn" onClick={locate} disabled={gps}><Icon name="pin" size={20} /> {gps ? 'جاري التحديد…' : 'موقعي الحالي'}</button>
              {coords && <a className="btn ghost" href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer"><Icon name="map" size={20} /> عرض على الخريطة</a>}
              {f.coords.trim() && !coords && <span className="chip bad">غير مفهومة</span>}
              {coords && <span className="chip ok num">{coords.lat}, {coords.lon}</span>}
            </div>
            <div className="form-grid">
              <Field label="الارتفاع عن سطح البحر (م)"><input className="input ltr" inputMode="decimal" value={f.elevation_m} onChange={set('elevation_m')} /></Field>
              <Field label="نفاذية الغطاء للضوء (%)" hint="بلاستيك جديد ~80–85، قديم أو مظلل ~60–70"><input className="input ltr" inputMode="numeric" value={f.cover_transmission_pct} onChange={set('cover_transmission_pct')} /></Field>
            </div>
          </section>

          <section className="panel panel-pad form">
            <h2 className="form-h">بيانات عامة</h2>
            <div className="form-grid">
              <Field label="المالك / الشركة"><input className="input" value={f.owner_name} onChange={set('owner_name')} /></Field>
              <Field label="مدير الموقع"><input className="input" value={f.manager_name} onChange={set('manager_name')} /></Field>
              <Field label="رقم التواصل"><input className="input ltr" inputMode="tel" value={f.contact_phone} onChange={set('contact_phone')} /></Field>
              <Field label="المساحة الكلية (فدان)"><input className="input ltr" inputMode="decimal" value={f.total_area_feddan} onChange={set('total_area_feddan')} /></Field>
            </div>
            <Field label="العنوان"><input className="input" value={f.address} onChange={set('address')} /></Field>
          </section>

          <section className="panel panel-pad form">
            <h2 className="form-h">المياه والتربة والري</h2>
            <div className="form-grid">
              <Field label="مصدر المياه"><input className="input" list="water-src" value={f.water_source} onChange={set('water_source')} /></Field>
              <Field label="ملوحة المياه EC (dS/m)"><input className="input ltr" inputMode="decimal" value={f.water_ec_ds_m} onChange={set('water_ec_ds_m')} /></Field>
              <Field label="pH المياه"><input className="input ltr" inputMode="decimal" value={f.water_ph} onChange={set('water_ph')} /></Field>
              <Field label="نوع التربة / بيئة الزراعة"><input className="input" list="soil-types" value={f.soil_type} onChange={set('soil_type')} /></Field>
              <Field label="نظام الري والتسميد"><input className="input" value={f.irrigation_system} onChange={set('irrigation_system')} placeholder="مثل: تنقيط + وحدة تسميد آلية" /></Field>
              <Field label="التحكم في المناخ"><input className="input" value={f.climate_control} onChange={set('climate_control')} placeholder="مثل: تهوية جانبية + مبرد + شبك تظليل" /></Field>
            </div>
            <Field label="ملاحظات"><textarea className="textarea" value={f.notes} onChange={set('notes')} /></Field>
            <datalist id="water-src"><option value="بئر جوفي" /><option value="ترعة / نيل" /><option value="محطة تحلية" /><option value="خليط" /></datalist>
            <datalist id="soil-types"><option value="رملية" /><option value="طينية" /><option value="صفراء" /><option value="طف بركاني" /><option value="كوكوبيت" /><option value="صوف صخري" /></datalist>
          </section>
        </fieldset>
        {err && <p className="form-error" role="alert">{err}</p>}
        {!readOnly && <div className="form-actions"><button className="btn primary">حفظ بيانات الموقع</button></div>}
      </form>
      {rename && <RenameFarm onClose={() => setRename(false)} />}
    </main>
  );
}

function RenameFarm({ onClose }: { onClose: () => void }) {
  const { farm, toast } = useApp();
  const [name, setName] = useState(farm?.name ?? '');
  const [location, setLocation] = useState(farm?.location_text ?? '');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title="اسم الموقع" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr('الاسم مطلوب');
        if (!navigator.onLine) return setErr('تعديل الاسم يحتاج اتصال بالإنترنت');
        const { error } = await supabase.from('farms').update({ name: name.trim(), location_text: location.trim() || null }).eq('id', farm!.id);
        if (error) return setErr('تعذر الحفظ — تعديل الاسم لمدير النظام فقط');
        await syncNow();
        toast('تم تعديل الاسم');
        onClose();
      }}>
        <Field label="اسم الموقع"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        <Field label="المكان (المحافظة / المنطقة)"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions"><button className="btn primary">حفظ</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}

/** إنشاء موقع جديد — لمدير النظام */
export function NewFarmSheet({ onClose }: { onClose: () => void }) {
  const { setFarmId, toast } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="موقع جديد" onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr('اسم الموقع مطلوب');
        if (!navigator.onLine) return setErr('إنشاء موقع جديد يحتاج اتصال بالإنترنت');
        setBusy(true);
        const { data, error } = await supabase.rpc('create_farm', { p_name: name.trim(), p_location: location.trim() || undefined });
        if (error || !data) {
          setBusy(false);
          return setErr(error?.code === '42501' ? 'إنشاء المواقع متاح لمدير النظام فقط' : 'تعذر إنشاء الموقع، حاول مرة أخرى');
        }
        await syncNow();
        setFarmId(data as string);
        toast(`تم إنشاء ${name.trim()} — ابدأ بتحديد إحداثياته وتقسيمه`);
        onClose();
        nav('/farm');
      }}>
        <p className="muted">كل موقع له صوبه وفريقه وملفاته المستقلة. ستكون مدير النظام فيه، وتقدر تضيف فريقه من «فريق العمل».</p>
        <Field label="اسم الموقع"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثل: موقع الصالحية — القطاع الشمالي" autoFocus /></Field>
        <Field label="المكان (المحافظة / المنطقة)"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        {err && <p className="form-error">{err}</p>}
        <div className="form-actions"><button className="btn primary" disabled={busy}>{busy ? 'جاري الإنشاء…' : 'إنشاء الموقع'}</button><button type="button" className="btn" onClick={onClose}>إلغاء</button></div>
      </form>
    </Sheet>
  );
}
