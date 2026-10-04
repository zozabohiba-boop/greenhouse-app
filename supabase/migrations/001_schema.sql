-- =====================================================================
--  نظام إدارة الصوب ومراقبة المحصول — Greenhouse Crop & IPM System
--  Migration 001 — الهيكل الأساسي لقاعدة البيانات (Supabase / PostgreSQL 15+)
-- ---------------------------------------------------------------------
--  مبادئ التصميم:
--  1) Offline-first: كل المفاتيح UUID تتولّد على التابلت نفسه، فالسجل له
--     هويته النهائية من لحظة إنشائه بدون إنترنت.
--  2) كل جدول فيه أعمدة مزامنة:
--       created_at / updated_at  ← وقت الجهاز (وقت التسجيل الحقيقي في الصوبة)
--       server_updated_at        ← يضبطه السيرفر تلقائيًا = مؤشر السحب (Pull cursor)
--       deleted_at               ← حذف ناعم (Soft delete) حتى يوصل الحذف لباقي الأجهزة
--  3) farm_id موجود في كل جدول بيانات: يبسّط صلاحيات RLS ويسرّع المزامنة
--     لكل مزرعة، ومفاتيح أجنبية مركّبة تمنع خلط بيانات مزرعتين.
--  4) لا يوجد حذف نهائي من التطبيق — سجل المعاملات يظل كاملًا للمراجعة.
-- =====================================================================

create schema if not exists app;   -- دوال مساعدة داخلية

-- ---------------------------------------------------------------------
-- 0) الأنواع الثابتة (ENUMS)
-- ---------------------------------------------------------------------
create type public.member_role as enum
  ('admin', 'farm_manager', 'consultant', 'scout', 'executive');

create type public.crop_cycle_status as enum ('planned', 'active', 'finished');

create type public.substrate_type as enum
  ('soil', 'cocopeat', 'rockwool', 'volcanic_tuff', 'perlite', 'other');

create type public.pest_category as enum
  ('insect', 'mite', 'fungus', 'oomycete', 'bacteria', 'virus', 'nematode', 'physiological', 'other');

create type public.scouting_method as enum
  ('plant_inspection', 'sticky_trap', 'pheromone_trap', 'indicator_plant');

create type public.count_unit as enum
  ('per_leaf', 'per_plant', 'per_flower', 'per_trap', 'percent_plants', 'presence');

create type public.activity_type as enum
  ('chemical_spray', 'fertigation_injection', 'bio_release', 'cultural_operation');

create type public.application_method as enum
  ('foliar_spray', 'fogging', 'drench', 'fertigation', 'release', 'manual');

create type public.product_type as enum
  ('insecticide', 'acaricide', 'fungicide', 'bactericide', 'nematicide', 'herbicide',
   'fertilizer', 'biostimulant', 'biocontrol_agent', 'pollinator', 'adjuvant', 'other');

create type public.dose_unit as enum
  ('ml_per_l', 'g_per_l', 'ml_per_100l', 'g_per_100l',
   'l_per_feddan', 'kg_per_feddan', 'ml_per_feddan', 'g_per_feddan',
   'l_per_ha', 'kg_per_ha',
   'individuals_per_m2', 'individuals_total', 'units_per_greenhouse', 'hives', 'other');

create type public.operation_category as enum
  ('establishment', 'crop_maintenance', 'pollination', 'hygiene', 'harvest', 'other');

create type public.recommendation_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.priority_level as enum ('low', 'normal', 'high', 'urgent');

-- ---------------------------------------------------------------------
-- 1) دالة المزامنة العامة (تُركّب على كل الجداول)
-- ---------------------------------------------------------------------
create or replace function app.touch_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.server_updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  else
    new.created_by := old.created_by;   -- صاحب السجل لا يتغيّر
    new.created_at := old.created_at;
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 2) المؤسسات والمزارع والمستخدمين
-- ---------------------------------------------------------------------
create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
comment on table public.organizations is 'الشركة/العميل المالك لمجموعة مزارع';

