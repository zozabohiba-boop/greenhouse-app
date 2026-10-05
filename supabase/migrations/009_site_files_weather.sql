-- =====================================================================
--  Migration 009 — هيكل الموقع، بيانات الموقع، الملفات، الطقس، مواقع متعددة
--  1) farm_zones     : تقسيم الموقع لمستويات (قطاع ← قطعة ← صف ...) بعمق حر
--  2) greenhouses    : كل صوبة تتبع مكانًا في الهيكل (zone_id) والكود فريد داخل مكانه
--  3) farm_profiles  : بيانات الموقع (المالك، الإحداثيات، المياه، التربة ...)
--  4) documents      : ملفات وتقارير (PDF / Word / Excel / PowerPoint) — bucket farm-files
--  5) weather_cache  : آخر توقع طقس لكل موقع (تكتبه دالة weather فقط)
--  6) create_farm()  : مدير النظام ينشئ موقعًا جديدًا ويصبح مديره
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) هيكل الموقع
-- ---------------------------------------------------------------------
create table public.farm_zones (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  parent_id         uuid,
  kind              text not null default 'sector'
                    check (kind in ('sector', 'plot', 'block', 'row', 'other')),
  name              text not null check (length(btrim(name)) between 1 and 80),
  sort_order        integer not null default 100,
  area_m2           numeric(12,1) check (area_m2 > 0),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id),
  foreign key (parent_id, farm_id) references public.farm_zones (id, farm_id)
    deferrable initially deferred
);
create index on public.farm_zones (farm_id);
create index on public.farm_zones (parent_id);
create unique index farm_zones_name_uq on public.farm_zones
  (farm_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)))
  where deleted_at is null;
comment on table public.farm_zones is
  'تقسيم الموقع: sector قطاع | plot قطعة | block بلوك | row صف | other — شجرة بعمق حر (حد أقصى 8 مستويات)';

-- منع الحلقات (مكان داخل نفسه) والعمق الزائد
create or replace function app.farm_zone_guard() returns trigger
language plpgsql set search_path = '' as $$
declare
  cur   uuid := new.parent_id;
  depth integer := 1;
begin
  while cur is not null loop
    if cur = new.id then
      raise exception 'لا يمكن وضع المكان داخل نفسه' using errcode = '23514';
    end if;
    depth := depth + 1;
    if depth > 8 then
      raise exception 'الهيكل أعمق من 8 مستويات' using errcode = '23514';
    end if;
    select z.parent_id into cur from public.farm_zones z where z.id = cur;
  end loop;
  return new;
end $$;

create trigger farm_zones_guard before insert or update of parent_id on public.farm_zones
  for each row execute function app.farm_zone_guard();

-- ---------------------------------------------------------------------
-- 2) الصوبة تتبع مكانًا — والكود فريد داخل نفس المكان
-- ---------------------------------------------------------------------
alter table public.greenhouses add column zone_id uuid;
alter table public.greenhouses add constraint greenhouses_zone_fk
  foreign key (zone_id, farm_id) references public.farm_zones (id, farm_id)
  deferrable initially deferred;
create index on public.greenhouses (zone_id);
drop index if exists public.greenhouses_code_uq;
create unique index greenhouses_code_uq on public.greenhouses
  (farm_id, coalesce(zone_id, '00000000-0000-0000-0000-000000000000'::uuid), code)
  where deleted_at is null;

-- ---------------------------------------------------------------------
-- 3) بيانات الموقع (سجل واحد لكل مزرعة: id = farm_id)
-- ---------------------------------------------------------------------
create table public.farm_profiles (
  id                     uuid primary key references public.farms(id),
  farm_id                uuid not null unique references public.farms(id) check (farm_id = id),
  owner_name             text,
  manager_name           text,
  contact_phone          text,
  address                text,
  latitude               numeric(9,6) check (latitude between -90 and 90),
  longitude              numeric(9,6) check (longitude between -180 and 180),
  elevation_m            numeric(7,1),
  total_area_feddan      numeric(10,2) check (total_area_feddan > 0),
  water_source           text,
  water_ec_ds_m          numeric(5,2) check (water_ec_ds_m >= 0 and water_ec_ds_m < 60),
  water_ph               numeric(4,2) check (water_ph between 0 and 14),
  soil_type              text,
  irrigation_system      text,
  climate_control        text,
  cover_transmission_pct smallint not null default 70 check (cover_transmission_pct between 20 and 100),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  server_updated_at      timestamptz not null default now(),
  deleted_at             timestamptz,
  created_by             uuid references auth.users(id),
  updated_by             uuid references auth.users(id),
  check ((latitude is null) = (longitude is null))
);
comment on table public.farm_profiles is 'بيانات الموقع وإحداثياته (للطقس) — سجل واحد لكل مزرعة';

