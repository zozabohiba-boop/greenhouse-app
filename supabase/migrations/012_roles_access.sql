-- =====================================================================
--  012 — هيكل الصلاحيات الجديد ("لكل مقام مقال")
--
--  1) مدير النظام (system_admins): فوق كل المشاريع — يشوف ويعدّل كل شيء
--     في كل المشاريع، الحالية والجديدة، من غير ما يكون عضو فيها.
--  2) داخل كل مشروع:
--       farm_manager = مدير الشركة/المشروع: صلاحية كاملة على مشروعه فقط
--       consultant   = استشاري المشروع: كل البيانات + التوصيات + الهيكل
--       supervisor   = مهندس مشرف/منفذ: يسجّل في كل المجالات (سجلاته فقط)
--       scout        = مهندس مكافحة وفحص    → مجال ipm
--       irrigation   = مهندس ري وتسميد      → مجال fertigation
--       operations   = مهندس عمليات زراعية  → مجال operations
--       executive    = متابعة فقط (قراءة)
--     المهندس المتخصص يقرأ ويسجّل في مجاله فقط، ويعدّل سجلاته هو فقط،
--     ويشوف لوحة عامة للمزرعة (farm_overview) للقراءة فقط.
--  3) admin داخل مشروع (قديم) = صلاحية كاملة على ذلك المشروع — لا يُمنح بعد الآن.
--  4) طلبات "نسيت كلمة المرور" تصل لمديري المشروع ومديري النظام.
--  5) تصنيف المواد (كبرى/صغرى) product_categories.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) مديرو النظام
-- ---------------------------------------------------------------------
create table if not exists public.system_admins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
comment on table public.system_admins is 'مديرو النظام: صلاحية كاملة على كل المشاريع';
create trigger system_admins_touch before insert or update on public.system_admins
  for each row execute function app.touch_row();
create index if not exists system_admins_sync_idx on public.system_admins (server_updated_at, id);

-- كل من كان "admin" في أي مشروع يصبح مدير نظام
insert into public.system_admins (user_id)
select distinct m.user_id from public.farm_members m where m.role = 'admin'
on conflict (user_id) do nothing;

create or replace function app.is_system_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.system_admins
                 where user_id = auth.uid() and deleted_at is null)
$$;

