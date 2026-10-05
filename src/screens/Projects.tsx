// المشاريع: كل موقع/مزرعة مشروع مستقل بفريقه وبياناته.
// لوحة واحدة تعرض حالة كل المشاريع هذا الأسبوع وتنقل بينها.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp, ROLE_LABEL } from '../app/context';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { formatDate, isoWeek, todayLocal, weekBounds } from '../lib/dates';
import { SEVERITY } from '../lib/labels';
import { Icon } from '../components/Icon';
import { NewFarmSheet } from './Farm';
import type { Row } from '../lib/schema';

interface Card {
  f: Row<'farms'>;
  role: Row<'farm_members'>['role'];
  location: string | null;
  ghs: number;
  crops: string[];
  scouted: number;
  worst: number;
  registered: number;
  withCycle: number;
  openRecs: number;
  lastActivity: string | null;
}

export function useProjects(userId: string | undefined) {
  return useLiveQuery(async () => {
    if (!userId) return [];
    const mem = await db.farm_members.where('user_id').equals(userId).toArray();
    const today = todayLocal();
    const { start, end } = weekBounds(today);
    const [crops, profiles] = await Promise.all([db.crops.toArray(), db.farm_profiles.toArray()]);
    const cropName = new Map(crops.map((c) => [c.id, c.name_ar]));
    const out: Card[] = [];
    for (const m of mem) {
      const f = await db.farms.get(m.farm_id);
      if (!alive(f)) continue;
      const [ghs, cycles, sessions, recs, acts, regs] = await Promise.all([
        db.greenhouses.where('farm_id').equals(f.id).toArray(),
        db.crop_cycles.where('farm_id').equals(f.id).toArray(),
        db.scouting_sessions.where('farm_id').equals(f.id).toArray(),
        db.recommendations.where('farm_id').equals(f.id).toArray(),
        db.activities.where('farm_id').equals(f.id).toArray(),
        db.crop_registration_sessions.where('farm_id').equals(f.id).toArray(),
      ]);
      const liveGh = ghs.filter(alive);
      const active = cycles.filter((c) => alive(c) && c.status !== 'finished');
      const weekSessions = sessions.filter((s) => alive(s) && s.scouted_on >= start && s.scouted_on <= end);
      const obs = weekSessions.length
        ? (await db.scouting_observations.where('session_id').anyOf(weekSessions.map((s) => s.id)).toArray()).filter(alive)
        : [];
      const lastAct = acts.filter(alive).map((a) => a.performed_on).sort().pop() ?? null;
      const prof = profiles.find((p) => p.farm_id === f.id && alive(p));
      out.push({
        f, role: m.role,
        location: f.location_text ?? prof?.address ?? null,
        ghs: liveGh.length,
        crops: [...new Set(active.map((c) => cropName.get(c.crop_id)).filter((x): x is string => !!x))],
        scouted: new Set(weekSessions.map((s) => s.greenhouse_id)).size,
        worst: Math.max(0, ...obs.map((o) => o.severity)),
        registered: new Set(regs.filter((r) => alive(r) && r.measured_on >= start && r.measured_on <= end).map((r) => r.crop_cycle_id)).size,
        withCycle: active.length,
        openRecs: recs.filter((r) => alive(r) && (r.status === 'open' || r.status === 'in_progress')).length,
        lastActivity: lastAct,
      });
    }
    return out.sort((a, b) => a.f.name.localeCompare(b.f.name, 'ar'));
  }, [userId]);
}

export function ProjectsBoard({ canCreate }: { canCreate?: boolean }) {
  const { user, farmId, setFarmId, can } = useApp();
  const nav = useNavigate();
  const cards = useProjects(user?.id);
  const [newFarm, setNewFarm] = useState(false);
  const { week } = isoWeek(todayLocal());
  if (!cards) return null;
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>المشاريع</h1>
          <p>{cards.length} مشروع، حالة الأسبوع {week}. كل مشروع مستقل بفريقه وصوبه وبياناته.</p>
        </div>
        {(canCreate ?? can.admin) && <button className="btn primary" onClick={() => setNewFarm(true)}><Icon name="plus" /> مشروع جديد</button>}
      </div>
      <div className="proj-grid">
        {cards.map((c) => (
          <button key={c.f.id} type="button" className="proj-card" aria-current={c.f.id === farmId || undefined}
            onClick={() => { setFarmId(c.f.id); nav('/'); }}>
            <span className="proj-top">
              <b>{c.f.name}</b>
              <span className="chip">{ROLE_LABEL[c.role]}</span>
            </span>
            {c.location && <span className="muted proj-loc"><Icon name="pin" size={14} /> {c.location}</span>}
            <span className="proj-crops">{c.ghs} صوبة{c.crops.length ? `، ${c.crops.join('، ')}` : ''}</span>
            <span className="proj-stats">
              {c.ghs === 0 ? <span className="chip">لم تُضف صوب بعد</span>
                : <span className={`chip ${c.scouted >= c.ghs ? 'ok' : c.scouted ? 'warn' : 'bad'}`}>فحص {c.scouted}/{c.ghs}</span>}
              {c.withCycle > 0 && <span className={`chip ${c.registered >= c.withCycle ? 'ok' : 'warn'}`}>تسجيل {c.registered}/{c.withCycle}</span>}
              {c.worst > 0 && <span className="sev" data-v={c.worst}>{SEVERITY[c.worst].short}</span>}
              {c.openRecs > 0 && <span className="chip info">{c.openRecs} توصية مفتوحة</span>}
            </span>
            <span className="faint proj-last">{c.lastActivity ? `آخر معاملة ${formatDate(c.lastActivity)}` : 'لا توجد معاملات بعد'}</span>
          </button>
        ))}
      </div>
      {newFarm && <NewFarmSheet onClose={() => setNewFarm(false)} />}
    </main>
  );
}
