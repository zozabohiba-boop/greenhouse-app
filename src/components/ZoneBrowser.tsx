// تصفح الموقع بالتسلسل: الموقع ← قطاع ← صف ← الصوب
// المكان الحالي محفوظ في الرابط (?z=) فزر الرجوع في المتصفح يرجع مستوى.
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from './Icon';
import { useApp } from '../app/context';
import {
  ghZone, ghsUnder, groupByZone, KIND_LABEL, useZones, zonePath, zoneTitle, type Zone, type ZoneIndex,
} from '../lib/zones';

const PLURAL: Record<string, string> = { sector: 'قطاعات', plot: 'قطع', block: 'بلوكات', row: 'صفوف', other: 'أماكن' };

type Item = { id: string; code: string; zone_id: string | null };

export function useZoneParam(idx: ZoneIndex | undefined): [string, (id: string) => void] {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('z') ?? '';
  const current = raw && idx?.byId.has(raw) ? raw : '';
  const go = (id: string) => {
    const next = new URLSearchParams(sp);
    if (id) next.set('z', id); else next.delete('z');
    setSp(next);
  };
  return [current, go];
}

export function Crumbs({ idx, current, go, rootLabel = 'كل الموقع' }: { idx: ZoneIndex; current: string; go: (id: string) => void; rootLabel?: string }) {
  const path = zonePath(idx, current);
  return (
    <nav className="crumbs" aria-label="المكان الحالي">
      <button type="button" onClick={() => go('')} aria-current={!current ? 'page' : undefined}>
        <Icon name="map" size={16} /> {rootLabel}
      </button>
      {path.map((z) => (
        <span key={z.id} className="crumb">
          <span className="sep" aria-hidden="true">‹</span>
          <button type="button" onClick={() => go(z.id)} aria-current={z.id === current ? 'page' : undefined}>{zoneTitle(z)}</button>
        </span>
      ))}
    </nav>
  );
}

export function ZoneBrowser<T extends Item>({
  idx, items, render, summary, toolbar, empty, rootLabel,
}: {
  idx: ZoneIndex;
  items: T[];
  render: (g: T) => ReactNode;
  /** ملخص يظهر على كارت المكان (مثل: فُحصت 3 من 8) */
  summary?: (items: T[]) => ReactNode;
  /** أزرار تظهر بجانب المسار (إضافة/تعديل) */
  toolbar?: (zone: Zone | null) => ReactNode;
  empty?: ReactNode;
  rootLabel?: string;
}) {
  const [current, go] = useZoneParam(idx);
  const [q, setQ] = useState('');
  const hasZones = idx.list.length > 0;
  const zones = idx.children.get(current) ?? [];
  const here = useMemo(() => items.filter((g) => ghZone(idx, g) === current), [items, idx, current]);
  const query = q.trim().toLowerCase();
  const found = useMemo(
    () => (query ? groupByZone(idx, ghsUnder(idx, current, items).filter((g) => g.code.toLowerCase().includes(query))) : []),
    [query, idx, current, items],
  );
  const zoneObj = current ? idx.byId.get(current) ?? null : null;

  return (
    <div className="zone-browser">
      {(hasZones || toolbar) && (
        <div className="zone-bar">
          {hasZones ? <Crumbs idx={idx} current={current} go={go} rootLabel={rootLabel} /> : <span />}
          {toolbar?.(zoneObj)}
        </div>
      )}
      {items.length > 12 && (
        <label className="search-box">
          <Icon name="search" size={20} />
          <input className="input" inputMode="search" placeholder="ابحث بكود الصوبة" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ابحث بكود الصوبة" />
        </label>
      )}

      {query ? (
        found.length ? (
          found.map((grp) => (
            <section key={grp.zoneId} className="zone-group">
              {hasZones && <h3 className="zone-group-h">{grp.title}</h3>}
              <div className="gh-list">{grp.items.map((g) => <div key={g.id} className="contents">{render(g)}</div>)}</div>
            </section>
          ))
        ) : (
          <div className="panel empty"><h3>لا توجد صوبة بهذا الكود هنا</h3></div>
        )
      ) : (
        <>
          {zones.length > 0 && (
            <div className="zone-grid">
              {zones.map((z) => {
                const under = ghsUnder(idx, z.id, items);
                const kids = idx.children.get(z.id) ?? [];
                const kinds = new Map<string, number>();
                for (const k of kids) kinds.set(k.kind, (kinds.get(k.kind) ?? 0) + 1);
                return (
                  <button type="button" key={z.id} className="zone-card" onClick={() => go(z.id)}>
                    <span className="zone-kind">{KIND_LABEL[z.kind]}</span>
                    <b>{zoneTitle(z)}</b>
                    <span className="zone-meta">
                      {[...kinds].map(([k, n]) => `${n} ${PLURAL[k] ?? 'أماكن'}`).concat(`${under.length} صوبة`).join('، ')}
                    </span>
                    {summary && under.length > 0 && <span className="zone-sum">{summary(under)}</span>}
                    <Icon name="chevron" size={20} />
                  </button>
                );
              })}
            </div>
          )}
          {here.length > 0 && (
            <>
              {zones.length > 0 && <h3 className="zone-group-h">صوب مباشرة في {zoneObj ? zoneTitle(zoneObj) : 'الموقع'}</h3>}
              <div className="gh-list">{here.map((g) => <div key={g.id} className="contents">{render(g)}</div>)}</div>
            </>
          )}
          {zones.length === 0 && here.length === 0 && (empty ?? <div className="panel empty"><h3>لا توجد صوب هنا</h3></div>)}
        </>
      )}
    </div>
  );
}

