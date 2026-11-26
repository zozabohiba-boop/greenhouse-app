-- =====================================================================
--  015 — المخازن والمشتريات والحصاد + سجل المبيدات التنظيمي + بيانات تنفيذ العمليات
--
--  المجالات بعد هذه الخطوة:
--    ipm | fertigation | operations | store (المخزن والحصاد) | purchasing (المشتريات)
--  القراءة والكتابة لكل دور:
--    scout       يقرأ/يكتب ipm
--    irrigation  يقرأ/يكتب fertigation
--    operations  يقرأ/يكتب operations
--    storekeeper يقرأ store + purchasing، ويكتب store
--    purchasing  يقرأ purchasing + store، ويكتب purchasing
--    executive   يقرأ الكل ولا يكتب
--    باقي الأدوار (مدير/استشاري/مشرف) تقرأ وتكتب الكل
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) المجالات: قراءة وكتابة منفصلتين
-- ---------------------------------------------------------------------
create or replace function app.role_read_domains(p_role public.member_role) returns text[]
language sql immutable set search_path = '' as $$
  select case p_role
    when 'scout'       then array['ipm']
    when 'irrigation'  then array['fertigation']
    when 'operations'  then array['operations']
    when 'storekeeper' then array['store', 'purchasing']
    when 'purchasing'  then array['purchasing', 'store']
    else array['ipm', 'fertigation', 'operations', 'store', 'purchasing']
  end
$$;

create or replace function app.role_write_domains(p_role public.member_role) returns text[]
language sql immutable set search_path = '' as $$
  select case p_role
    when 'scout'       then array['ipm']
    when 'irrigation'  then array['fertigation']
    when 'operations'  then array['operations']
    when 'storekeeper' then array['store']
    when 'purchasing'  then array['purchasing']
    when 'executive'   then array[]::text[]
    else array['ipm', 'fertigation', 'operations', 'store', 'purchasing']
  end
$$;

create or replace function app.role_domains(p_role public.member_role) returns text[]
language sql immutable set search_path = '' as $$
  select app.role_read_domains(p_role)
$$;

create or replace function app.can_read_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce(
           app.member_role(p_farm) is not null
           and (p_domain = 'general' or p_domain = any (app.role_read_domains(app.member_role(p_farm)))),
           false)
$$;

create or replace function app.can_write_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (p_domain is not null and app.is_system_admin())
      or coalesce(
           app.member_role(p_farm) <> 'executive'
           and (p_domain = 'general' or p_domain = any (app.role_write_domains(app.member_role(p_farm)))),
           false)
$$;

-- مرفقات الحصاد والمخزن
alter table public.attachments drop constraint if exists attachments_entity_table_check;
alter table public.attachments add constraint attachments_entity_table_check check (entity_table in
  ('scouting_observations', 'plant_measurements', 'activities', 'recommendations', 'greenhouses', 'crop_cycles',
   'harvest_records', 'stock_movements', 'purchase_requests'));

-- ---------------------------------------------------------------------
-- 2) تنفيذ العمليات: العمالة وجودة التنفيذ
-- ---------------------------------------------------------------------
alter table public.activities
  add column if not exists workers_count smallint check (workers_count is null or workers_count between 0 and 2000),
  add column if not exists labor_hours   numeric(8,1) check (labor_hours is null or labor_hours >= 0),
  add column if not exists quality       smallint check (quality is null or quality between 1 and 4);
comment on column public.activities.workers_count is 'عدد العمال المنفذين';
comment on column public.activities.labor_hours   is 'إجمالي ساعات العمل (عامل × ساعة)';
comment on column public.activities.quality       is 'جودة التنفيذ: 1 ضعيف، 2 مقبول، 3 جيد، 4 ممتاز';

-- ---------------------------------------------------------------------
-- 3) المخازن
-- ---------------------------------------------------------------------
create table if not exists public.warehouses (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  name              text not null check (length(btrim(name)) between 1 and 80),
  kind              text not null default 'general'
                      check (kind in ('general', 'pesticides', 'fertilizers', 'supplies', 'harvest', 'fuel')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id)
);
comment on table public.warehouses is 'مخازن المشروع: مبيدات، أسمدة، مستلزمات، ثلاجة الحصاد…';

-- إعدادات الصنف داخل المشروع: وحدة التخزين وحد إعادة الطلب
create table if not exists public.stock_items (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  product_id        uuid not null references public.products(id),
  stock_unit        text not null default 'كجم',
  min_qty           numeric(12,3) check (min_qty is null or min_qty >= 0),
  default_warehouse_id uuid,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  foreign key (default_warehouse_id, farm_id) references public.warehouses (id, farm_id) deferrable initially deferred
);
create unique index if not exists stock_items_uq on public.stock_items (farm_id, product_id) where deleted_at is null;

