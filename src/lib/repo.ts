// كل الكتابة المحلية تمر من هنا: تملأ القيم الافتراضية، وتعلّم السجل للرفع،
// وتحسب الأعمدة المشتقة محليًا (الأسبوع، نسبة العقد...) بنفس منطق السيرفر.

import { db } from './db';
import { deviceId, uuid } from './ids';
import { isoWeek } from './dates';
import { WRITABLE, type Row, type TableName } from './schema';

let currentUserId: string | null = null;
export function setCurrentUser(id: string | null) {
  currentUserId = id;
}
export function getCurrentUser() {
  return currentUserId;
}

type Listener = () => void;
const listeners = new Set<Listener>();
/** يُستدعى بعد أي كتابة محلية — محرك المزامنة يشترك هنا ليرفع تلقائيًا */
export function onLocalWrite(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn());
}

const DATE_COL: Partial<Record<TableName, string>> = {
  crop_registration_sessions: 'measured_on',
  plant_measurements: 'measured_on',
  scouting_sessions: 'scouted_on',
  activities: 'performed_on',
};

/** نفس الأعمدة المحسوبة في قاعدة البيانات، محسوبة على الجهاز للعرض والفهرسة */
export function derive(table: TableName, row: Record<string, any>): Record<string, any> {
  const dateCol = DATE_COL[table];
  if (dateCol && row[dateCol]) {
    const { year, week } = isoWeek(row[dateCol]);
    row.iso_year = year;
    row.iso_week = week;
  }
  if (table === 'plant_measurements') {
    row.leaves_removed =
      row.leaf_count_total != null && row.leaf_count_remaining != null
        ? row.leaf_count_total - row.leaf_count_remaining
        : null;
    row.fruit_set_pct =
      row.set_truss_flowers > 0 && row.set_truss_fruits != null
        ? Math.round((1000 * row.set_truss_fruits) / row.set_truss_flowers) / 10
        : null;
  }
  return row;
}

export async function create<T extends TableName>(table: T, values: Partial<Row<T>>): Promise<Row<T>> {
  const spec = WRITABLE[table];
  if (!spec) throw new Error(`${table} is read-only`);
  const now = new Date().toISOString();
  const row: Record<string, any> = { ...spec.columns };
  Object.assign(row, values);
  row.id = (values as any).id ?? uuid();
  row.created_at = now;
  row.updated_at = now;
  row.created_by = currentUserId;
  row.updated_by = currentUserId;
  row.server_updated_at = null;
  if ('device_id' in spec.columns) row.device_id = deviceId();
  if ('scout_id' in spec.columns && !row.scout_id) row.scout_id = currentUserId;
  if ('author_id' in spec.columns && !row.author_id) row.author_id = currentUserId;
  derive(table, row);
  row._dirty = 1;
  row._rev = 1;
  row._error = null;
  await db.tableOf(table).put(row);
  emit();
  return row as Row<T>;
}

export async function update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<void> {
  await db.transaction('rw', db.tableOf(table), async () => {
    const t = db.tableOf(table);
    const cur = await t.get(id);
    if (!cur) throw new Error(`${table}/${id} not found`);
    const next = { ...cur, ...patch, updated_at: new Date().toISOString(), updated_by: currentUserId };
    derive(table, next);
    next._dirty = 1;
    next._rev = (cur._rev ?? 0) + 1;
    next._error = null;
    await t.put(next);
  });
  emit();
}

export async function softDelete(table: TableName, id: string): Promise<void> {
  await update(table, id, { deleted_at: new Date().toISOString() } as any);
}

/** إنشاء عدة سجلات في عملية واحدة (مثل توليد النباتات المرجعية) */
export async function createMany<T extends TableName>(table: T, list: Partial<Row<T>>[]): Promise<Row<T>[]> {
  const spec = WRITABLE[table];
  if (!spec) throw new Error(`${table} is read-only`);
  const now = new Date().toISOString();
  const rows = list.map((values) => {
    const row: Record<string, any> = { ...spec.columns, ...values };
    row.id = (values as any).id ?? uuid();
    row.created_at = now;
    row.updated_at = now;
    row.created_by = currentUserId;
    row.updated_by = currentUserId;
    row.server_updated_at = null;
    derive(table, row);
    row._dirty = 1;
    row._rev = 1;
    row._error = null;
    return row;
  });
  await db.tableOf(table).bulkPut(rows);
  emit();
  return rows as Row<T>[];
}

export const alive = <T extends { deleted_at?: string | null }>(r: T | undefined | null): r is T =>
  !!r && !r.deleted_at;