create table public.farms (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  name              text not null,
  location_text     text,
  timezone          text not null default 'Africa/Cairo',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
comment on table public.farms is 'المزرعة — وحدة الصلاحيات الأساسية';

create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  phone              text,
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.farm_members (
  farm_id    uuid not null references public.farms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);
create index on public.farm_members (user_id);
comment on table public.farm_members is
  'ربط المستخدم بالمزرعة ودوره: scout كشاف | farm_manager مدير مزرعة | consultant استشاري | executive إدارة تنفيذية (قراءة فقط) | admin';

-- إنشاء profile تلقائيًا عند تسجيل مستخدم جديد في Supabase Auth
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) دوال الصلاحيات (تُستخدم داخل سياسات RLS)
-- ---------------------------------------------------------------------
create or replace function app.member_role(p_farm uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select role from public.farm_members
  where farm_id = p_farm and user_id = auth.uid()
$$;

create or replace function app.is_member(p_farm uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.farm_members
                 where farm_id = p_farm and user_id = auth.uid())
$$;

create or replace function app.has_role(p_farm uuid, p_roles public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app.member_role(p_farm) = any (p_roles), false)
$$;

-- ---------------------------------------------------------------------
-- 4) الكتالوجات (عامة farm_id = null، أو خاصة بمزرعة)
-- ---------------------------------------------------------------------
create table public.crops (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,          -- tomato, cucumber, pepper ...
  name_ar text not null,
  name_en text not null
);

create table public.varieties (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),   -- null = كتالوج عام
  crop_id           uuid not null references public.crops(id),
  name              text not null,
  seed_company      text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

create table public.pests (
  id                 uuid primary key default gen_random_uuid(),
  farm_id            uuid references public.farms(id),  -- null = كتالوج عام
  code               text not null,
  name_ar            text not null,
  name_en            text not null,
  scientific_name    text,
  category           public.pest_category not null,
  default_count_unit public.count_unit not null default 'presence',
  sort_order         smallint not null default 100,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  server_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  created_by         uuid references auth.users(id),
  updated_by         uuid references auth.users(id)
);
create unique index pests_code_uq on public.pests (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
comment on table public.pests is 'كتالوج الآفات والأمراض والاضطرابات الفسيولوجية';

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),   -- null = كتالوج عام
  name              text not null,                      -- الاسم التجاري
  product_type      public.product_type not null,
  active_ingredient text,                               -- المادة الفعالة
  concentration     text,                               -- مثل 5% EC
  moa_code          text,                               -- مجموعة IRAC / FRAC لإدارة المقاومة
  phi_days          smallint check (phi_days >= 0),     -- فترة الأمان قبل الحصاد
  rei_hours         smallint check (rei_hours >= 0),    -- فترة منع الدخول
  bio_species       text,                               -- للأعداء الحيوية والملقحات
  default_dose_unit public.dose_unit,
  manufacturer      text,
  notes             text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
comment on table public.products is 'المبيدات والأسمدة والأعداء الحيوية والملقحات';

create table public.operation_types (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),   -- null = كتالوج عام
  code              text not null,
  name_ar           text not null,
  name_en           text not null,
  category          public.operation_category not null,
  sort_order        smallint not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
create unique index operation_types_code_uq on public.operation_types (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
comment on table public.operation_types is 'العمليات الزراعية: شتل، توريق، تنزيل، تطويش، وضع خلايا النحل ...';

-- ---------------------------------------------------------------------
-- 5) هيكل المزرعة: الصوب ← الدورات الزراعية ← النباتات المرجعية
-- ---------------------------------------------------------------------
create table public.greenhouses (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  code              text not null,                 -- مثل GH-07
  name              text,
  greenhouse_type   text,                          -- مفرد / متعدد البواكي / شبكي ...
  area_m2           numeric(10,1) check (area_m2 > 0),
  spans_count       smallint check (spans_count > 0),   -- عدد البواكي
  rows_count        smallint check (rows_count > 0),    -- عدد الخطوط
  row_length_m      numeric(6,1),
  cover_material    text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id)
);
create unique index greenhouses_code_uq on public.greenhouses (farm_id, code) where deleted_at is null;

create table public.crop_cycles (
  id                   uuid primary key default gen_random_uuid(),
  farm_id              uuid not null,
  greenhouse_id        uuid not null,
  crop_id              uuid not null references public.crops(id),
  variety_id           uuid references public.varieties(id),
  rootstock            text,                       -- الأصل (للنباتات المطعومة)
  substrate            public.substrate_type,
  planting_date        date not null,
  expected_end_date    date,
  end_date             date,
  plants_count         integer check (plants_count > 0),
  plant_density_m2     numeric(5,2),               -- نبات / م²
  stem_density_m2      numeric(5,2),               -- ساق / م²
  status               public.crop_cycle_status not null default 'active',
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  server_updated_at    timestamptz not null default now(),
  deleted_at           timestamptz,
  created_by           uuid references auth.users(id),
  updated_by           uuid references auth.users(id),
  unique (id, farm_id),
  foreign key (greenhouse_id, farm_id) references public.greenhouses (id, farm_id),
  check (end_date is null or end_date >= planting_date)
);
create index on public.crop_cycles (greenhouse_id);
comment on table public.crop_cycles is 'الدورة الزراعية: محصول وصنف محددين داخل صوبة من الشتل للتقليع';