create table if not exists public.purchase_requests (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  request_no        text,
  requested_on      date not null default current_date,
  needed_by         date,
  priority          public.priority_level not null default 'normal',
  status            text not null default 'submitted'
                      check (status in ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'partially_received', 'received', 'cancelled')),
  supplier          text,
  approved_by       uuid references auth.users(id),
  approved_at       timestamptz,
  decision_note     text,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  unique (id, farm_id)
);
comment on table public.purchase_requests is 'طلبات الشراء: تُقدَّم ← يعتمدها مدير المشروع ← تُطلب ← تُستلم';

create table if not exists public.purchase_request_items (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null,
  request_id        uuid not null,
  product_id        uuid references public.products(id),
  item_name         text,
  qty               numeric(12,3) not null check (qty > 0),
  unit              text not null default 'كجم',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  check (product_id is not null or length(btrim(coalesce(item_name, ''))) > 0),
  foreign key (request_id, farm_id) references public.purchase_requests (id, farm_id) deferrable initially deferred
);
create index if not exists purchase_request_items_req_idx on public.purchase_request_items (request_id);

create table if not exists public.stock_movements (
  id                  uuid primary key default gen_random_uuid(),
  farm_id             uuid not null references public.farms(id),
  warehouse_id        uuid not null,
  product_id          uuid not null references public.products(id),
  movement_type       text not null check (movement_type in
                        ('receipt', 'issue', 'return', 'adjust_in', 'adjust_out', 'transfer_in', 'transfer_out')),
  direction           smallint generated always as (
                        case when movement_type in ('receipt', 'return', 'adjust_in', 'transfer_in') then 1 else -1 end) stored,
  qty                 numeric(12,3) not null check (qty > 0),
  unit                text not null,
  moved_on            date not null default current_date,
  batch_no            text,
  expiry_date         date,
  supplier            text,
  document_no         text,
  unit_price          numeric(12,2) check (unit_price is null or unit_price >= 0),
  purchase_request_id uuid,
  activity_id         uuid,
  greenhouse_id       uuid,
  issued_to           text,
  transfer_group      uuid,
  notes               text,
  device_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  server_updated_at   timestamptz not null default now(),
  deleted_at          timestamptz,
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id),
  foreign key (warehouse_id, farm_id)        references public.warehouses (id, farm_id)        deferrable initially deferred,
  foreign key (purchase_request_id, farm_id) references public.purchase_requests (id, farm_id) deferrable initially deferred,
  foreign key (activity_id, farm_id)         references public.activities (id, farm_id)        deferrable initially deferred,
  foreign key (greenhouse_id, farm_id)       references public.greenhouses (id, farm_id)       deferrable initially deferred
);
create index if not exists stock_movements_item_idx on public.stock_movements (farm_id, product_id, warehouse_id);
comment on table public.stock_movements is 'حركات المخزن: استلام، صرف، مرتجع، تسوية جرد، تحويل — الرصيد = مجموع (الكمية × الاتجاه)';

-- ---------------------------------------------------------------------
-- 4) الحصاد
-- ---------------------------------------------------------------------
create table if not exists public.harvest_records (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id),
  greenhouse_id     uuid not null,
  crop_cycle_id     uuid,
  harvested_on      date not null default current_date,
  iso_year          smallint generated always as (extract(isoyear from harvested_on)::smallint) stored,
  iso_week          smallint generated always as (extract(week    from harvested_on)::smallint) stored,
  grade             text not null default 'first' check (grade in ('export', 'first', 'second', 'local', 'cull')),
  weight_kg         numeric(10,2) not null check (weight_kg > 0),
  boxes_count       integer check (boxes_count is null or boxes_count >= 0),
  warehouse_id      uuid,
  phi_warning       boolean not null default false,
  notes             text,
  device_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  foreign key (greenhouse_id, farm_id) references public.greenhouses (id, farm_id) deferrable initially deferred,
  foreign key (crop_cycle_id, farm_id) references public.crop_cycles (id, farm_id) deferrable initially deferred,
  foreign key (warehouse_id, farm_id)  references public.warehouses (id, farm_id)  deferrable initially deferred
);
create index if not exists harvest_records_gh_idx on public.harvest_records (farm_id, greenhouse_id, harvested_on);
comment on table public.harvest_records is 'وزن الحصاد لكل صوبة ودرجة — phi_warning: اتحصد والصوبة في فترة أمان';

