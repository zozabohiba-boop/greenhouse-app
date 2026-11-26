// اختيار المادة بالتصنيف العلمي: بحث مباشر + فئة كبرى ← فئة صغرى + إضافة جديد في كل فئة
import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Field } from './Field';
import { create } from '../lib/repo';
import { norm, productMatches, type CatalogIndex, type Category, type Product } from '../lib/catalog';
import { doseText } from '../lib/advice';

/** زر يعرض المادة المختارة ويفتح المنتقي */
export function ProductPickButton({ product, cat, onOpen, placeholder = 'اختر المادة…' }: {
  product?: Product; cat?: CatalogIndex; onOpen: () => void; placeholder?: string;
}) {
  return (
    <button type="button" className="pick-btn" onClick={onOpen} aria-label="المادة">
      {product ? (
        <span className="grow">
          <b>{product.name}</b>
          <small>{cat?.path(product.category_id)}{product.active_ingredient ? ` · ${product.active_ingredient}` : ''}</small>
        </span>
      ) : <span className="grow muted">{placeholder}</span>}
      <Icon name="search" size={20} />
    </button>
  );
}

export function ProductPickerSheet({ products, cat, majorCodes, title = 'اختيار المادة', canAdd, onPick, onAddNew, onClose }: {
  products: Product[];
  cat: CatalogIndex;
  /** الفئات الكبرى المسموحة (لنوع المعاملة) — فارغة = الكل */
  majorCodes?: string[];
  title?: string;
  canAdd: boolean;
  onPick: (p: Product) => void;
  onAddNew: (name: string, subId: string | null) => void;
  onClose: () => void;
}) {
  const majors = useMemo(() => {
    const ms = majorCodes?.length ? majorCodes.map((c) => cat.byCode.get(c)).filter(Boolean) as Category[] : cat.majors;
    return ms;
  }, [cat, majorCodes]);
  const allowedMajor = new Set(majors.map((m) => m.id));
  const [major, setMajor] = useState<string>('');
  const [sub, setSub] = useState<string>('');
  const [q, setQ] = useState('');
  const inScope = products.filter((p) => {
    const m = cat.majorOf(p.category_id);
    return m ? allowedMajor.has(m.id) : !majorCodes?.length || true;
  });
  const list = inScope.filter((p) => {
    const m = cat.majorOf(p.category_id);
    if (major && m?.id !== major) return false;
    if (sub && p.category_id !== sub) return false;
    return productMatches(p, q, cat);
  });
  const subs = major ? cat.subs(major) : [];
  // تجميع حسب الفئة الصغرى
  const groups = new Map<string, Product[]>();
  for (const p of list) {
    const k = p.category_id && cat.byId.has(p.category_id) ? p.category_id : '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  const order = [...groups.keys()].sort((a, b) => {
    const ca = cat.byId.get(a), cb = cat.byId.get(b);
    const ma = cat.majorOf(a), mb = cat.majorOf(b);
    return (majors.findIndex((m) => m.id === ma?.id) - majors.findIndex((m) => m.id === mb?.id)) || ((ca?.sort_order ?? 999) - (cb?.sort_order ?? 999));
  });
  const scopeName = sub ? cat.byId.get(sub)?.name_ar : major ? cat.byId.get(major)?.name_ar : 'كل الفئات';

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="picker">
        <label className="search-box">
          <Icon name="search" size={20} />
          <input className="input" autoFocus placeholder={`ابحث في ${scopeName} بالاسم أو المادة الفعالة أو الآفة`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث عن مادة" />
        </label>
        <div className="chips-scroll" role="group" aria-label="الفئة الكبرى">
          <button type="button" aria-pressed={!major} onClick={() => { setMajor(''); setSub(''); }}>الكل</button>
          {majors.map((m) => (
            <button type="button" key={m.id} aria-pressed={major === m.id} onClick={() => { setMajor(m.id); setSub(''); }}>{m.name_ar}</button>
          ))}
        </div>
        {subs.length > 0 && (
          <div className="chips-scroll sub" role="group" aria-label="الفئة الصغرى">
            <button type="button" aria-pressed={!sub} onClick={() => setSub('')}>كل {cat.byId.get(major)?.name_ar}</button>
            {subs.map((s) => <button type="button" key={s.id} aria-pressed={sub === s.id} onClick={() => setSub(s.id)}>{s.name_ar}</button>)}
          </div>
        )}
        <div className="picker-list">
          {order.map((k) => (
            <section key={k || 'none'}>
              <h3 className="picker-h"><span>{k ? cat.path(k) : 'غير مصنّف'}</span><span className="faint num">{groups.get(k)!.length}</span>
                {canAdd && k && <button type="button" className="btn ghost sm" onClick={() => onAddNew(q.trim(), k)}><Icon name="plus" size={16} /> إضافة هنا</button>}
              </h3>
              <ul>
                {groups.get(k)!.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="pick-row" onClick={() => onPick(p)}>
                      <span className="grow">
                        <b>{p.name}</b>{p.is_bio && <span className="chip ok sm">حيوي</span>}{p.farm_id && <span className="chip sm">خاص بالمشروع</span>}
                        <small>{[p.active_ingredient ?? p.bio_species, p.moa_code && `مجموعة ${p.moa_code}`, doseText(p), p.phi_days != null && `أمان ${p.phi_days} يوم`].filter(Boolean).join(' · ')}</small>
                      </span>
                      <Icon name="chevron" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {list.length === 0 && (
            <div className="empty-mini">
              <p>لا توجد مادة مطابقة{q ? ` لـ "${q}"` : ''} في {scopeName}.</p>
            </div>
          )}
        </div>
        {canAdd && (
          <button type="button" className="btn primary block" onClick={() => onAddNew(q.trim(), sub || null)}>
            <Icon name="plus" /> {q.trim() ? `إضافة "${q.trim()}" كمادة جديدة` : 'إضافة مادة جديدة'}
          </button>
        )}
      </div>
    </Sheet>
  );
}

/** اختيار الفئة (كبرى ثم صغرى) مع بحث وإضافة فئة جديدة خاصة بالمشروع */
export function CategoryField({ cat, value, onChange, farmId, canAdd, majorCodes }: {
  cat: CatalogIndex; value: string | null; onChange: (subId: string | null, c?: Category) => void;
  farmId: string; canAdd: boolean; majorCodes?: string[];
}) {
  const cur = value ? cat.byId.get(value) : undefined;
  const [major, setMajor] = useState<string>(cur?.parent_id ?? cur?.id ?? '');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState<'major' | 'sub' | null>(null);
  const [newName, setNewName] = useState('');
  const majors = majorCodes?.length ? cat.majors.filter((m) => majorCodes.includes(m.code)) : cat.majors;
  const subs = major ? cat.subs(major).filter((s) => !q || norm(s.name_ar).includes(norm(q)) || norm(s.name_en).includes(norm(q))) : [];
  // بحث شامل في كل الفئات الصغرى
  const found = !major && q ? cat.all.filter((c) => c.parent_id && (norm(c.name_ar).includes(norm(q)) || norm(c.name_en).includes(norm(q)))) : [];

  async function addCategory() {
    const name = newName.trim();
    if (!name) return;
    const parent = adding === 'sub' ? cat.byId.get(major) : undefined;
    const code = `farm_${Date.now().toString(36)}`;
    const c = await create('product_categories', {
      farm_id: farmId, parent_id: parent?.id ?? null, code, name_ar: name,
      domain: parent?.domain ?? 'ipm', default_product_type: parent ? null : null, is_bio: false, sort_order: 500,
    });
    setAdding(null); setNewName('');
    if (adding === 'major') setMajor(c.id);
    else onChange(c.id, c);
  }

  return (
    <div className="cat-field">
      <Field label="الفئة الكبرى">
        <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <select className="select" value={major} onChange={(e) => { setMajor(e.target.value); onChange(null); }} aria-label="الفئة الكبرى">
            <option value="">— اختر —</option>
            {majors.map((m) => <option key={m.id} value={m.id}>{m.name_ar}</option>)}
          </select>
          {canAdd && <button type="button" className="iconbtn" aria-label="فئة كبرى جديدة" onClick={() => setAdding('major')}><Icon name="plus" size={18} /></button>}
        </div>
      </Field>
      <Field label="الفئة الصغرى">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input className="input" placeholder={major ? 'ابحث في الفئات الصغرى' : 'ابحث في كل الفئات'} value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في الفئات" />
        </label>
      </Field>
      <div className="chips-pick" role="group" aria-label="الفئة الصغرى">
        {(major ? subs : found).map((s) => (
          <button type="button" key={s.id} aria-pressed={value === s.id} onClick={() => { if (!major && s.parent_id) setMajor(s.parent_id); onChange(s.id, s); }}>
            {!major && <small className="faint">{cat.byId.get(s.parent_id!)?.name_ar} ← </small>}{s.name_ar}
          </button>
        ))}
        {canAdd && major && <button type="button" className="add" onClick={() => setAdding('sub')}><Icon name="plus" size={16} /> فئة صغرى جديدة</button>}
      </div>
      {cur && <p className="faint" style={{ margin: 0 }}>التصنيف: {cat.path(cur.id)}</p>}
      {adding && (
        <div className="inline-add">
          <input className="input" autoFocus placeholder={adding === 'major' ? 'اسم الفئة الكبرى الجديدة' : `فئة صغرى جديدة تحت ${cat.byId.get(major)?.name_ar ?? ''}`} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="button" className="btn primary" onClick={() => void addCategory()}>إضافة</button>
          <button type="button" className="btn" onClick={() => setAdding(null)}>إلغاء</button>
        </div>
      )}
    </div>
  );
}