create table public.reference_plants (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  crop_cycle_id     uuid not null,
  label             text not null,                 -- مثل R12-P3
  row_no            smallint not null check (row_no > 0),
  span_no           smallint check (span_no > 0),
  position_m        numeric(6,1),                  -- المسافة من بداية الخط
  stem_no           smallint not null default 1,   -- للنباتات متعددة السيقان
  tag_code          text,                          -- كود QR/باركود على كارت النبات
  is_active         boolean not null default true,
  replaced_by_id    uuid references public.reference_plants(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  unique (id, crop_cycle_id),
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id)
);
create unique index reference_plants_label_uq on public.reference_plants (crop_cycle_id, label) where deleted_at is null;
create unique index reference_plants_tag_uq on public.reference_plants (farm_id, tag_code) where tag_code is not null and deleted_at is null;
comment on table public.reference_plants is 'النباتات المرجعية المعلّمة التي تُقاس كل أسبوع';

-- القيم المستهدفة لتوازن النبات — يحددها الاستشاري لكل دورة (ويمكن تغييرها بمرحلة النمو)
create table public.balance_targets (
  id                       uuid primary key default gen_random_uuid(),
  farm_id                  uuid not null,
  crop_cycle_id            uuid not null,
  valid_from               date not null,
  valid_to                 date,
  weekly_growth_min_cm     numeric(5,1),
  weekly_growth_max_cm     numeric(5,1),
  stem_diameter_min_mm     numeric(4,1),
  stem_diameter_max_mm     numeric(4,1),
  flowering_height_min_cm  numeric(5,1),
  flowering_height_max_cm  numeric(5,1),
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  server_updated_at        timestamptz not null default now(),
  deleted_at               timestamptz,
  created_by               uuid references auth.users(id),
  updated_by               uuid references auth.users(id),
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id),
  check (valid_to is null or valid_to >= valid_from),
  check (weekly_growth_min_cm    is null or weekly_growth_max_cm    is null or weekly_growth_min_cm    <= weekly_growth_max_cm),
  check (stem_diameter_min_mm    is null or stem_diameter_max_mm    is null or stem_diameter_min_mm    <= stem_diameter_max_mm),
  check (flowering_height_min_cm is null or flowering_height_max_cm is null or flowering_height_min_cm <= flowering_height_max_cm)
);
create index on public.balance_targets (crop_cycle_id, valid_from);

-- ---------------------------------------------------------------------
-- 6) وحدة تسجيل المحصول الأسبوعي (Crop Registration)
-- ---------------------------------------------------------------------
create table public.crop_registration_sessions (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  crop_cycle_id     uuid not null,
  measured_on       date not null,
  iso_year          smallint generated always as (extract(isoyear from measured_on)::smallint) stored,
  iso_week          smallint generated always as (extract(week    from measured_on)::smallint) stored,
  scout_id          uuid references auth.users(id) default auth.uid(),
  started_at        timestamptz,
  completed_at      timestamptz,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  unique (id, crop_cycle_id),
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id)
    deferrable initially deferred
);
create index on public.crop_registration_sessions (crop_cycle_id, iso_year, iso_week);