-- ---------------------------------------------------------------------
-- 5) سجل المبيدات التنظيمي: المواد الفعالة وحدود المتبقيات لكل سوق
-- ---------------------------------------------------------------------
create table if not exists public.active_substances (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),     -- null = عام
  name_en           text not null,
  name_ar           text,
  cas_no            text,
  classes           text[] not null default '{}',
  moa_system        text check (moa_system in ('IRAC', 'FRAC', 'HRAC')),
  moa_code          text,
  chemical_group    text,
  eu_status         text not null default 'unknown' check (eu_status in ('approved', 'not_approved', 'pending', 'unknown')),
  eu_expiry         date,
  eu_cfs            boolean,
  eg_registered     boolean,
  notes             text,
  source_url        text,
  reviewed_on       date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
create unique index if not exists active_substances_name_uq
  on public.active_substances (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name_en));
comment on table public.active_substances is 'المواد الفعالة: مجموعة المقاومة وحالة الاعتماد في الاتحاد الأوروبي والتسجيل في مصر';

create table if not exists public.substance_limits (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),
  substance_id      uuid not null references public.active_substances(id),
  market            text not null check (market in ('EU', 'CODEX', 'US', 'UK', 'JP', 'CN', 'GCC', 'RU', 'EG')),
  crop_code         text not null,
  mrl_mg_kg         numeric(10,4) check (mrl_mg_kg is null or mrl_mg_kg >= 0),
  default_loq       boolean not null default false,
  phi_days          smallint check (phi_days is null or phi_days >= 0),
  source_url        text,
  retrieved_on      date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
create unique index if not exists substance_limits_uq
  on public.substance_limits (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), substance_id, market, crop_code)
  where deleted_at is null;
comment on table public.substance_limits is 'الحد الأقصى للمتبقيات (MRL) وفترة الأمان المطلوبة لكل سوق تصدير ومحصول';

create table if not exists public.product_actives (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid references public.farms(id),
  product_id        uuid not null references public.products(id),
  substance_id      uuid not null references public.active_substances(id),
  concentration     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);
create unique index if not exists product_actives_uq on public.product_actives (product_id, substance_id) where deleted_at is null;
comment on table public.product_actives is 'المواد الفعالة في كل منتج تجاري (يدعم المخاليط)';

alter table public.products
  add column if not exists eg_reg_no text,
  add column if not exists eg_registered_crops text;
comment on column public.products.eg_reg_no is 'رقم التسجيل لدى لجنة مبيدات الآفات الزراعية';

alter table public.farm_profiles
  add column if not exists export_markets text[] not null default '{}';
comment on column public.farm_profiles.export_markets is 'أسواق التصدير المستهدفة (EU, UK, GCC, RU, US, JP …) لفحص المتبقيات';

