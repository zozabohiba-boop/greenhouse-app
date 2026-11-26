// تعريف الجداول المتزامنة: الأعمدة وقيمها الافتراضية وترتيب الرفع.
// القاعدة: كل سجل محلي يحمل كل الأعمدة القابلة للكتابة، فالرفع الجماعي (upsert)
// يرسل نفس المفاتيح لكل الصفوف ولا يعتمد على قيم السيرفر الافتراضية.

import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]['Row'];

/** أعمدة يحسبها السيرفر ولا تُرسل أبدًا */
const SERVER_ONLY = ['server_updated_at', 'updated_by'] as const;

const SYNC_COLS = {
  created_at: null,
  updated_at: null,
  deleted_at: null,
  created_by: null,
} as const;

interface Spec {
  /** الأعمدة القابلة للكتابة مع القيمة الافتراضية لكل عمود */
  columns: Record<string, unknown>;
  /** أعمدة محسوبة في قاعدة البيانات (generated) */
  generated?: string[];
}

export const WRITABLE: Partial<Record<TableName, Spec>> = {
  varieties: {
    columns: { id: null, farm_id: null, crop_id: null, name: '', seed_company: null, notes: null, ...SYNC_COLS },
  },
  pests: {
    columns: {
      id: null, farm_id: null, code: '', name_ar: '', name_en: '', scientific_name: null,
      category: 'other', default_count_unit: 'presence', sort_order: 100, is_active: true,
      action_severity: null, crops: null, guidance: null, ...SYNC_COLS,
    },
  },
  products: {
    columns: {
      id: null, farm_id: null, name: '', product_type: 'other', active_ingredient: null, concentration: null,
      moa_code: null, phi_days: null, rei_hours: null, bio_species: null, default_dose_unit: null,
      manufacturer: null, notes: null, is_active: true, is_bio: false, default_dose: null, targets: null,
      category_id: null, eg_reg_no: null, eg_registered_crops: null, ...SYNC_COLS,
    },
  },
  product_categories: {
    columns: {
      id: null, farm_id: null, parent_id: null, code: '', name_ar: '', name_en: null, domain: 'ipm',
      default_product_type: null, is_bio: false, sort_order: 100, notes: null, ...SYNC_COLS,
    },
  },
  active_substances: {
    columns: {
      id: null, farm_id: null, name_en: '', name_ar: null, cas_no: null, classes: [], moa_system: null, moa_code: null,
      chemical_group: null, eu_status: 'unknown', eu_expiry: null, eu_cfs: null, eg_registered: null, notes: null,
      source_url: null, reviewed_on: null, ...SYNC_COLS,
    },
  },
  substance_limits: {
    columns: {
      id: null, farm_id: null, substance_id: null, market: 'EU', crop_code: '', mrl_mg_kg: null, default_loq: false,
      phi_days: null, source_url: null, retrieved_on: null, notes: null, ...SYNC_COLS,
    },
  },
  product_actives: {
    columns: { id: null, farm_id: null, product_id: null, substance_id: null, concentration: null, ...SYNC_COLS },
  },
  pest_controls: {
    columns: { id: null, farm_id: null, pest_id: null, product_id: null, approach: 'natural', priority: 100, note: null, ...SYNC_COLS },
  },
  operation_types: {
    columns: { id: null, farm_id: null, code: '', name_ar: '', name_en: '', category: 'other', sort_order: 100, ...SYNC_COLS },
  },
  farm_profiles: {
    columns: {
      id: null, farm_id: null, owner_name: null, manager_name: null, contact_phone: null, address: null,
      latitude: null, longitude: null, elevation_m: null, total_area_feddan: null, water_source: null,
      water_ec_ds_m: null, water_ph: null, soil_type: null, irrigation_system: null, climate_control: null,
      cover_transmission_pct: 70, export_markets: [], notes: null, ...SYNC_COLS,
    },
  },
  farm_zones: {
    columns: {
      id: null, farm_id: null, parent_id: null, kind: 'sector', name: '', sort_order: 100, area_m2: null,
      notes: null, ...SYNC_COLS,
    },
  },
  greenhouses: {
    columns: {
      id: null, farm_id: null, zone_id: null, code: '', name: null, greenhouse_type: null, area_m2: null, spans_count: null,
      rows_count: null, row_length_m: null, cover_material: null, notes: null, ...SYNC_COLS,
    },
  },
  crop_cycles: {
    columns: {
      id: null, farm_id: null, greenhouse_id: null, crop_id: null, variety_id: null, rootstock: null,
      substrate: null, planting_date: null, expected_end_date: null, end_date: null, plants_count: null,
      plant_density_m2: null, stem_density_m2: null, status: 'active', notes: null, ...SYNC_COLS,
    },
  },
  reference_plants: {
    columns: {
      id: null, farm_id: null, crop_cycle_id: null, label: '', row_no: 1, span_no: null, position_m: null,
      stem_no: 1, tag_code: null, is_active: true, replaced_by_id: null, ...SYNC_COLS,
    },
  },
  balance_targets: {
    columns: {
      id: null, farm_id: null, crop_cycle_id: null, valid_from: null, valid_to: null,
      weekly_growth_min_cm: null, weekly_growth_max_cm: null, stem_diameter_min_mm: null, stem_diameter_max_mm: null,
      flowering_height_min_cm: null, flowering_height_max_cm: null, notes: null, ...SYNC_COLS,
    },
  },
  crop_registration_sessions: {
    columns: {
      id: null, farm_id: null, crop_cycle_id: null, measured_on: null, scout_id: null, started_at: null,
      completed_at: null, notes: null, device_id: null, ...SYNC_COLS,
    },
    generated: ['iso_year', 'iso_week'],
  },
  plant_measurements: {
    columns: {
      id: null, farm_id: null, crop_cycle_id: null, session_id: null, reference_plant_id: null, measured_on: null,
      plant_height_cm: null, weekly_growth_cm: null, stem_diameter_mm: null,
      leaf_count_total: null, leaf_count_remaining: null,
      flowering_truss_no: null, flowering_truss_height_cm: null, open_flowers_count: null,
      set_truss_no: null, set_truss_flowers: null, set_truss_fruits: null,
      fruits_on_plant: null, harvest_truss_no: null, extra: {}, notes: null, device_id: null, ...SYNC_COLS,
    },
    generated: ['iso_year', 'iso_week', 'leaves_removed', 'fruit_set_pct'],
  },
  scouting_sessions: {
    columns: {
      id: null, farm_id: null, greenhouse_id: null, crop_cycle_id: null, scouted_on: null, scout_id: null,
      plants_inspected: null, air_temp_c: null, air_rh_pct: null, started_at: null, completed_at: null,
      notes: null, device_id: null, ...SYNC_COLS,
    },
    generated: ['iso_year', 'iso_week'],
  },
  scouting_observations: {
    columns: {
      id: null, farm_id: null, session_id: null, pest_id: null, method: 'plant_inspection', row_no: null,
      span_no: null, position_m: null, trap_code: null, severity: 0, count_value: null, count_unit: null,
      life_stage: null, plants_inspected: null, plants_infested: null, is_hotspot: false, notes: null,
      device_id: null, ...SYNC_COLS,
    },
  },
  recommendations: {
    columns: {
      id: null, farm_id: null, greenhouse_id: null, crop_cycle_id: null, observation_id: null, author_id: null,
      title: '', body: null, priority: 'normal', status: 'open', due_on: null, resolved_at: null, domain: 'general', ...SYNC_COLS,
    },
  },
  activities: {
    columns: {
      id: null, farm_id: null, activity_type: 'cultural_operation', method: null, operation_type_id: null,
      performed_on: null, start_time: null, end_time: null, performed_by_name: null, water_volume_l: null,
      target_pest_id: null, recommendation_id: null, reason: null, notes: null, device_id: null,
      workers_count: null, labor_hours: null, quality: null, ...SYNC_COLS,
    },
    generated: ['iso_year', 'iso_week', 'domain'],
  },
  activity_greenhouses: {
    columns: {
      id: null, farm_id: null, activity_id: null, greenhouse_id: null, crop_cycle_id: null, rows_scope: null,
      treated_area_m2: null, ...SYNC_COLS,
    },
  },
  activity_products: {
    columns: {
      id: null, farm_id: null, activity_id: null, product_id: null, dose: null, dose_unit: null,
      total_quantity: null, total_unit: null, batch_no: null, notes: null, ...SYNC_COLS,
    },
  },
  attachments: {
    columns: {
      id: null, farm_id: null, entity_table: '', entity_id: null, storage_path: '', mime_type: null,
      caption: null, taken_at: null, device_id: null, ...SYNC_COLS,
    },
  },
  warehouses: {
    columns: { id: null, farm_id: null, name: '', kind: 'general', notes: null, ...SYNC_COLS },
  },
  stock_items: {
    columns: {
      id: null, farm_id: null, product_id: null, stock_unit: 'كجم', min_qty: null, default_warehouse_id: null,
      notes: null, ...SYNC_COLS,
    },
  },
  purchase_requests: {
    columns: {
      id: null, farm_id: null, request_no: null, requested_on: null, needed_by: null, priority: 'normal',
      status: 'submitted', supplier: null, approved_by: null, approved_at: null, decision_note: null, notes: null,
      device_id: null, ...SYNC_COLS,
    },
  },
  purchase_request_items: {
    columns: {
      id: null, farm_id: null, request_id: null, product_id: null, item_name: null, qty: 0, unit: 'كجم', notes: null,
      ...SYNC_COLS,
    },
  },
  stock_movements: {
    columns: {
      id: null, farm_id: null, warehouse_id: null, product_id: null, movement_type: 'receipt', qty: 0, unit: 'كجم',
      moved_on: null, batch_no: null, expiry_date: null, supplier: null, document_no: null, unit_price: null,
      purchase_request_id: null, activity_id: null, greenhouse_id: null, issued_to: null, transfer_group: null,
      notes: null, device_id: null, ...SYNC_COLS,
    },
    generated: ['direction'],
  },
  harvest_records: {
    columns: {
      id: null, farm_id: null, greenhouse_id: null, crop_cycle_id: null, harvested_on: null, grade: 'first',
      weight_kg: 0, boxes_count: null, warehouse_id: null, phi_warning: false, notes: null, device_id: null, ...SYNC_COLS,
    },
    generated: ['iso_year', 'iso_week'],
  },
  documents: {
    columns: {
      id: null, farm_id: null, zone_id: null, greenhouse_id: null, category: 'other', title: '', file_name: '',
      mime_type: null, size_bytes: null, storage_path: '', doc_date: null, notes: null, device_id: null, ...SYNC_COLS,
    },
  },
};

