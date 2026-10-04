// قاعدة البيانات المحلية على التابلت (IndexedDB عبر Dexie)
// كل جدول هنا نسخة من جدول السيرفر + حقول محلية:
//   _dirty : 1 = فيه تعديل محلي لم يُرفع بعد
//   _rev   : عدّاد تعديلات محلي — يمنع ضياع تعديل حصل أثناء الرفع
//   _error : سبب رفض السيرفر للسجل (إن وُجد)

import Dexie, { type Table } from 'dexie';
import type { Row, TableName } from './schema';

export type Local<T> = T & { _dirty?: 0 | 1; _rev?: number; _error?: string | null };

export interface MetaRow {
  key: string;
  value: unknown;
}

export class GreenhouseDB extends Dexie {
  organizations!: Table<Local<Row<'organizations'>>, string>;
  farms!: Table<Local<Row<'farms'>>, string>;
  farm_members!: Table<Row<'farm_members'>, [string, string]>;
  profiles!: Table<Row<'profiles'>, string>;
  crops!: Table<Row<'crops'>, string>;
  varieties!: Table<Local<Row<'varieties'>>, string>;
  pests!: Table<Local<Row<'pests'>>, string>;
  products!: Table<Local<Row<'products'>>, string>;
  operation_types!: Table<Local<Row<'operation_types'>>, string>;
  greenhouses!: Table<Local<Row<'greenhouses'>>, string>;
  crop_cycles!: Table<Local<Row<'crop_cycles'>>, string>;
  reference_plants!: Table<Local<Row<'reference_plants'>>, string>;
  balance_targets!: Table<Local<Row<'balance_targets'>>, string>;
  crop_registration_sessions!: Table<Local<Row<'crop_registration_sessions'>>, string>;
  plant_measurements!: Table<Local<Row<'plant_measurements'>>, string>;
  scouting_sessions!: Table<Local<Row<'scouting_sessions'>>, string>;
  scouting_observations!: Table<Local<Row<'scouting_observations'>>, string>;
  recommendations!: Table<Local<Row<'recommendations'>>, string>;
  activities!: Table<Local<Row<'activities'>>, string>;
  activity_greenhouses!: Table<Local<Row<'activity_greenhouses'>>, string>;
  activity_products!: Table<Local<Row<'activity_products'>>, string>;
  attachments!: Table<Local<Row<'attachments'>>, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'greenhouse-app') {
    super(name);
    this.version(1).stores({
      organizations: 'id, _dirty',
      farms: 'id, organization_id, _dirty',
      farm_members: '[farm_id+user_id], farm_id, user_id',
      profiles: 'id',
      crops: 'id, code',
      varieties: 'id, farm_id, crop_id, _dirty',
      pests: 'id, farm_id, _dirty',
      products: 'id, farm_id, _dirty',
      operation_types: 'id, farm_id, _dirty',
      greenhouses: 'id, farm_id, _dirty',
      crop_cycles: 'id, farm_id, greenhouse_id, _dirty',
      reference_plants: 'id, farm_id, crop_cycle_id, _dirty',
      balance_targets: 'id, farm_id, crop_cycle_id, _dirty',
      crop_registration_sessions: 'id, farm_id, crop_cycle_id, [crop_cycle_id+iso_year+iso_week], _dirty',
      plant_measurements:
        'id, farm_id, session_id, crop_cycle_id, reference_plant_id, [reference_plant_id+iso_year+iso_week], [crop_cycle_id+iso_year+iso_week], _dirty',
      scouting_sessions: 'id, farm_id, greenhouse_id, crop_cycle_id, _dirty',
      scouting_observations: 'id, farm_id, session_id, pest_id, _dirty',
      recommendations: 'id, farm_id, greenhouse_id, _dirty',
      activities: 'id, farm_id, performed_on, _dirty',
      activity_greenhouses: 'id, farm_id, activity_id, greenhouse_id, _dirty',
      activity_products: 'id, farm_id, activity_id, _dirty',
      attachments: 'id, farm_id, [entity_table+entity_id], _dirty',
      meta: 'key',
    });
  }

  tableOf(name: TableName): Table<any, any> {
    return (this as any)[name] as Table<any, any>;
  }
}

export const db = new GreenhouseDB();

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const r = await db.meta.get(key);
  return (r?.value as T) ?? fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