create or replace function app.is_member(p_farm uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or exists (select 1 from public.farm_members
                 where farm_id = p_farm and user_id = auth.uid())
$$;

-- مدير النظام وadmin المشروع (القديم) يعدّيان أي فحص دور
create or replace function app.has_role(p_farm uuid, p_roles public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce(app.member_role(p_farm) = 'admin' or app.member_role(p_farm) = any (p_roles), false)
$$;

-- ---------------------------------------------------------------------
-- 2) المجالات: ipm (مكافحة) | fertigation (ري وتسميد) | operations (عمليات) | general
-- ---------------------------------------------------------------------
create or replace function app.role_domains(p_role public.member_role) returns text[]
language sql immutable set search_path = '' as $$
  select case p_role
    when 'scout'      then array['ipm']
    when 'irrigation' then array['fertigation']
    when 'operations' then array['operations']
    else array['ipm', 'fertigation', 'operations']
  end
$$;

create or replace function app.can_read_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce(
           app.member_role(p_farm) is not null
           and (p_domain = 'general' or p_domain = any (app.role_domains(app.member_role(p_farm)))),
           false)
$$;

create or replace function app.can_write_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (p_domain is not null and app.is_system_admin())
      or coalesce(
           app.member_role(p_farm) <> 'executive'
           and (p_domain = 'general' or p_domain = any (app.role_domains(app.member_role(p_farm)))),
           false)
$$;

-- مجال المعاملة يُشتق من نوعها
alter table public.activities
  add column if not exists domain text generated always as (
    case activity_type
      when 'chemical_spray'        then 'ipm'
      when 'bio_release'           then 'ipm'
      when 'fertigation_injection' then 'fertigation'
      when 'foliar_nutrition'      then 'fertigation'
      else 'operations'
    end) stored;

create or replace function app.activity_domain(p_activity uuid) returns text
language sql stable security definer set search_path = '' as $$
  select domain from public.activities where id = p_activity
$$;

-- مجال التوصية: عامة أو موجهة لمجال
alter table public.recommendations
  add column if not exists domain text not null default 'general'
    check (domain in ('general', 'ipm', 'fertigation', 'operations'));
comment on column public.recommendations.domain is 'المجال المسؤول عن التنفيذ: general/ipm/fertigation/operations';

create or replace function app.entity_domain(p_table text, p_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case p_table
    when 'scouting_observations' then 'ipm'
    when 'plant_measurements'    then 'operations'
    when 'activities'            then (select domain from public.activities where id = p_id)
    when 'recommendations'       then (select domain from public.recommendations where id = p_id)
    else 'general'
  end
$$;

-- ---------------------------------------------------------------------
-- 3) سياسات البيانات الميدانية حسب المجال
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select * from (values
      ('scouting_sessions',          $d$'ipm'$d$),
      ('scouting_observations',      $d$'ipm'$d$),
      ('crop_registration_sessions', $d$'operations'$d$),
      ('plant_measurements',         $d$'operations'$d$),
      ('activities',                 $d$domain$d$),
      ('activity_greenhouses',       $d$app.activity_domain(activity_id)$d$),
      ('activity_products',          $d$app.activity_domain(activity_id)$d$),
      ('attachments',                $d$app.entity_domain(entity_table, entity_id)$d$)
    ) v(t, d)
  loop
    execute format('alter policy %I on public.%I using (app.can_read_domain(farm_id, %s))',
                   r.t || '_select', r.t, r.d);
    execute format('alter policy %I on public.%I with check (app.can_write_domain(farm_id, %s))',
                   r.t || '_insert', r.t, r.d);
    execute format($p$alter policy %1$I on public.%2$I
                     using (app.has_role(farm_id, '{farm_manager}')
                            or (created_by = (select auth.uid()) and app.can_write_domain(farm_id, %3$s)))
                     with check (app.has_role(farm_id, '{farm_manager}')
                            or (created_by = (select auth.uid()) and app.can_write_domain(farm_id, %3$s)))$p$,
                   r.t || '_update', r.t, r.d);
  end loop;
end $$;

-- التوصيات: يكتبها مدير النظام/مدير المشروع/الاستشاري، ويشوفها كل مهندس في مجاله
alter policy recommendations_select on public.recommendations
  using (app.can_read_domain(farm_id, domain));
alter policy recommendations_insert on public.recommendations
  with check (app.has_role(farm_id, '{farm_manager,consultant}'));

-- الملفات والتقارير: يقرأها كل أعضاء المشروع، ويرفعها كل من يسجّل
alter policy documents_insert on public.documents
  with check (app.has_role(farm_id, '{farm_manager,consultant,supervisor,scout,irrigation,operations}'));
alter policy documents_update on public.documents
  using (app.has_role(farm_id, '{farm_manager}')
         or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,supervisor,scout,irrigation,operations}')))
  with check (app.has_role(farm_id, '{farm_manager}')
         or (created_by = (select auth.uid()) and app.has_role(farm_id, '{consultant,supervisor,scout,irrigation,operations}')));

-- ---------------------------------------------------------------------
-- 4) الكتالوجات: العام يعدّله مدير النظام فقط، والخاص بالمشروع يضيفه من يسجّل
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select * from (values
      ('products',        '{farm_manager,consultant,supervisor,scout,irrigation,operations}'),
      ('operation_types', '{farm_manager,consultant,supervisor,scout,irrigation,operations}'),
      ('pests',           '{farm_manager,consultant,supervisor,scout}'),
      ('varieties',       '{farm_manager,consultant}'),
      ('pest_controls',   '{farm_manager,consultant}')
    ) v(t, roles)
  loop
    execute format($p$alter policy %1$I on public.%2$I with check (
                       (farm_id is null and app.is_system_admin())
                    or (farm_id is not null and app.has_role(farm_id, %3$L)))$p$,
                   r.t || '_insert', r.t, r.roles);
    execute format($p$alter policy %1$I on public.%2$I
                     using ((farm_id is null and app.is_system_admin())
                         or (farm_id is not null and (app.has_role(farm_id, '{farm_manager,consultant}')
                             or (created_by = (select auth.uid()) and app.has_role(farm_id, %3$L)))))
                     with check ((farm_id is null and app.is_system_admin())
                         or (farm_id is not null and (app.has_role(farm_id, '{farm_manager,consultant}')
                             or (created_by = (select auth.uid()) and app.has_role(farm_id, %3$L)))))$p$,
                   r.t || '_update', r.t, r.roles);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5) المشروع وفريقه
