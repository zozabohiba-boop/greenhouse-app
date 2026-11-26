// سجل المبيدات والتصدير: المواد الفعالة، مجموعة المقاومة، اعتماد الاتحاد الأوروبي،
// والحد الأقصى للمتبقيات (MRL) لكل سوق ومحصول — مع المصدر وتاريخ المراجعة لكل رقم.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { create, update } from '../lib/repo';
import { norm, useCatalogProducts, useRegistry, type Substance } from '../lib/catalog';
import { EU_STATUS_LABEL, MARKET_LABEL } from '../lib/labels';
import { formatDate } from '../lib/dates';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';

const CLASS_LABEL: Record<string, string> = {
  insecticide: 'حشري', acaricide: 'أكاروسي', fungicide: 'فطري', bactericide: 'بكتيري', nematicide: 'نيماتودي',
  herbicide: 'حشائش', plant_growth_regulator: 'منظم نمو', molluscicide: 'قواقع', biological: 'حيوي (ميكروبي)', other: 'أخرى',
};
const CROP_LABEL: Record<string, string> = {
  tomato: 'طماطم', pepper: 'فلفل', cucumber: 'خيار', strawberry: 'فراولة', eggplant: 'باذنجان', melon: 'كنتالوب', green_bean: 'فاصوليا خضراء',
};
const MARKETS = ['EU', 'UK', 'GCC', 'RU', 'US', 'CODEX', 'JP', 'CN'];

