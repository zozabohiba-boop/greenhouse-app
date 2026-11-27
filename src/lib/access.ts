// الصلاحيات في التطبيق — نفس قواعد السيرفر (supabase/migrations/012 و 015).
// السيرفر هو الضامن الحقيقي (RLS)، والتطبيق يستخدم نفس القواعد لعرض الشاشات المناسبة لكل دور.

export type Role =
  | 'admin' | 'farm_manager' | 'consultant' | 'supervisor'
  | 'scout' | 'irrigation' | 'operations'
  | 'storekeeper' | 'purchasing' | 'executive';

/** مجالات العمل */
export type Domain = 'ipm' | 'fertigation' | 'operations' | 'store' | 'purchasing';
export const FIELD_DOMAINS: Domain[] = ['ipm', 'fertigation', 'operations'];
export const ALL_DOMAINS: Domain[] = ['ipm', 'fertigation', 'operations', 'store', 'purchasing'];

export const DOMAIN_LABEL: Record<Domain | 'general', string> = {
  general: 'عامة',
  ipm: 'المكافحة',
  fertigation: 'الري والتسميد',
  operations: 'العمليات الزراعية',
  store: 'المخزن والحصاد',
  purchasing: 'المشتريات',
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'مدير النظام',
  farm_manager: 'مدير الشركة',
  consultant: 'استشاري المشروع',
  supervisor: 'مهندس مشرف / منفذ',
  scout: 'مهندس مكافحة',
  irrigation: 'مهندس ري وتسميد',
  operations: 'مهندس عمليات زراعية',
  storekeeper: 'أمين المخزن',
  purchasing: 'مسؤول المشتريات',
  executive: 'متابعة فقط',
};

export const ROLE_HINT: Record<Role, string> = {
  admin: 'كل المشاريع وكل الصلاحيات.',
  farm_manager: 'صلاحية كاملة على المشروع: الفريق والهيكل وكل البيانات، واعتماد طلبات الشراء.',
  consultant: 'صلاحية كاملة زي مدير الشركة: الفريق والهيكل وكل البيانات والتوصيات واعتماد طلبات الشراء.',
  supervisor: 'يسجّل في كل المجالات الميدانية ويتابع كل بيانات المشروع، من غير إدارة الفريق أو الهيكل.',
  scout: 'الفحص اليومي وحالة النباتات، ومعاملات الرش والإطلاق الحيوي وتنفيذ توصيات المكافحة.',
  irrigation: 'معاملات الحقن بالري والتغذية الورقية وبرامج التسميد.',
  operations: 'تسجيل المحصول، وأعمال التجهيز والزراعة والخدمة الأرضية، بالعمالة وجودة التنفيذ.',
  storekeeper: 'استلام وصرف الأصناف والجرد ووزن الحصاد.',
  purchasing: 'طلبات الشراء ومتابعتها حتى الاستلام.',
  executive: 'متابعة لوحة المشروع وتقاريره للقراءة فقط.',
};

/** ترتيب الأدوار في شاشة الفريق (مدير النظام خارج المشروع) */
export const PROJECT_ROLES: Role[] = [
  'farm_manager', 'consultant', 'supervisor', 'scout', 'irrigation', 'operations', 'storekeeper', 'purchasing', 'executive',
];

const FULL_ROLES: Role[] = ['admin', 'farm_manager', 'consultant', 'supervisor', 'executive'];

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

/** مجالات القراءة لدور أو أكثر (الاتحاد) */
export function readDomains(role: Role | Role[] | null): Domain[] {
  const rs = Array.isArray(role) ? role : role ? [role] : [];
  return uniq(rs.flatMap((r): Domain[] => {
    switch (r) {
      case 'scout': return ['ipm'];
      case 'irrigation': return ['fertigation'];
      case 'operations': return ['operations'];
      case 'storekeeper': return ['store', 'purchasing'];
      case 'purchasing': return ['purchasing', 'store'];
      default: return ALL_DOMAINS;
    }
  }));
}

/** مجالات التسجيل لدور أو أكثر (الاتحاد؛ «متابعة فقط» لا يسجّل) */
export function writeDomains(role: Role | Role[] | null): Domain[] {
  const rs = Array.isArray(role) ? role : role ? [role] : [];
  return uniq(rs.flatMap((r): Domain[] => {
    switch (r) {
      case 'executive': return [];
      case 'scout': return ['ipm'];
      case 'irrigation': return ['fertigation'];
      case 'operations': return ['operations'];
      case 'storekeeper': return ['store'];
      case 'purchasing': return ['purchasing'];
      default: return ALL_DOMAINS;
    }
  }));
}