-- ---------------------------------------------------------------------
alter policy farms_update on public.farms
  using (app.has_role(id, '{farm_manager}')) with check (app.has_role(id, '{farm_manager}'));

alter policy farm_members_insert on public.farm_members
  with check (app.has_role(farm_id, '{admin}') or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));
alter policy farm_members_update on public.farm_members
  using (app.has_role(farm_id, '{admin}') or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'))
  with check (app.has_role(farm_id, '{admin}') or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));
alter policy farm_members_delete on public.farm_members
  using (app.has_role(farm_id, '{admin}') or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));

alter policy profiles_select on public.profiles
  using (id = (select auth.uid())
         or app.is_system_admin()
         or exists (select 1 from public.farm_members a join public.farm_members b using (farm_id)
                    where a.user_id = (select auth.uid()) and b.user_id = profiles.id));

-- مديرو النظام: كل مستخدم يعرف هل هو مدير نظام، ومديرو النظام يشوفوا بعض
alter table public.system_admins enable row level security;
create policy system_admins_select on public.system_admins for select to authenticated
  using (user_id = (select auth.uid()) or app.is_system_admin());
revoke all on public.system_admins from anon;
revoke insert, update, delete, truncate on public.system_admins from authenticated;
grant select on public.system_admins to authenticated;

-- الصور والملفات في التخزين: كل من يسجّل يرفع
alter policy field_photos_insert on storage.objects
  with check (bucket_id = 'field-photos'
              and app.has_role(app.try_uuid((storage.foldername(name))[1]),
                               '{farm_manager,consultant,supervisor,scout,irrigation,operations}'));
alter policy farm_files_insert on storage.objects
  with check (bucket_id = 'farm-files'
              and app.has_role(app.try_uuid((storage.foldername(name))[1]),
                               '{farm_manager,consultant,supervisor,scout,irrigation,operations}'));

-- إنشاء مشروع جديد: لمديري النظام فقط (والمشروع يظهر لكل مديري النظام تلقائيًا)
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
  if not app.is_system_admin() then
    raise exception 'إنشاء مشروع جديد متاح لمدير النظام فقط' using errcode = '42501';
  end if;
  if length(v_name) = 0 or length(v_name) > 120 then
    raise exception 'اسم المشروع مطلوب' using errcode = '23514';
  end if;
  select f.organization_id into v_org from public.farms f
   where f.deleted_at is null order by f.created_at limit 1;
  if v_org is null then
    insert into public.organizations (name) values ('Greenhouse Assistant') returning id into v_org;
  end if;
  insert into public.farms (organization_id, name, location_text)
  values (v_org, v_name, nullif(btrim(coalesce(p_location, '')), ''))
  returning id into v_farm;
  return v_farm;
end $$;
revoke execute on function public.create_farm(text, text) from public, anon;
grant execute on function public.create_farm(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) نسيت كلمة المرور: الطلب يوصل لمديري المشروع ومديري النظام
-- ---------------------------------------------------------------------
create table if not exists public.password_reset_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  user_id      uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id)
);
create index if not exists password_reset_requests_open_idx
  on public.password_reset_requests (email) where resolved_at is null;
alter table public.password_reset_requests enable row level security;
create policy password_reset_requests_select on public.password_reset_requests for select to authenticated
  using (resolved_at is null and user_id is not null and (
           app.is_system_admin()
        or (not exists (select 1 from public.system_admins s where s.user_id = password_reset_requests.user_id and s.deleted_at is null)
            and exists (select 1 from public.farm_members m
                         where m.user_id = password_reset_requests.user_id
                           and m.role <> 'admin'
                           and app.has_role(m.farm_id, '{farm_manager}')))));
revoke all on public.password_reset_requests from anon;
revoke insert, update, delete, truncate on public.password_reset_requests from authenticated;
grant select on public.password_reset_requests to authenticated;

