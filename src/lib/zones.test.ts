import { describe, expect, it } from 'vitest';
import {
  descendants, flatTree, ghLabels, ghsUnder, groupByZone, indexZones, nameSequence, pathText, validParents, zoneTitle,
} from './zones';

const z = (id: string, parent: string | null, kind: string, name: string, extra: Record<string, unknown> = {}) =>
  ({ id, parent_id: parent, kind, name, sort_order: 100, deleted_at: null, farm_id: 'f', ...extra }) as any;

const zones = [
  z('s1', null, 'sector', 'القطاع الأول'),
  z('s2', null, 'sector', '2'),
  z('rA', 's1', 'row', 'A'),
  z('rB', 's1', 'row', 'B'),
  z('rX', 's2', 'row', 'A'),
  z('gone', null, 'sector', 'محذوف', { deleted_at: '2026-01-01' }),
  z('orph', 'gone', 'row', 'Z'),
];
const idx = indexZones(zones);
const gh = (id: string, code: string, zone_id: string | null) => ({ id, code, zone_id });

describe('zones', () => {
  it('titles keep names that already carry the kind', () => {
    expect(zoneTitle(zones[0])).toBe('القطاع الأول');
    expect(zoneTitle(zones[1])).toBe('قطاع 2');
    expect(zoneTitle(zones[2])).toBe('صف A');
  });

  it('builds paths and puts children of deleted parents at the root', () => {
    expect(pathText(idx, 'rB')).toBe('القطاع الأول › صف B');
    expect(idx.children.get('')!.map((x) => x.id)).toEqual(['s1', 'orph', 's2']);
    expect(idx.byId.has('gone')).toBe(false);
  });

  it('collects descendants and greenhouses under a zone', () => {
    expect([...descendants(idx, 's1')].sort()).toEqual(['rA', 'rB', 's1']);
    const ghs = [gh('1', '1', 'rA'), gh('2', '2', 'rB'), gh('3', '1', 'rX'), gh('4', 'GH-9', null)];
    expect(ghsUnder(idx, 's1', ghs).map((g) => g.id)).toEqual(['1', '2']);
    expect(ghsUnder(idx, '', ghs)).toHaveLength(4);
  });

  it('labels duplicate codes with their place only when needed', () => {
    const ghs = [gh('1', '1', 'rA'), gh('3', '1', 'rX'), gh('4', 'GH-9', null)];
    const l = ghLabels(idx, ghs);
    expect(l.get('1')).toBe('القطاع الأول / صف A / 1');
    expect(l.get('3')).toBe('قطاع 2 / صف A / 1');
    expect(l.get('4')).toBe('GH-9');
  });

  it('groups greenhouses in tree order', () => {
    const groups = groupByZone(idx, [gh('a', '2', 'rX'), gh('b', '10', 'rA'), gh('c', '9', 'rA'), gh('d', 'X', null)]);
    expect(groups.map((g) => g.zoneId)).toEqual(['', 'rA', 'rX']);
    expect(groups[1].items.map((g) => g.code)).toEqual(['9', '10']);
  });

  it('never offers a zone or its children as its own parent', () => {
    expect(validParents(idx, 's1').map((x) => x.id).sort()).toEqual(['orph', 'rX', 's2']);
    expect(flatTree(idx).map((x) => [x.z.id, x.depth])).toEqual([
      ['s1', 0], ['rA', 1], ['rB', 1], ['orph', 0], ['s2', 0], ['rX', 1],
    ]);
  });

  it('generates name sequences', () => {
    expect(nameSequence('1', '3', 'GH-')).toEqual(['GH-1', 'GH-2', 'GH-3']);
    expect(nameSequence('1', '12')).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
    expect(nameSequence('1', '12', '', false)?.[0]).toBe('1');
    expect(nameSequence('a', 'd')).toEqual(['A', 'B', 'C', 'D']);
    expect(nameSequence('5', '2')).toBeNull();
    expect(nameSequence('1', '500')).toBeNull();
    expect(nameSequence('x1', '3')).toBeNull();
  });
});
