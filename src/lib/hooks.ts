// استعلامات مشتركة على القاعدة المحلية
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { alive } from './repo';
import type { Row } from './schema';

const byCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code, 'en', { numeric: true });

export interface GhWithCycle {
  g: Row<'greenhouses'>;
  cycle: Row<'crop_cycles'> | undefined;
  crop: string | undefined;
}

/** الصوب + الدورة القائمة في كل صوبة */
export function useGreenhouses(farmId: string | null): GhWithCycle[] | undefined {
  return useLiveQuery(async () => {
    if (!farmId) return [];
    const [ghs, cycles, crops] = await Promise.all([
      db.greenhouses.where('farm_id').equals(farmId).toArray(),
      db.crop_cycles.where('farm_id').equals(farmId).toArray(),
      db.crops.toArray(),
    ]);
    const cropName = new Map(crops.map((c) => [c.id, c.name_ar]));
    return ghs.filter(alive).sort(byCode).map((g) => {
      const cycle = activeCycle(cycles, g.id);
      return { g, cycle, crop: cycle ? cropName.get(cycle.crop_id) : undefined };
    });
  }, [farmId]);
}

export function activeCycle(cycles: Row<'crop_cycles'>[], ghId: string): Row<'crop_cycles'> | undefined {
  return cycles
    .filter((c) => alive(c) && c.greenhouse_id === ghId && c.status !== 'finished')
    .sort((a, b) => (a.planting_date < b.planting_date ? 1 : -1))[0];
}

/** كتالوج الآفات: العام + الخاص بالمزرعة */
export function usePests(farmId: string | null) {
  return useLiveQuery(async () => {
    const all = await db.pests.toArray();
    return all
      .filter((p) => alive(p) && p.is_active && (p.farm_id == null || p.farm_id === farmId))
      .sort((a, b) => a.sort_order - b.sort_order || a.name_ar.localeCompare(b.name_ar, 'ar'));
  }, [farmId]);
}

/**
 * المادة الخاصة بالمزرعة "تغطي" مادة الكتالوج العام بنفس الاسم
 * (مثلًا لإضافة فترة الأمان المكتوبة على العبوة المسجلة محليًا).
 */
export function shadowProducts<T extends { id: string; name: string; farm_id: string | null; deleted_at?: string | null }>(all: T[], farmId: string | null): T[] {
  const mine = new Set(all.filter((p) => alive(p) && p.farm_id === farmId && farmId).map((p) => p.name.trim()));
  return all.filter((p) => alive(p) && (p.farm_id === farmId || (p.farm_id == null && !mine.has(p.name.trim()))));
}

export function useProducts(farmId: string | null, includeInactive = false) {
  return useLiveQuery(async () => {
    const all = await db.products.toArray();
    return shadowProducts(all, farmId)
      .filter((p) => includeInactive || p.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [farmId, includeInactive]);
}

/** أسماء أعضاء الفريق */
export function usePeople(): Map<string, string> {
  return (
    useLiveQuery(async () => {
      const ps = await db.profiles.toArray();
      return new Map(ps.map((p) => [p.id, p.full_name || p.email || 'عضو']));
    }, []) ?? new Map()
  );
}