-- ---------------------------------------------------------------------
-- 4) الملفات والتقارير
-- ---------------------------------------------------------------------
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  zone_id           uuid,
  greenhouse_id     uuid,
  category          text not null default 'other' check (category in
                      ('visit_report', 'soil_analysis', 'water_analysis', 'plant_analysis',
                       'fertigation_program', 'spray_program', 'climate', 'drawing',
                       'presentation', 'contract', 'other')),
  title             text not null check (length(btrim(title)) between 1 and 200),
  file_name         text not null,
  mime_type         text,
  size_bytes        bigint check (size_bytes >= 0),
  storage_path      text not null,           -- داخل bucket farm-files: <farm_id>/<yyyy>/<uuid>.<ext>
  doc_date          date,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  foreign key (zone_id, farm_id) references public.farm_zones (id, farm_id) deferrable initially deferred,
  foreign key (greenhouse_id, farm_id) references public.greenhouses (id, farm_id) deferrable initially deferred
);
create index on public.documents (farm_id);
create index on public.documents (greenhouse_id);
create index on public.documents (zone_id);
comment on table public.documents is 'ملفات الموقع: تقارير، تحاليل، برامج تسميد ومكافحة، عروض — الملف نفسه في Storage';

-- ---------------------------------------------------------------------
-- 5) تريجر المزامنة + فهرس المزامنة + الصلاحيات للجداول الجديدة
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['farm_zones', 'farm_profiles', 'documents'] loop
    execute format('create trigger %I before insert or update on public.%I
                    for each row execute function app.touch_row()', t || '_touch', t);
    execute format('create index %I on public.%I (server_updated_at)', t || '_sync_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (app.is_member(farm_id))$p$, t || '_select', t);
  end loop;

  -- الهيكل وبيانات الموقع: مثل هيكل المزرعة (المدير والاستشاري)
  foreach t in array array['farm_zones', 'farm_profiles'] loop
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check (app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using (app.has_role(farm_id, '{admin,farm_manager,consultant}'))
                     with check (app.has_role(farm_id, '{admin,farm_manager,consultant}'))$p$, t || '_update', t);
  end loop;
end $$;

-- الملفات: يرفعها أي عضو ميداني، ويعدّلها صاحبها أو المدير
create policy documents_insert on public.documents for insert to authenticated
  with check (app.has_role(farm_id, '{admin,farm_manager,consultant,scout}'));
create policy documents_update on public.documents for update to authenticated
  using (app.has_role(farm_id, '{admin,farm_manager}')
         or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,scout}')))
  with check (app.has_role(farm_id, '{admin,farm_manager}')
         or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,scout}')));

grant select, insert, update on public.farm_zones, public.farm_profiles, public.documents to authenticated;
revoke delete, truncate on public.farm_zones, public.farm_profiles, public.documents from authenticated;
revoke all on public.farm_zones, public.farm_profiles, public.documents from anon;

-- ---------------------------------------------------------------------
-- 6) تخزين الملفات: bucket خاص، 50 ميجا للملف (حد الخطة المجانية)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('farm-files', 'farm-files', false, 52428800, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv', 'text/plain',
  'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy farm_files_select on storage.objects for select to authenticated
  using (bucket_id = 'farm-files'
         and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy farm_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'farm-files'
              and app.has_role(app.try_uuid((storage.foldername(name))[1]),
                               '{admin,farm_manager,consultant,scout}'));

create policy farm_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'farm-files'
         and app.has_role(app.try_uuid((storage.foldername(name))[1]), '{admin,farm_manager}'));

-- ---------------------------------------------------------------------
-- 7) ذاكرة توقعات الطقس — للقراءة فقط من التطبيق، تكتبها دالة weather
-- ---------------------------------------------------------------------
create table public.weather_cache (
  farm_id    uuid primary key references public.farms(id) on delete cascade,
  latitude   numeric(9,6) not null,
  longitude  numeric(9,6) not null,
  fetched_at timestamptz not null default now(),
  payload    jsonb not null
);
alter table public.weather_cache enable row level security;
create policy weather_cache_select on public.weather_cache for select to authenticated
  using (app.is_member(farm_id));
revoke insert, update, delete, truncate on public.weather_cache from authenticated, anon;
revoke all on public.weather_cache from anon;

-- ---------------------------------------------------------------------
-- 8) إنشاء موقع جديد (لمدير النظام فقط) — داخل نفس الشركة
-- ---------------------------------------------------------------------
create or replace function public.create_farm(p_name text, p_location text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_org  uuid;
  v_farm uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select f.organization_id into v_org
    from public.farm_members m
    join public.farms f on f.id = m.farm_id
   where m.user_id = auth.uid() and m.role = 'admin' and f.deleted_at is null
   order by m.created_at
   limit 1;
  if v_org is null then
    raise exception 'إنشاء موقع جديد متاح لمدير النظام فقط' using errcode = '42501';
  end if;
  if length(v_name) = 0 or length(v_name) > 120 then
    raise exception 'اسم الموقع مطلوب' using errcode = '23514';
  end if;
  insert into public.farms (organization_id, name, location_text)
  values (v_org, v_name, nullif(btrim(coalesce(p_location, '')), ''))
  returning id into v_farm;
  insert into public.farm_members (farm_id, user_id, role) values (v_farm, auth.uid(), 'admin');
  return v_farm;
end $$;
revoke execute on function public.create_farm(text, text) from public, anon;
grant execute on function public.create_farm(text, text) to authenticated;

revoke execute on function app.farm_zone_guard() from public, anon, authenticated;