/** مسار الصوبة كسطر صغير (القطاع › الصف) */
export function GhPlace({ idx, zoneId }: { idx: ZoneIndex | undefined; zoneId: string | null | undefined }) {
  if (!idx || !zoneId) return null;
  const p = zonePath(idx, zoneId);
  if (!p.length) return null;
  return <span className="gh-place"><Icon name="map" size={14} /> {p.map(zoneTitle).join(' › ')}</span>;
}

/** نفس GhPlace لكن يقرأ الهيكل بنفسه — للشاشات التي لا تحمّل الهيكل */
export function PlaceLine({ zoneId }: { zoneId: string | null | undefined }) {
  const { farmId } = useApp();
  const idx = useZones(farmId);
  return <GhPlace idx={idx} zoneId={zoneId} />;
}

/** خيارات قائمة الصوب مقسمة حسب المكان (optgroup) */
export function GhOptions({ idx, ghs }: { idx: ZoneIndex | undefined; ghs: Item[] }) {
  if (!idx) return <>{ghs.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}</>;
  const groups = groupByZone(idx, ghs);
  if (groups.length === 1 && !groups[0].zoneId) return <>{groups[0].items.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}</>;
  return (
    <>
      {groups.map((grp) => (
        <optgroup key={grp.zoneId || 'root'} label={grp.title}>
          {grp.items.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}
        </optgroup>
      ))}
    </>
  );
}

/** اختيار عدة صوب مع زر "كل صوب المكان" لكل قطاع/صف */
export function GhMultiPick({ idx, ghs, value, onChange }: { idx: ZoneIndex | undefined; ghs: Item[]; value: Set<string>; onChange: (v: Set<string>) => void }) {
  const toggle = (id: string) => { const n = new Set(value); if (n.has(id)) n.delete(id); else n.add(id); onChange(n); };
  const setMany = (ids: string[], on: boolean) => { const n = new Set(value); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); onChange(n); };
  const groups = idx ? groupByZone(idx, ghs) : [{ zoneId: '', title: '', items: ghs }];
  const flat = groups.length === 1 && !groups[0].zoneId;
  const allOn = ghs.length > 0 && ghs.every((g) => value.has(g.id));
  const buttons = (items: Item[]) => items.map((g) => (
    <button type="button" key={g.id} aria-pressed={value.has(g.id)} className="num" onClick={() => toggle(g.id)}>{g.code}</button>
  ));
  if (flat) {
    return (
      <div className="gh-pick">
        {buttons(groups[0].items)}
        {ghs.length > 1 && <button type="button" className="all" onClick={() => setMany(ghs.map((g) => g.id), !allOn)}>{allOn ? 'إلغاء الكل' : 'كل الصوب'}</button>}
      </div>
    );
  }
  return (
    <div className="gh-groups">
      <div className="gh-group-h">
        <span>{value.size ? `تم اختيار ${value.size} صوبة` : 'اختر الصوب'}</span>
        <button type="button" onClick={() => setMany(ghs.map((g) => g.id), !allOn)}>{allOn ? 'إلغاء الكل' : 'كل صوب الموقع'}</button>
      </div>
      {groups.map((grp) => {
        const ids = grp.items.map((g) => g.id);
        const on = ids.every((id) => value.has(id));
        return (
          <div key={grp.zoneId || 'root'} className="gh-group">
            <div className="gh-group-h">
              <span>{grp.title}</span>
              {ids.length > 1 && <button type="button" onClick={() => setMany(ids, !on)}>{on ? 'إلغاء' : `الكل (${ids.length})`}</button>}
            </div>
            <div className="gh-pick">{buttons(grp.items)}</div>
          </div>
        );
      })}
    </div>
  );
}
