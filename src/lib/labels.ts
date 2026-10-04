import type { Database } from './database.types';

type E = Database['public']['Enums'];

export const SUBSTRATE_LABEL: Record<string, string> = {
  soil: 'تربة',
  cocopeat: 'كوكوبيت',
  rockwool: 'صوف صخري',
  volcanic_tuff: 'طف بركاني',
  perlite: 'بيرلايت',
  other: 'أخرى',
};

export const CYCLE_STATUS_LABEL: Record<string, string> = {
  planned: 'مخطط',
  active: 'قائمة',
  finished: 'منتهية',
};

// ── الفحص الحشري ────────────────────────────────────────────────────
export const PEST_CATEGORY_LABEL: Record<E['pest_category'], string> = {
  insect: 'حشرات',
  mite: 'أكاروس',
  fungus: 'أمراض فطرية',
  oomycete: 'أمراض فطرية',
  bacteria: 'أمراض بكتيرية',
  virus: 'فيروسات',
  nematode: 'نيماتودا',
  physiological: 'فسيولوجي',
  other: 'أخرى',
};
/** ترتيب مجموعات الآفات في شاشة الفحص */
export const PEST_GROUPS: { title: string; cats: E['pest_category'][] }[] = [
  { title: 'حشرات', cats: ['insect'] },
  { title: 'أكاروس', cats: ['mite'] },
  { title: 'أمراض', cats: ['fungus', 'oomycete', 'bacteria'] },
  { title: 'فيروسات', cats: ['virus'] },
  { title: 'نيماتودا وفسيولوجي وأخرى', cats: ['nematode', 'physiological', 'other'] },
];

export const SCOUT_METHOD_LABEL: Record<E['scouting_method'], string> = {
  plant_inspection: 'فحص النبات',
  sticky_trap: 'مصيدة لاصقة',
  pheromone_trap: 'مصيدة فرمونية',
  indicator_plant: 'نبات دليل',
};

export const COUNT_UNIT_LABEL: Record<E['count_unit'], string> = {
  per_leaf: 'لكل ورقة',
  per_plant: 'لكل نبات',
  per_flower: 'لكل زهرة',
  per_trap: 'لكل مصيدة',
  percent_plants: '% من النباتات',
  presence: 'وجود فقط',
};

export const SEVERITY = [
  { v: 0, label: 'لا يوجد', short: 'نظيف' },
  { v: 1, label: 'خفيف', short: 'خفيف' },
  { v: 2, label: 'متوسط', short: 'متوسط' },
  { v: 3, label: 'شديد', short: 'شديد' },
  { v: 4, label: 'شديد جدًا / بؤرة', short: 'بؤرة' },
] as const;

export const LIFE_STAGES = ['بيض', 'يرقات', 'حوريات', 'عذارى', 'بالغات', 'أعراض', 'جراثيم'];

// ── المعاملات ────────────────────────────────────────────────────────
export const ACTIVITY_TYPE_LABEL: Record<E['activity_type'], string> = {
  chemical_spray: 'رش',
  fertigation_injection: 'حقن بالري',
  bio_release: 'إطلاق حيوي',
  cultural_operation: 'عملية زراعية',
};
export const ACTIVITY_ICON: Record<E['activity_type'], string> = {
  chemical_spray: 'spray',
  fertigation_injection: 'drop',
  bio_release: 'bug',
  cultural_operation: 'plant',
};

export const APP_METHOD_LABEL: Record<E['application_method'], string> = {
  foliar_spray: 'رش ورقي',
  fogging: 'تضبيب',
  drench: 'سقي حول الجذور',
  fertigation: 'مع مياه الري',
  release: 'إطلاق',
  manual: 'يدوي',
};

export const PRODUCT_TYPE_LABEL: Record<E['product_type'], string> = {
  insecticide: 'مبيد حشري',
  acaricide: 'مبيد أكاروسي',
  fungicide: 'مبيد فطري',
  bactericide: 'مبيد بكتيري',
  nematicide: 'مبيد نيماتودا',
  herbicide: 'مبيد حشائش',
  fertilizer: 'سماد',
  biostimulant: 'منشط حيوي',
  biocontrol_agent: 'عدو حيوي',
  pollinator: 'ملقّح',
  adjuvant: 'مادة مساعدة',
  other: 'أخرى',
};

/** المنتجات المناسبة لكل نوع معاملة */
export const PRODUCT_TYPES_FOR: Record<E['activity_type'], E['product_type'][]> = {
  chemical_spray: ['insecticide', 'acaricide', 'fungicide', 'bactericide', 'nematicide', 'herbicide', 'biostimulant', 'fertilizer', 'adjuvant', 'other'],
  fertigation_injection: ['fertilizer', 'biostimulant', 'nematicide', 'fungicide', 'insecticide', 'bactericide', 'other'],
  bio_release: ['biocontrol_agent', 'pollinator'],
  cultural_operation: [],
};

export const DOSE_UNIT_LABEL: Record<E['dose_unit'], string> = {
  ml_per_l: 'مل/لتر',
  g_per_l: 'جم/لتر',
  ml_per_100l: 'مل/100 لتر',
  g_per_100l: 'جم/100 لتر',
  l_per_feddan: 'لتر/فدان',
  kg_per_feddan: 'كجم/فدان',
  ml_per_feddan: 'مل/فدان',
  g_per_feddan: 'جم/فدان',
  l_per_ha: 'لتر/هكتار',
  kg_per_ha: 'كجم/هكتار',
  individuals_per_m2: 'فرد/م²',
  individuals_total: 'فرد (إجمالي)',
  units_per_greenhouse: 'عبوة/صوبة',
  hives: 'خلية',
  other: 'أخرى',
};

export const OP_CATEGORY_LABEL: Record<E['operation_category'], string> = {
  establishment: 'التأسيس',
  crop_maintenance: 'خدمة المحصول',
  pollination: 'التلقيح',
  hygiene: 'النظافة والوقاية',
  harvest: 'الحصاد',
  other: 'أخرى',
};

// ── التوصيات ─────────────────────────────────────────────────────────
export const PRIORITY_LABEL: Record<E['priority_level'], string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'مهمة',
  urgent: 'عاجلة',
};
export const REC_STATUS_LABEL: Record<E['recommendation_status'], string> = {
  open: 'مفتوحة',
  in_progress: 'جاري التنفيذ',
  done: 'نُفّذت',
  cancelled: 'ملغاة',
};