create table public.plant_measurements (
  id                        uuid primary key default gen_random_uuid(),
  farm_id                   uuid not null,
  crop_cycle_id             uuid not null,
  session_id                uuid not null,
  reference_plant_id        uuid not null,
  measured_on               date not null,
  iso_year                  smallint generated always as (extract(isoyear from measured_on)::smallint) stored,
  iso_week                  smallint generated always as (extract(week    from measured_on)::smallint) stored,

  -- النمو والقوة
  plant_height_cm           numeric(6,1) check (plant_height_cm between 0 and 2000),
  weekly_growth_cm          numeric(5,1) check (weekly_growth_cm between 0 and 100),   -- الاستطالة الأسبوعية
  stem_diameter_mm          numeric(4,1) check (stem_diameter_mm between 0 and 40),    -- سمك الرأس/الساق

  -- الأوراق
  leaf_count_total          smallint check (leaf_count_total between 0 and 120),
  leaf_count_remaining      smallint check (leaf_count_remaining between 0 and 120),   -- المتبقي بعد التوريق
  leaves_removed            smallint generated always as (leaf_count_total - leaf_count_remaining) stored,

  -- التزهير
  flowering_truss_no        smallint check (flowering_truss_no between 0 and 80),      -- رقم العنقود المزهر حاليًا
  flowering_truss_height_cm numeric(5,1) check (flowering_truss_height_cm between 0 and 150), -- المسافة من القمة النامية للعنقود المزهر
  open_flowers_count        smallint check (open_flowers_count between 0 and 200),     -- الأزهار المتفتحة بالقمة

  -- العقد والثمار
  set_truss_no              smallint check (set_truss_no between 0 and 80),            -- رقم آخر عنقود عاقد
  set_truss_flowers         smallint check (set_truss_flowers between 0 and 200),
  set_truss_fruits          smallint check (set_truss_fruits between 0 and 200),
  fruit_set_pct             numeric(5,1) generated always as (
                              case when set_truss_flowers > 0
                                   then round(100.0 * set_truss_fruits / set_truss_flowers, 1) end) stored,
  fruits_on_plant           smallint check (fruits_on_plant between 0 and 1000),       -- إجمالي الثمار المتكونة
  harvest_truss_no          smallint check (harvest_truss_no between 0 and 80),

  extra                     jsonb not null default '{}'::jsonb,   -- قياسات إضافية خاصة بمحصول معيّن
  notes                     text,
  device_id                 text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  server_updated_at         timestamptz not null default now(),
  deleted_at                timestamptz,
  created_by                uuid references auth.users(id),
  updated_by                uuid references auth.users(id),

  check (leaf_count_remaining is null or leaf_count_total is null or leaf_count_remaining <= leaf_count_total),
  check (set_truss_fruits is null or set_truss_flowers is null or set_truss_fruits <= set_truss_flowers),
  foreign key (crop_cycle_id, farm_id)            references public.crop_cycles (id, farm_id)                   deferrable initially deferred,
  foreign key (session_id, crop_cycle_id)         references public.crop_registration_sessions (id, crop_cycle_id) deferrable initially deferred,
  foreign key (reference_plant_id, crop_cycle_id) references public.reference_plants (id, crop_cycle_id)       deferrable initially deferred
);
-- قياس واحد فقط لكل نبات مرجعي في الأسبوع
create unique index plant_measurements_week_uq
  on public.plant_measurements (reference_plant_id, iso_year, iso_week) where deleted_at is null;
create index on public.plant_measurements (crop_cycle_id, iso_year, iso_week);
create index on public.plant_measurements (session_id);

-- ---------------------------------------------------------------------
-- 7) وحدة الفحص الحشري (IPM Scouting)
-- ---------------------------------------------------------------------
create table public.scouting_sessions (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  greenhouse_id     uuid not null,
  crop_cycle_id     uuid,
  scouted_on        date not null,
  iso_year          smallint generated always as (extract(isoyear from scouted_on)::smallint) stored,
  iso_week          smallint generated always as (extract(week    from scouted_on)::smallint) stored,
  scout_id          uuid references auth.users(id) default auth.uid(),
  plants_inspected  integer check (plants_inspected >= 0),
  air_temp_c        numeric(4,1),
  air_rh_pct        numeric(4,1) check (air_rh_pct between 0 and 100),
  started_at        timestamptz,
  completed_at      timestamptz,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  foreign key (greenhouse_id, farm_id) references public.greenhouses (id, farm_id) deferrable initially deferred,
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id) deferrable initially deferred
);
create index on public.scouting_sessions (greenhouse_id, scouted_on);
comment on table public.scouting_sessions is 'جولة فحص لصوبة — جولة بلا ملاحظات تعني صوبة نظيفة';

create table public.scouting_observations (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  session_id        uuid not null,
  pest_id           uuid not null references public.pests(id),
  method            public.scouting_method not null default 'plant_inspection',
  row_no            smallint check (row_no > 0),
  span_no           smallint check (span_no > 0),
  position_m        numeric(6,1),
  trap_code         text,                                   -- رقم المصيدة اللاصقة/الفرمونية
  severity          smallint not null check (severity between 0 and 4),
                    -- 0 لا يوجد | 1 خفيف | 2 متوسط | 3 شديد | 4 شديد جدًا/بؤرة
  count_value       numeric(8,1) check (count_value >= 0),
  count_unit        public.count_unit,
  life_stage        text,                                   -- بيض / حوريات / بالغات / جراثيم ...
  plants_inspected  smallint check (plants_inspected >= 0),
  plants_infested   smallint check (plants_infested >= 0),
  is_hotspot        boolean not null default false,         -- بؤرة إصابة
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  check (plants_infested is null or plants_inspected is null or plants_infested <= plants_inspected),
  foreign key (session_id, farm_id) references public.scouting_sessions (id, farm_id) deferrable initially deferred
);
create index on public.scouting_observations (session_id);
create index on public.scouting_observations (pest_id);