/**
 * ترتيب الرفع: الأب قبل الابن. كل طلب upsert هو transaction مستقلة على السيرفر،
 * لذلك الترتيب هنا هو الضامن لسلامة المفاتيح الأجنبية.
 */
export const PUSH_ORDER: TableName[] = [
  'product_categories', 'varieties', 'pests', 'products', 'active_substances', 'substance_limits', 'product_actives',
  'pest_controls', 'operation_types',
  'farm_profiles', 'farm_zones', 'greenhouses', 'crop_cycles', 'reference_plants', 'balance_targets',
  'crop_registration_sessions', 'plant_measurements',
  'scouting_sessions', 'scouting_observations',
  'recommendations', 'activities', 'activity_greenhouses', 'activity_products',
  'warehouses', 'stock_items', 'purchase_requests', 'purchase_request_items', 'stock_movements', 'harvest_records',
  'attachments', 'documents',
];

/** جداول تُسحب بمؤشر server_updated_at (تزايدي) */
export const INCREMENTAL_PULL: TableName[] = [
  'organizations', 'farms', 'system_admins', ...PUSH_ORDER,
];

/** جداول صغيرة بلا مؤشر — تُسحب كاملة في كل مزامنة */
export const FULL_PULL: TableName[] = ['crops', 'farm_members', 'profiles'];

/** يحوّل السجل المحلي لشكل الرفع: كل الأعمدة القابلة للكتابة فقط */
export function toServerRow(table: TableName, local: Record<string, unknown>): Record<string, unknown> {
  const spec = WRITABLE[table];
  if (!spec) throw new Error(`Table ${table} is read-only on the client`);
  const out: Record<string, unknown> = {};
  for (const [col, def] of Object.entries(spec.columns)) {
    const v = local[col];
    out[col] = v === undefined ? def : v;
  }
  for (const col of SERVER_ONLY) delete out[col];
  return out;
}

export function isGenerated(table: TableName, col: string): boolean {
  return WRITABLE[table]?.generated?.includes(col) ?? false;
}