-- ---------------------------------------------------------------------
-- 6) المزامنة والصلاحيات للجداول الجديدة
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['warehouses', 'stock_items', 'purchase_requests', 'purchase_request_items',
                           'stock_movements', 'harvest_records', 'active_substances', 'substance_limits', 'product_actives']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function app.touch_row()',
                   t || '_touch', t);
    execute format('create index if not exists %I on public.%I (server_updated_at, id)', t || '_sync_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke delete, truncate on public.%I from authenticated', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;

-- المخزن والحصاد: مجال store
do $$
declare t text;
begin
  foreach t in array array['warehouses', 'stock_items', 'stock_movements', 'harvest_records']
  loop
    execute format($p$create policy %1$I on public.%2$I for select to authenticated
                     using (app.can_read_domain(farm_id, 'store'))$p$, t || '_select', t);
    execute format($p$create policy %1$I on public.%2$I for insert to authenticated
                     with check (app.can_write_domain(farm_id, 'store'))$p$, t || '_insert', t);
    execute format($p$create policy %1$I on public.%2$I for update to authenticated
                     using (app.has_role(farm_id, '{farm_manager}')
                            or (app.can_write_domain(farm_id, 'store')
                                and (created_by = (select auth.uid()) or %3$L in ('warehouses', 'stock_items'))))
                     with check (app.has_role(farm_id, '{farm_manager}') or app.can_write_domain(farm_id, 'store'))$p$,
                   t || '_update', t, t);
  end loop;
end $$;

-- طلبات الشراء: أي عضو يسجّل يقدر يقدّم طلب، والمشتريات/المخزن يشوفوا الكل، والاعتماد لمدير المشروع
create or replace function app.pr_visible(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.purchase_requests r
                  where r.id = p_request
                    and (app.can_read_domain(r.farm_id, 'purchasing') or r.created_by = auth.uid()))
$$;
create or replace function app.pr_editable(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.purchase_requests r
                  where r.id = p_request
                    and (app.has_role(r.farm_id, '{farm_manager,purchasing}')
                         or (r.created_by = auth.uid() and r.status in ('draft', 'submitted'))))
$$;

create policy purchase_requests_select on public.purchase_requests for select to authenticated
  using (app.can_read_domain(farm_id, 'purchasing') or created_by = (select auth.uid()));
create policy purchase_requests_insert on public.purchase_requests for insert to authenticated
  with check (app.member_role(farm_id) <> 'executive' or app.is_system_admin());
create policy purchase_requests_update on public.purchase_requests for update to authenticated
  using (app.has_role(farm_id, '{farm_manager,purchasing,storekeeper}')
         or (created_by = (select auth.uid()) and status in ('draft', 'submitted')))
  with check (app.has_role(farm_id, '{farm_manager,purchasing,storekeeper}') or created_by = (select auth.uid()));

create policy purchase_request_items_select on public.purchase_request_items for select to authenticated
  using (app.pr_visible(request_id));
create policy purchase_request_items_insert on public.purchase_request_items for insert to authenticated
  with check (app.pr_editable(request_id) or exists (
    select 1 from public.purchase_requests r where r.id = request_id and r.created_by = (select auth.uid())));
create policy purchase_request_items_update on public.purchase_request_items for update to authenticated
  using (app.pr_editable(request_id)) with check (app.pr_editable(request_id));

-- الاعتماد/الرفض لمدير المشروع فقط، والاستلام لأمين المخزن أو المشتريات
create or replace function app.purchase_request_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('approved', 'rejected') and not app.has_role(new.farm_id, '{farm_manager}') then
      raise exception 'اعتماد أو رفض طلب الشراء من صلاحية مدير المشروع' using errcode = '42501';
    end if;
    if new.status in ('ordered', 'partially_received', 'received')
       and not app.has_role(new.farm_id, '{farm_manager,purchasing,storekeeper}') then
      raise exception 'تحديث حالة الشراء من صلاحية المشتريات أو المخزن' using errcode = '42501';
    end if;
    if new.status in ('approved', 'rejected') then
      new.approved_by := auth.uid();
      new.approved_at := now();
    end if;
  end if;
  return new;
end $$;
create trigger purchase_requests_guard before update on public.purchase_requests
  for each row execute function app.purchase_request_guard();
revoke execute on function app.purchase_request_guard() from public, anon, authenticated;

-- سجل المبيدات: العام لمدير النظام، والخاص بالمشروع للمدير والاستشاري
do $$
declare t text;
begin
  foreach t in array array['active_substances', 'substance_limits', 'product_actives']
  loop
    execute format($p$create policy %1$I on public.%2$I for select to authenticated
                     using (farm_id is null or app.is_member(farm_id))$p$, t || '_select', t);
    execute format($p$create policy %1$I on public.%2$I for insert to authenticated
                     with check ((farm_id is null and app.is_system_admin())
                              or (farm_id is not null and app.has_role(farm_id, '{farm_manager,consultant}')))$p$, t || '_insert', t);
    execute format($p$create policy %1$I on public.%2$I for update to authenticated
                     using ((farm_id is null and app.is_system_admin())
                         or (farm_id is not null and app.has_role(farm_id, '{farm_manager,consultant}')))
                     with check ((farm_id is null and app.is_system_admin())
                         or (farm_id is not null and app.has_role(farm_id, '{farm_manager,consultant}')))$p$, t || '_update', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7) اللوحة العامة: إضافة الحصاد والمخزون تحت حد الطلب للمدير
-- ---------------------------------------------------------------------
create or replace function public.store_balances(p_farm uuid) returns table (
  product_id uuid, warehouse_id uuid, balance numeric, unit text, nearest_expiry date
)
language sql stable security definer set search_path = '' as $$
  select m.product_id, m.warehouse_id, sum(m.qty * m.direction) as balance, max(m.unit) as unit,
         min(m.expiry_date) filter (where m.direction = 1 and m.expiry_date is not null) as nearest_expiry
    from public.stock_movements m
   where m.farm_id = p_farm and m.deleted_at is null
     and (app.can_read_domain(p_farm, 'store') or app.can_read_domain(p_farm, 'purchasing'))
   group by m.product_id, m.warehouse_id
$$;
revoke execute on function public.store_balances(uuid) from public, anon;
grant execute on function public.store_balances(uuid) to authenticated;