-- ---------------------------------------------------------------------
-- 8) سجل المعاملات: رش، حقن بالري، إطلاق حيوي، عمليات زراعية
-- ---------------------------------------------------------------------
create table public.recommendations (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  greenhouse_id     uuid,
  crop_cycle_id     uuid,
  observation_id    uuid,
  author_id         uuid references auth.users(id) default auth.uid(),
  title             text not null,
  body              text,
  priority          public.priority_level not null default 'normal',
  status            public.recommendation_status not null default 'open',
  due_on            date,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  foreign key (greenhouse_id, farm_id)  references public.greenhouses (id, farm_id)           deferrable initially deferred,
  foreign key (crop_cycle_id, farm_id)  references public.crop_cycles (id, farm_id)           deferrable initially deferred,
  foreign key (observation_id, farm_id) references public.scouting_observations (id, farm_id) deferrable initially deferred
);
comment on table public.recommendations is 'توصيات الاستشاري/المدير — حلقة الوصل بين الفحص والمعاملة';

create table public.activities (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  activity_type     public.activity_type not null,
  method            public.application_method,
  operation_type_id uuid references public.operation_types(id),   -- للعمليات الزراعية
  performed_on      date not null,
  iso_year          smallint generated always as (extract(isoyear from performed_on)::smallint) stored,
  iso_week          smallint generated always as (extract(week    from performed_on)::smallint) stored,
  start_time        time,
  end_time          time,
  performed_by_name text,                      -- اسم العامل/الفني المنفّذ
  water_volume_l    numeric(10,1) check (water_volume_l >= 0),   -- حجم محلول الرش/الحقن
  target_pest_id    uuid references public.pests(id),
  recommendation_id uuid,
  reason            text,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  foreign key (recommendation_id, farm_id) references public.recommendations (id, farm_id) deferrable initially deferred,
  check (activity_type <> 'cultural_operation' or operation_type_id is not null)
);
create index on public.activities (farm_id, performed_on);

-- الصوب التي شملتها المعاملة (معاملة واحدة قد تغطي أكثر من صوبة)
create table public.activity_greenhouses (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  activity_id       uuid not null,
  greenhouse_id     uuid not null,
  crop_cycle_id     uuid,
  rows_scope        text,                      -- مثلًا "الخطوط 1-12" أو "البؤرة فقط"
  treated_area_m2   numeric(10,1),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  foreign key (activity_id, farm_id)   references public.activities (id, farm_id)  deferrable initially deferred,
  foreign key (greenhouse_id, farm_id) references public.greenhouses (id, farm_id) deferrable initially deferred,
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id) deferrable initially deferred
);
create unique index activity_greenhouses_uq on public.activity_greenhouses (activity_id, greenhouse_id) where deleted_at is null;
create index on public.activity_greenhouses (greenhouse_id);

-- المواد المستخدمة في المعاملة (مبيد/سماد/عدو حيوي/ملقّح) بجرعاتها
create table public.activity_products (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  activity_id       uuid not null,
  product_id        uuid not null references public.products(id),
  dose              numeric(10,3) check (dose >= 0),
  dose_unit         public.dose_unit,
  total_quantity    numeric(12,3) check (total_quantity >= 0),
  total_unit        text,                      -- لتر / كجم / علبة / خلية
  batch_no          text,                      -- رقم التشغيلة
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  foreign key (activity_id, farm_id) references public.activities (id, farm_id) deferrable initially deferred
);
create index on public.activity_products (activity_id);
create index on public.activity_products (product_id);