-- يُستدعى من شاشة الدخول بدون تسجيل؛ لا يكشف هل الإيميل مسجّل أم لا
create or replace function public.request_password_reset(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_user  uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    return;
  end if;
  -- حماية من الإغراق: طلب واحد مفتوح لكل إيميل كل 15 دقيقة، وحد عام بالساعة
  if exists (select 1 from public.password_reset_requests
              where email = v_email and resolved_at is null and created_at > now() - interval '15 minutes') then
    return;
  end if;
  if (select count(*) from public.password_reset_requests where created_at > now() - interval '1 hour') >= 100 then
    return;
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = v_email limit 1;
  insert into public.password_reset_requests (email, user_id) values (v_email, v_user);
end $$;
revoke execute on function public.request_password_reset(text) from public;
grant execute on function public.request_password_reset(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) اللوحة العامة للمزرعة (للقراءة فقط) — أرقام مجمّعة لكل صوبة
--    يشوفها كل أعضاء المشروع حتى لو مجالهم محدود، بدون تفاصيل السجلات
-- ---------------------------------------------------------------------
create or replace function public.farm_overview(p_farm uuid, p_date date default current_date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_start date := date_trunc('week', p_date)::date;
  v_end   date := date_trunc('week', p_date)::date + 6;
  v_out   jsonb;
begin
  if not app.is_member(p_farm) then
    raise exception 'غير مصرح' using errcode = '42501';
  end if;

  with gh as (
    select g.id from public.greenhouses g where g.farm_id = p_farm and g.deleted_at is null
  ), sess as (
    select s.id, s.greenhouse_id from public.scouting_sessions s
     where s.farm_id = p_farm and s.deleted_at is null and s.scouted_on between v_start and v_end
  ), obs as (
    select ss.greenhouse_id, o.pest_id, o.severity from public.scouting_observations o
      join sess ss on ss.id = o.session_id where o.deleted_at is null
  ), cyc as (
    select c.id, c.greenhouse_id from public.crop_cycles c
     where c.farm_id = p_farm and c.deleted_at is null and c.status <> 'finished'
  ), reg as (
    select distinct r.crop_cycle_id from public.crop_registration_sessions r
     where r.farm_id = p_farm and r.deleted_at is null and r.measured_on between v_start and v_end
  ), bal as (
    select distinct on (w.crop_cycle_id) w.crop_cycle_id, w.greenhouse_id, w.balance_status, w.iso_year, w.iso_week
      from public.v_crop_weekly_summary w
      join cyc on cyc.id = w.crop_cycle_id
     order by w.crop_cycle_id, w.iso_year desc, w.iso_week desc
  ), phi as (
    select ag.greenhouse_id, max(a.performed_on + pr.phi_days) as harvest_allowed_from
      from public.activities a
      join public.activity_greenhouses ag on ag.activity_id = a.id and ag.deleted_at is null
      join public.activity_products ap on ap.activity_id = a.id and ap.deleted_at is null
      join public.products pr on pr.id = ap.product_id
     where a.farm_id = p_farm and a.deleted_at is null and pr.phi_days is not null
     group by ag.greenhouse_id
  ), acts as (
    select ag.greenhouse_id, a.domain, max(a.performed_on) as last_on,
           count(*) filter (where a.performed_on between v_start and v_end) as this_week
      from public.activities a
      join public.activity_greenhouses ag on ag.activity_id = a.id and ag.deleted_at is null
     where a.farm_id = p_farm and a.deleted_at is null
     group by ag.greenhouse_id, a.domain
  ), recs as (
    select greenhouse_id, domain, count(*) as n from public.recommendations
     where farm_id = p_farm and deleted_at is null and status in ('open', 'in_progress')
     group by greenhouse_id, domain
  )
  select jsonb_build_object(
    'farm_id', p_farm,
    'week_start', v_start,
    'generated_at', now(),
    'totals', jsonb_build_object(
      'greenhouses',   (select count(*) from gh),
      'active_cycles', (select count(*) from cyc),
      'scouted',       (select count(distinct greenhouse_id) from sess),
      'registered',    (select count(*) from reg),
      'worst',         coalesce((select max(severity) from obs), 0),
      'in_phi',        (select count(*) from phi where harvest_allowed_from > p_date),
      'activities_week', coalesce((select jsonb_object_agg(domain, n) from
                          (select domain, sum(this_week) as n from acts group by domain) x), '{}'::jsonb),
      'open_recs',     coalesce((select jsonb_object_agg(domain, n) from
                          (select domain, sum(n) as n from recs group by domain) x), '{}'::jsonb)
    ),
    'top_pests', coalesce((
      select jsonb_agg(t order by t.greenhouses desc, t.worst desc) from (
        select p.name_ar as name, max(o.severity) as worst, count(distinct o.greenhouse_id) as greenhouses
          from obs o join public.pests p on p.id = o.pest_id
         where o.severity > 0
         group by p.name_ar
         order by count(distinct o.greenhouse_id) desc, max(o.severity) desc
         limit 6) t), '[]'::jsonb),
    'greenhouses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'scouted', exists (select 1 from sess where sess.greenhouse_id = g.id),
        'worst', coalesce((select max(severity) from obs where obs.greenhouse_id = g.id), 0),
        'has_cycle', exists (select 1 from cyc where cyc.greenhouse_id = g.id),
        'registered', exists (select 1 from cyc join reg on reg.crop_cycle_id = cyc.id where cyc.greenhouse_id = g.id),
        'balance', (select bal.balance_status from bal where bal.greenhouse_id = g.id limit 1),
        'harvest_allowed_from', (select phi.harvest_allowed_from from phi where phi.greenhouse_id = g.id and phi.harvest_allowed_from > p_date),
        'last', coalesce((select jsonb_object_agg(acts.domain, acts.last_on) from acts where acts.greenhouse_id = g.id), '{}'::jsonb),
        'open_recs', coalesce((select sum(n) from recs where recs.greenhouse_id = g.id), 0)
      )) from gh g), '[]'::jsonb)
  ) into v_out;
  return v_out;
