import { describe, expect, it } from 'vitest';
import { addDays, consecutiveMoa, lastWeeks, moaHistory, phiByGreenhouse, pressureGrid, severityByRow } from './ipm';

describe('addDays / lastWeeks', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('lists ISO weeks oldest first, starting Monday', () => {
    const w = lastWeeks('2026-10-04', 3); // الأحد 4 أكتوبر = الأسبوع 40
    expect(w.map((x) => x.week)).toEqual([38, 39, 40]);
    expect(w[2].start).toBe('2026-09-28');
    expect(lastWeeks('2027-01-01', 2).map((x) => x.key)).toEqual([202652, 202653]);
  });
});

const prods = [
  { id: 'p1', name: 'أبامكتين', phi_days: 3, moa_code: '6' },
  { id: 'p2', name: 'سبينوساد', phi_days: 1, moa_code: '5' },
  { id: 'p3', name: 'سماد', phi_days: null, moa_code: null },
];

describe('phiByGreenhouse', () => {
  it('keeps the longest PHI and drops expired ones', () => {
    const acts = [
      { id: 'a1', performed_on: '2026-10-02', activity_type: 'chemical_spray' },
      { id: 'a2', performed_on: '2026-09-20', activity_type: 'chemical_spray' },
      { id: 'a3', performed_on: '2026-10-03', activity_type: 'chemical_spray', deleted_at: '2026-10-03T10:00:00Z' },
    ];
    const ags = [
      { activity_id: 'a1', greenhouse_id: 'g1' },
      { activity_id: 'a1', greenhouse_id: 'g2' },
      { activity_id: 'a2', greenhouse_id: 'g3' },
      { activity_id: 'a3', greenhouse_id: 'g3' },
    ];
    const aps = [
      { activity_id: 'a1', product_id: 'p1' },
      { activity_id: 'a1', product_id: 'p2' },
      { activity_id: 'a2', product_id: 'p1' },
      { activity_id: 'a3', product_id: 'p1' },
    ];
    const m = phiByGreenhouse(acts, ags, aps, prods, '2026-10-04');
    expect(m.get('g1')).toEqual({ until: '2026-10-05', product: 'أبامكتين', performedOn: '2026-10-02' });
    expect(m.has('g2')).toBe(true);
    expect(m.has('g3')).toBe(false); // انتهت + المحذوفة لا تُحسب
    // يوم السماح نفسه مسموح فيه
    expect(phiByGreenhouse(acts, ags, aps, prods, '2026-10-05').has('g1')).toBe(false);
  });
});

describe('MOA rotation', () => {
  const acts = [
    { id: 'a1', performed_on: '2026-09-10', activity_type: 'chemical_spray' },
    { id: 'a2', performed_on: '2026-09-17', activity_type: 'chemical_spray' },
    { id: 'a3', performed_on: '2026-09-24', activity_type: 'chemical_spray' },
    { id: 'a4', performed_on: '2026-09-30', activity_type: 'bio_release' },
  ];
  const ags = acts.map((a) => ({ activity_id: a.id, greenhouse_id: 'g1' }));
  const aps = [
    { activity_id: 'a1', product_id: 'p2' },
    { activity_id: 'a2', product_id: 'p1' },
    { activity_id: 'a3', product_id: 'p1' },
    { activity_id: 'a3', product_id: 'p3' },
  ];
  it('counts consecutive uses of the same group', () => {
    const h = moaHistory('g1', acts, ags, aps, prods);
    expect(h.map((x) => x.moa)).toEqual(['6', '6', '5']);
    expect(consecutiveMoa(h, '6', '2026-10-01')).toBe(2);
    expect(consecutiveMoa(h, '5', '2026-10-01')).toBe(0);
    expect(consecutiveMoa(h, '6', '2026-09-18')).toBe(1);
  });
  it('excludes the activity being edited', () => {
    const h = moaHistory('g1', acts, ags, aps, prods, 'a3');
    expect(consecutiveMoa(h, '6', '2026-10-01')).toBe(1);
  });
});

describe('pressureGrid', () => {
  const sessions = [
    { id: 's1', greenhouse_id: 'g1', scouted_on: '2026-09-29', iso_year: 2026, iso_week: 40 },
    { id: 's2', greenhouse_id: 'g1', scouted_on: '2026-10-02', iso_year: 2026, iso_week: 40 },
    { id: 's3', greenhouse_id: 'g2', scouted_on: '2026-10-01', iso_year: 2026, iso_week: 40 },
  ];
  const obs = [
    { session_id: 's1', pest_id: 'wf', severity: 1, is_hotspot: false, row_no: 3 },
    { session_id: 's2', pest_id: 'wf', severity: 3, is_hotspot: true, row_no: 3 },
    { session_id: 's2', pest_id: 'tuta', severity: 2, is_hotspot: false, row_no: 7 },
    { session_id: 's2', pest_id: 'tuta', severity: 4, is_hotspot: false, row_no: 8, deleted_at: 'x' },
  ];
  it('takes max severity per greenhouse-week and marks clean scouting', () => {
    const g = pressureGrid(sessions, obs);
    const c = g.get('g1|202640')!;
    expect(c.max).toBe(3);
    expect(c.hotspots).toBe(1);
    expect(c.pests.get('tuta')).toBe(2);
    expect(g.get('g2|202640')).toMatchObject({ max: 0, observations: 0, scouted: true });
  });
  it('filters by pest', () => {
    expect(pressureGrid(sessions, obs, 'tuta').get('g1|202640')!.max).toBe(2);
  });
  it('maps severity by row', () => {
    const r = severityByRow(obs);
    expect(r.get(3)).toEqual({ max: 3, hotspot: true });
    expect(r.has(8)).toBe(false);
  });
});