-- ---------------------------------------------------------------------
-- 9) المرفقات (صور الإصابات والنباتات) — الملف نفسه في Supabase Storage
-- ---------------------------------------------------------------------
create table public.attachments (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  entity_table      text not null check (entity_table in
                      ('scouting_observations', 'plant_measurements', 'activities',
                       'recommendations', 'greenhouses', 'crop_cycles')),
  entity_id         uuid not null,
  storage_path      text not null,             -- داخل bucket field-photos: <farm_id>/<yyyy>/<uuid>.jpg
  mime_type         text,
  caption           text,
  taken_at          timestamptz,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
create index on public.attachments (entity_table, entity_id);

-- ---------------------------------------------------------------------
-- 10) تركيب تريجر المزامنة + فهرس المزامنة على كل الجداول
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','farms','varieties','pests','products','operation_types',
    'greenhouses','crop_cycles','reference_plants','balance_targets',
    'crop_registration_sessions','plant_measurements',
    'scouting_sessions','scouting_observations',
    'recommendations','activities','activity_greenhouses','activity_products','attachments']
  loop
    execute format('create trigger %I before insert or update on public.%I
                    for each row execute function app.touch_row()', t || '_touch', t);
    execute format('create index %I on public.%I (server_updated_at)', t || '_sync_idx', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 11) صلاحيات الوصول (Row Level Security)
-- ---------------------------------------------------------------------
--  executive  : قراءة فقط لكل بيانات المزرعة
--  scout      : يُدخل القياسات والفحص والمعاملات، ويعدّل سجلاته فقط
--  consultant : مثل الكشاف + يضبط القيم المستهدفة ويكتب التوصيات ويضيف للكتالوج
--  farm_manager / admin : تعديل كل بيانات المزرعة وهيكلها
--  لا توجد سياسة DELETE → الحذف من التطبيق يكون ناعمًا عبر deleted_at
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update on all tables in schema public to authenticated;
revoke delete, truncate on all tables in schema public from authenticated;  -- Supabase يمنحها افتراضيًا

do $$
declare t text;
begin
  -- (أ) بيانات ميدانية
  foreach t in array array[
    'crop_registration_sessions','plant_measurements','scouting_sessions','scouting_observations',
    'activities','activity_greenhouses','activity_products','attachments']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (app.is_member(farm_id))$p$, t || '_select', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check (app.has_role(farm_id, '{admin,farm_manager,consultant,scout}'))$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using (app.has_role(farm_id, '{admin,farm_manager}')
                            or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,scout}')))
                     with check (app.has_role(farm_id, '{admin,farm_manager}')
                            or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,scout}')))$p$,
                   t || '_update', t);
  end loop;

  -- (ب) هيكل المزرعة
  foreach t in array array['greenhouses','crop_cycles','reference_plants','balance_targets']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (app.is_member(farm_id))$p$, t || '_select', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check (app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using (app.has_role(farm_id, '{admin,farm_manager,consultant}'))
                     with check (app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_update', t);
  end loop;

  -- (ج) الكتالوجات: العام يقرأه الجميع، والخاص بمزرعة يضيفه المدير/الاستشاري
  foreach t in array array['varieties','pests','products','operation_types']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (farm_id is null or app.is_member(farm_id))$p$, t || '_select', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'))
                     with check (farm_id is not null and app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_update', t);
  end loop;
end $$;

-- (د) التوصيات: يكتبها الاستشاري/المدير، ويحدّث حالتها صاحبها أو المدير
alter table public.recommendations enable row level security;
create policy recommendations_select on public.recommendations for select to authenticated
  using (app.is_member(farm_id));
create policy recommendations_insert on public.recommendations for insert to authenticated
  with check (app.has_role(farm_id, '{admin,farm_manager,consultant}'));
create policy recommendations_update on public.recommendations for update to authenticated
  using (app.has_role(farm_id, '{admin,farm_manager}') or author_id = (select auth.uid()))
  with check (app.is_member(farm_id));

-- (هـ) المحاصيل: كتالوج ثابت للقراءة
alter table public.crops enable row level security;
create policy crops_select on public.crops for select to authenticated using (true);

-- (و) المؤسسات والمزارع والأعضاء والملفات الشخصية
alter table public.organizations enable row level security;
create policy organizations_select on public.organizations for select to authenticated
  using (exists (select 1 from public.farms f where f.organization_id = organizations.id and app.is_member(f.id)));

alter table public.farms enable row level security;
create policy farms_select on public.farms for select to authenticated using (app.is_member(id));
create policy farms_update on public.farms for update to authenticated
  using (app.has_role(id, '{admin}')) with check (app.has_role(id, '{admin}'));

alter table public.farm_members enable row level security;
create policy farm_members_select on public.farm_members for select to authenticated
  using (app.is_member(farm_id));
create policy farm_members_insert on public.farm_members for insert to authenticated
  with check (app.has_role(farm_id, '{admin}'));
create policy farm_members_update on public.farm_members for update to authenticated
  using (app.has_role(farm_id, '{admin}')) with check (app.has_role(farm_id, '{admin}'));
create policy farm_members_delete on public.farm_members for delete to authenticated
  using (app.has_role(farm_id, '{admin}'));
grant delete on public.farm_members to authenticated;

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.farm_members a join public.farm_members b using (farm_id)
    where a.user_id = (select auth.uid()) and b.user_id = profiles.id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 12) التحليلات (Views) — تحترم صلاحيات المستخدم (security_invoker)
-- ---------------------------------------------------------------------

-- إشارة كل مؤشر: +1 اتجاه خضري (فوق المستهدف) | -1 اتجاه ثمري (تحت المستهدف) | 0 داخل النطاق
create or replace function app.balance_signal(val numeric, lo numeric, hi numeric) returns integer
language sql immutable set search_path = '' as $$
  select case
    when val is null or (lo is null and hi is null) then null
    when hi is not null and val > hi then 1
    when lo is not null and val < lo then -1
    else 0 end
$$;

create or replace function app.balance_label(score integer, used integer) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(used, 0) = 0 then 'undetermined'      -- لم تُحدد القيم المستهدفة
    when score >= 2  then 'vegetative'                   -- خضري
    when score = 1   then 'tending_vegetative'           -- مائل للخضري
    when score = 0   then 'balanced'                     -- متوازن
    when score = -1  then 'tending_generative'           -- مائل للثمري
    else 'generative' end                                -- ثمري
$$;

-- (1) القياسات مع الحسابات الأسبوعية لكل نبات
create view public.v_plant_measurements with (security_invoker = true) as
select
  m.*,
  cc.greenhouse_id,
  cc.crop_id,
  cc.variety_id,
  rp.label as plant_label,
  rp.row_no,
  -- سرعة التزهير: عدد العناقيد التي أزهرت أسبوعيًا
  round((m.flowering_truss_no - lag(m.flowering_truss_no) over w)::numeric
        / nullif((m.measured_on - lag(m.measured_on) over w) / 7.0, 0), 2) as flowering_rate_per_week,
  -- الاستطالة محسوبة من فرق الطول (احتياطي لو لم تُدخل مباشرة)
  m.plant_height_cm - lag(m.plant_height_cm) over w as growth_from_height_cm
from public.plant_measurements m
join public.crop_cycles cc     on cc.id = m.crop_cycle_id
join public.reference_plants rp on rp.id = m.reference_plant_id
where m.deleted_at is null
window w as (partition by m.reference_plant_id order by m.measured_on);

-- (2) ملخص أسبوعي لكل دورة/صوبة + تقييم توازن النبات
create view public.v_crop_weekly_summary with (security_invoker = true) as
with wk as (
  select
    farm_id, crop_cycle_id, greenhouse_id, iso_year, iso_week,
    min(measured_on)                                  as week_date,
    count(*)                                          as plants_measured,
    round(avg(coalesce(weekly_growth_cm, growth_from_height_cm)), 1) as avg_weekly_growth_cm,
    round(avg(stem_diameter_mm), 1)                   as avg_stem_diameter_mm,
    round(avg(leaf_count_remaining), 1)               as avg_leaves_remaining,
    round(avg(leaves_removed), 1)                     as avg_leaves_removed,
    round(avg(flowering_truss_no), 1)                 as avg_flowering_truss_no,
    round(avg(flowering_truss_height_cm), 1)          as avg_flowering_height_cm,
    round(avg(flowering_rate_per_week), 2)            as avg_flowering_rate,
    round(avg(open_flowers_count), 1)                 as avg_open_flowers,
    round(avg(fruit_set_pct), 1)                      as avg_fruit_set_pct,
    round(avg(fruits_on_plant), 1)                    as avg_fruits_on_plant,
    round(avg(harvest_truss_no), 1)                   as avg_harvest_truss_no
  from public.v_plant_measurements
  group by farm_id, crop_cycle_id, greenhouse_id, iso_year, iso_week
), sig as (
  select wk.*,
    app.balance_signal(wk.avg_weekly_growth_cm,    t.weekly_growth_min_cm,    t.weekly_growth_max_cm)    as sig_growth,
    app.balance_signal(wk.avg_stem_diameter_mm,    t.stem_diameter_min_mm,    t.stem_diameter_max_mm)    as sig_diameter,
    app.balance_signal(wk.avg_flowering_height_cm, t.flowering_height_min_cm, t.flowering_height_max_cm) as sig_flowering_height
  from wk
  left join lateral (
    select * from public.balance_targets bt
    where bt.crop_cycle_id = wk.crop_cycle_id and bt.deleted_at is null
      and bt.valid_from <= wk.week_date
      and (bt.valid_to is null or bt.valid_to >= wk.week_date)
    order by bt.valid_from desc limit 1
  ) t on true
)
select sig.*,
  coalesce(sig_growth, 0) + coalesce(sig_diameter, 0) + coalesce(sig_flowering_height, 0) as balance_score,
  app.balance_label(
    coalesce(sig_growth, 0) + coalesce(sig_diameter, 0) + coalesce(sig_flowering_height, 0),
    (sig_growth is not null)::int + (sig_diameter is not null)::int + (sig_flowering_height is not null)::int
  ) as balance_status
from sig;

-- (3) ضغط الآفات أسبوعيًا لكل صوبة وآفة
create view public.v_pest_weekly with (security_invoker = true) as
select
  s.farm_id, s.greenhouse_id, s.crop_cycle_id, o.pest_id,
  p.name_ar as pest_name_ar, p.category,
  s.iso_year, s.iso_week,
  min(s.scouted_on)                                  as week_date,
  count(*)                                           as observations,
  max(o.severity)                                    as max_severity,
  round(avg(o.severity), 2)                          as avg_severity,
  count(*) filter (where o.is_hotspot)               as hotspots,
  count(distinct o.row_no)                           as rows_affected,
  sum(o.plants_infested)                             as plants_infested,
  sum(o.plants_inspected)                            as plants_inspected,
  round(100.0 * sum(o.plants_infested) / nullif(sum(o.plants_inspected), 0), 1) as incidence_pct,
  round(avg(o.count_value) filter (where o.method = 'sticky_trap'), 1) as avg_trap_count
from public.scouting_observations o
join public.scouting_sessions s on s.id = o.session_id
join public.pests p              on p.id = o.pest_id
where o.deleted_at is null and s.deleted_at is null
group by s.farm_id, s.greenhouse_id, s.crop_cycle_id, o.pest_id, p.name_ar, p.category, s.iso_year, s.iso_week;

-- (4) سجل المعاملات المفصّل مع تاريخ السماح بالحصاد (فترة الأمان)
create view public.v_activity_log with (security_invoker = true) as
select
  a.farm_id, a.id as activity_id, a.activity_type, a.method, a.performed_on, a.iso_year, a.iso_week,
  ag.greenhouse_id, ag.crop_cycle_id, ag.rows_scope,
  ot.name_ar as operation_name_ar,
  pr.name as product_name, pr.product_type, pr.active_ingredient, pr.moa_code, pr.bio_species,
  ap.dose, ap.dose_unit, ap.total_quantity, ap.total_unit,
  a.water_volume_l, a.target_pest_id, a.performed_by_name, a.notes,
  pr.phi_days,
  case when pr.phi_days is not null then a.performed_on + pr.phi_days end as harvest_allowed_from
from public.activities a
join public.activity_greenhouses ag on ag.activity_id = a.id and ag.deleted_at is null
left join public.activity_products ap on ap.activity_id = a.id and ap.deleted_at is null
left join public.products pr on pr.id = ap.product_id
left join public.operation_types ot on ot.id = a.operation_type_id
where a.deleted_at is null;

-- (5) حالة فترة الأمان لكل صوبة: متى يُسمح بالحصاد؟
create view public.v_greenhouse_phi_status with (security_invoker = true) as
select farm_id, greenhouse_id,
       max(harvest_allowed_from) as harvest_allowed_from,
       max(harvest_allowed_from) > current_date as harvest_blocked_today
from public.v_activity_log
where harvest_allowed_from is not null
group by farm_id, greenhouse_id;

-- (6) عدد الرشات لكل مجموعة طريقة تأثير (IRAC/FRAC) — لإدارة المقاومة
create view public.v_spray_moa_counts with (security_invoker = true) as
select farm_id, greenhouse_id, crop_cycle_id, moa_code, product_type,
       count(distinct activity_id) as applications,
       min(performed_on) as first_on, max(performed_on) as last_on
from public.v_activity_log
where activity_type in ('chemical_spray', 'fertigation_injection') and moa_code is not null
group by farm_id, greenhouse_id, crop_cycle_id, moa_code, product_type;

grant select on all tables in schema public to authenticated;   -- يشمل الـ views
revoke all on all tables in schema public from anon;             -- Supabase يمنح anon صلاحيات افتراضية على الـ views الجديدة

-- =====================================================================
-- ملاحظات المزامنة (للتطبيق):
--  * Push: التابلت يرسل السجلات بـ upsert (on conflict (id) do update).
--    المفاتيح الأجنبية DEFERRABLE فيمكن إرسال دفعة كاملة بأي ترتيب داخل transaction واحدة.
--  * Pull: select ... where server_updated_at > :last_cursor - interval '2 minutes'
--    (هامش أمان لعمليات متزامنة)، ثم upsert محليًا — العملية idempotent.
--  * الحذف: update ... set deleted_at = now() فيصل لكل الأجهزة في السحب التالي.
--  * التعارض: آخر تعديل يكسب على مستوى السجل (Last-write-wins)، والقياسات
--    أغلبها إضافة فقط فاحتمال التعارض ضعيف.
-- =====================================================================