/** نوع المعاملة ← المجال المسؤول (نفس activities.domain على السيرفر) */
export type ActivityType = 'chemical_spray' | 'bio_release' | 'fertigation_injection' | 'foliar_nutrition' | 'cultural_operation';
export const ACTIVITY_DOMAIN: Record<ActivityType, Domain> = {
  chemical_spray: 'ipm',
  bio_release: 'ipm',
  fertigation_injection: 'fertigation',
  foliar_nutrition: 'fertigation',
  cultural_operation: 'operations',
};

export interface Access {
  /** الدور الأساسي */
  role: Role | null;
  /** كل أدوار العضو (الأساسي أولًا) */
  roles: Role[];
  isSystemAdmin: boolean;
  /** يشوف كل تفاصيل المشروع */
  full: boolean;
  domains: Domain[];
  recordDomains: Domain[];
  canRead: (d: Domain | 'general' | string | null | undefined) => boolean;
  canRecord: (d: Domain | 'general' | string | null | undefined) => boolean;
  /** أي تسجيل ميداني (مكافحة/ري/عمليات) */
  record: boolean;
  /** تعديل هيكل المشروع والدورات والقيم المستهدفة */
  manage: boolean;
  /** إدارة فريق المشروع */
  invite: boolean;
  /** كتابة التوصيات */
  advise: boolean;
  /** تعديل سجلات الآخرين */
  supervise: boolean;
  /** مدير النظام: إنشاء مشاريع ومديري نظام والكتالوج العام */
  admin: boolean;
  /** إضافة مواد/تصنيفات خاصة بالمشروع */
  addCatalog: boolean;
  /** رفع الملفات والتقارير */
  upload: boolean;
  /** اعتماد طلبات الشراء */
  approvePurchases: boolean;
  /** المخزن والحصاد */
  store: boolean;
  /** طلبات الشراء: تقديم */
  requestPurchase: boolean;
}

/**
 * صلاحيات العضو من دور أو أكثر: الصلاحية = اتحاد كل أدواره.
 * استشاري المشروع له نفس صلاحيات مدير الشركة (إدارة الفريق، اعتماد الشراء، تعديل سجلات الآخرين).
 */
export function accessFor(roleOrRoles: Role | Role[] | null, isSystemAdmin: boolean): Access {
  const list: Role[] = isSystemAdmin ? ['admin'] : Array.isArray(roleOrRoles) ? roleOrRoles : roleOrRoles ? [roleOrRoles] : [];
  const r: Role | null = list[0] ?? null;
  const domains = readDomains(list);
  const recordDomains = writeDomains(list);
  const is = (...rs: Role[]) => list.some((x) => rs.includes(x));
  const writer = list.some((x) => x !== 'executive');
  const canRead = (d: string | null | undefined) => list.length > 0 && (d === 'general' || domains.includes(d as Domain));
  const canRecord = (d: string | null | undefined) => writer && (d === 'general' || recordDomains.includes(d as Domain));
  return {
    role: r,
    roles: list,
    isSystemAdmin,
    full: is(...FULL_ROLES),
    domains,
    recordDomains,
    canRead,
    canRecord,
    record: FIELD_DOMAINS.some((d) => recordDomains.includes(d)),
    manage: is('admin', 'farm_manager', 'consultant'),
    invite: is('admin', 'farm_manager', 'consultant'),
    advise: is('admin', 'farm_manager', 'consultant'),
    supervise: is('admin', 'farm_manager', 'consultant'),
    admin: isSystemAdmin,
    addCatalog: writer,
    upload: writer,
    approvePurchases: is('admin', 'farm_manager', 'consultant'),
    store: domains.includes('store'),
    requestPurchase: writer,
  };
}

/** ترتيب الأدوار من الأعلى للأدنى كما في شاشة الفريق، ثم الأساسي أولًا */
export function splitRoles(picked: Role[]): { role: Role; extra: Role[] } | null {
  const ordered = PROJECT_ROLES.filter((r) => picked.includes(r));
  return ordered.length ? { role: ordered[0], extra: ordered.slice(1) } : null;
}

export function rolesOf(m: { role: string; extra_roles?: string[] | null }): Role[] {
  return [m.role as Role, ...((m.extra_roles ?? []) as Role[])];
}

export function roleLabels(roles: Role[]): string {
  return roles.map((r) => ROLE_LABEL[r]).join(' + ');
}