end $$;
revoke execute on function public.farm_overview(uuid, date) from public, anon;
grant execute on function public.farm_overview(uuid, date) to authenticated;

-- ---------------------------------------------------------------------
-- 8) تصنيف المواد: فئة كبرى ← فئة صغرى (عام أو خاص بمشروع)
-- ---------------------------------------------------------------------
create table if not exists public.product_categories (
  id                   uuid primary key default gen_random_uuid(),
  farm_id              uuid references public.farms(id),
  parent_id            uuid references public.product_categories(id),
  code                 text not null,
  name_ar              text not null check (length(btrim(name_ar)) between 1 and 120),
  name_en              text,
  domain               text not null check (domain in ('fertigation', 'ipm', 'operations')),
  default_product_type public.product_type,
  is_bio               boolean not null default false,
  sort_order           smallint not null default 100,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  server_updated_at    timestamptz not null default now(),
  deleted_at           timestamptz,
  created_by           uuid references auth.users(id),
  updated_by           uuid references auth.users(id)
);
create unique index if not exists product_categories_code_uq
  on public.product_categories (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
create index if not exists product_categories_sync_idx on public.product_categories (server_updated_at, id);
comment on table public.product_categories is 'التصنيف العلمي للمواد: فئة كبرى (parent_id null) ← فئة صغرى';
create trigger product_categories_touch before insert or update on public.product_categories
  for each row execute function app.touch_row();

alter table public.product_categories enable row level security;
create policy product_categories_select on public.product_categories for select to authenticated
  using (farm_id is null or app.is_member(farm_id));
create policy product_categories_insert on public.product_categories for insert to authenticated
  with check ((farm_id is null and app.is_system_admin())
           or (farm_id is not null and app.has_role(farm_id, '{farm_manager,consultant,supervisor,scout,irrigation,operations}')));
create policy product_categories_update on public.product_categories for update to authenticated
  using ((farm_id is null and app.is_system_admin())
      or (farm_id is not null and (app.has_role(farm_id, '{farm_manager,consultant}')
          or (created_by = (select auth.uid()) and app.has_role(farm_id, '{supervisor,scout,irrigation,operations}')))))
  with check ((farm_id is null and app.is_system_admin())
      or (farm_id is not null and (app.has_role(farm_id, '{farm_manager,consultant}')
          or (created_by = (select auth.uid()) and app.has_role(farm_id, '{supervisor,scout,irrigation,operations}')))));
revoke all on public.product_categories from anon;
revoke delete, truncate on public.product_categories from authenticated;
grant select, insert, update on public.product_categories to authenticated;

alter table public.products
  add column if not exists category_id uuid references public.product_categories(id);
create index if not exists products_category_idx on public.products (category_id);
comment on column public.products.category_id is 'الفئة الصغرى في التصنيف العلمي';