export function RegistryScreen() {
  const { farmId, can } = useApp();
  const reg = useRegistry(farmId);
  const products = useCatalogProducts(farmId, true);
  const profile = useLiveQuery(async () => (farmId ? (await db.farm_profiles.where('farm_id').equals(farmId).first()) ?? null : null), [farmId]);
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [eu, setEu] = useState('');
  const [open, setOpen] = useState<Substance | null>(null);
  const markets = (profile?.export_markets ?? []) as string[];
  const productsOf = useMemo(() => {
    const m = new Map<string, string[]>();
    if (reg && products) for (const p of products) for (const s of reg.substancesOf(p)) {
      if (!m.has(s.id)) m.set(s.id, []);
      m.get(s.id)!.push(p.name);
    }
    return m;
  }, [reg, products]);
  if (!reg || !products) return null;
  const t = norm(q);
  const list = reg.substances.filter((s) => (!cls || s.classes.includes(cls)) && (!eu || s.eu_status === eu)
    && (!t || [s.name_en, s.name_ar, s.moa_code, s.chemical_group, ...(productsOf.get(s.id) ?? [])].some((x) => norm(x).includes(t))));
  const reviewed = reg.substances.map((s) => s.reviewed_on).filter(Boolean).sort().pop();

  async function toggleMarket(m: string) {
    if (!farmId) return;
    const next = markets.includes(m) ? markets.filter((x) => x !== m) : [...markets, m];
    if (profile) await update('farm_profiles', profile.id, { export_markets: next });
    else await create('farm_profiles', { id: farmId, farm_id: farmId, export_markets: next });
  }

  return (
    <main className="page">
      <Link to="/products" className="back"><Icon name="back" size={18} /> كتالوج المواد</Link>
      <div className="page-head">
        <div><h1>سجل المبيدات والتصدير</h1><p>{reg.substances.length} مادة فعالة — اعتماد الاتحاد الأوروبي، مجموعة المقاومة، وحدود المتبقيات لكل سوق</p></div>
      </div>

      <section className="panel panel-pad markets">
        <h2 className="form-h"><Icon name="globe" size={20} /> أسواق التصدير لهذا المشروع</h2>
        <div className="chips-pick">
          {MARKETS.map((m) => (
            <button type="button" key={m} aria-pressed={markets.includes(m)} disabled={!can.manage} onClick={() => void toggleMarket(m)}>{MARKET_LABEL[m]}</button>
          ))}
        </div>
        <p className="faint" style={{ margin: 0 }}>{can.manage ? 'التطبيق يراجع كل رشة على حدود المتبقيات واعتماد المواد في الأسواق المختارة.' : 'يحددها مدير الشركة أو الاستشاري.'}</p>
      </section>

      <div className="banner info"><Icon name="info" /> <span>البيانات من مصادر رسمية (قاعدة بيانات المبيدات بالاتحاد الأوروبي، كودكس، EPA) ومعها رابط المصدر وتاريخ المراجعة. فترة الأمان المحلية تُسجّل لكل منتج من ملصق العبوة المسجلة في مصر. راجع دائمًا اشتراطات المستورد قبل الشحن.{reviewed ? ` آخر مراجعة: ${formatDate(reviewed)}.` : ''}</span></div>

      <div className="filters">
        <label className="search-box" style={{ flex: '1 1 220px' }}>
          <Icon name="search" size={20} />
          <input className="input" placeholder="ابحث بالمادة الفعالة أو الاسم التجاري أو المجموعة" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في السجل" />
        </label>
        <select className="select" style={{ width: 'auto' }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label="الاستخدام">
          <option value="">كل الاستخدامات</option>
          {Object.entries(CLASS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={eu} onChange={(e) => setEu(e.target.value)} aria-label="الاتحاد الأوروبي">
          <option value="">كل الحالات</option>
          <option value="approved">معتمدة في الاتحاد الأوروبي</option>
          <option value="not_approved">غير معتمدة في الاتحاد الأوروبي</option>
          <option value="pending">قيد المراجعة</option>
        </select>
      </div>

      {reg.substances.length === 0 ? (
        <div className="panel empty"><h3>السجل لم يُحمّل بعد</h3><p>اتصل بالإنترنت لتحميل بيانات المواد الفعالة.</p></div>
      ) : (
        <div className="panel scroll-x">
          <table className="tbl">
            <thead><tr><th>المادة الفعالة</th><th>الاستخدام</th><th>المجموعة</th><th>الاتحاد الأوروبي</th><th>في الكتالوج</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => setOpen(s)}>
                  <td><b>{s.name_ar ?? s.name_en}</b><small className="faint ltr" style={{ display: 'block' }}>{s.name_en}</small></td>
                  <td>{s.classes.map((c) => CLASS_LABEL[c] ?? c).join('، ') || '—'}</td>
                  <td className="n">{s.moa_code ? `${s.moa_system ?? ''} ${s.moa_code}` : '—'}</td>
                  <td><EuChip s={s} /></td>
                  <td className="n">{productsOf.get(s.id)?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <SubstanceSheet s={open} products={productsOf.get(open.id) ?? []} markets={markets} onClose={() => setOpen(null)} />}
    </main>
  );
}

function EuChip({ s }: { s: Substance }) {
  if (s.eu_status === 'approved') return <span className="chip ok sm">معتمدة{s.eu_expiry ? ` حتى ${formatDate(s.eu_expiry)}` : ''}</span>;
  if (s.eu_status === 'not_approved') return <span className="chip bad sm">غير معتمدة</span>;
  if (s.eu_status === 'pending') return <span className="chip warn sm">قيد المراجعة</span>;
  return <span className="chip sm">غير محدد</span>;
}

function SubstanceSheet({ s, products, markets, onClose }: { s: Substance; products: string[]; markets: string[]; onClose: () => void }) {
  const { farmId } = useApp();
  const reg = useRegistry(farmId);
  const limits = reg?.limits(s.id) ?? [];
  const crops = [...new Set(limits.map((l) => l.crop_code))].sort((a, b) => Object.keys(CROP_LABEL).indexOf(a) - Object.keys(CROP_LABEL).indexOf(b));
  const mks = MARKETS.filter((m) => limits.some((l) => l.market === m)).sort((a, b) => (markets.includes(b) ? 1 : 0) - (markets.includes(a) ? 1 : 0));
  const sources = [...new Set([s.source_url, ...limits.map((l) => l.source_url)].filter(Boolean) as string[])];
  return (
    <Sheet title={s.name_ar ? `${s.name_ar} — ${s.name_en}` : s.name_en} onClose={onClose}>
      <div className="form">
        <div className="detail-grid panel panel-pad">
          <div className="detail"><span className="k">الاتحاد الأوروبي</span><span className="v"><EuChip s={s} />{s.eu_cfs && <span className="chip warn sm">مرشحة للاستبدال</span>}</span></div>
          <div className="detail"><span className="k">مجموعة المقاومة</span><span className="v">{s.moa_code ? `${s.moa_system ?? ''} ${s.moa_code}` : '—'}{s.chemical_group ? ` — ${s.chemical_group}` : ''}</span></div>
          {s.cas_no && <div className="detail"><span className="k">CAS</span><span className="v num">{s.cas_no}</span></div>}
          {s.notes && <div className="detail"><span className="k">ملاحظات</span><span className="v">{s.notes}</span></div>}
          {products.length > 0 && <div className="detail"><span className="k">منتجات في الكتالوج</span><span className="v">{products.join('، ')}</span></div>}
        </div>
        <h3 className="form-h">الحد الأقصى للمتبقيات (مجم/كجم)</h3>
        {limits.length === 0 ? <p className="muted">لا توجد أرقام موثقة لهذه المادة في السجل بعد.</p> : (
          <div className="scroll-x">
            <table className="tbl mrl-tbl">
              <thead><tr><th>المحصول</th>{mks.map((m) => <th key={m} className={markets.includes(m) ? 'hl' : ''}>{MARKET_LABEL[m]}</th>)}</tr></thead>
              <tbody>
                {crops.map((c) => (
                  <tr key={c}><td>{CROP_LABEL[c] ?? c}</td>
                    {mks.map((m) => {
                      const l = limits.find((x) => x.market === m && x.crop_code === c);
                      return <td key={m} className={`n ${markets.includes(m) ? 'hl' : ''} ${l?.default_loq ? 'loq' : ''}`} title={l?.default_loq ? 'حد الكشف الافتراضي — المادة غير مسموحة عمليًا' : undefined}>
                        {l?.mrl_mg_kg != null ? Number(l.mrl_mg_kg) : '—'}{l?.default_loq ? '*' : ''}{l?.phi_days != null ? <small className="faint" style={{ display: 'block' }}>أمان {l.phi_days} يوم</small> : null}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="faint" style={{ fontSize: 'var(--fs-xs)' }}>* حد الكشف الافتراضي (0.01): المادة غير معتمدة لهذا الاستخدام في السوق، وأي أثر قابل للقياس يعرّض الشحنة للرفض.</p>
          </div>
        )}
        {sources.length > 0 && (
          <div><h3 className="form-h">المصادر</h3><ul className="sources">{sources.slice(0, 8).map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="ltr">{u.replace(/^https?:\/\//, '').slice(0, 70)}</a></li>)}</ul></div>
        )}
        <p className="faint">{EU_STATUS_LABEL[s.eu_status]}{s.reviewed_on ? ` — روجعت ${formatDate(s.reviewed_on)}` : ''}</p>
      </div>
    </Sheet>
  );
}
