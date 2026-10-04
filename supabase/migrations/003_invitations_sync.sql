-- =====================================================================
--  Migration 003 — الدعوات، وقت السيرفر للمزامنة، فهارس الأداء
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) دعوات الانضمام للمزرعة
--    المدير يضيف إيميل + دور، وأول ما الشخص يسجّل (أو لو مسجّل بالفعل)
--    يتضاف للمزرعة بالدور ده تلقائيًا.
-- ---------------------------------------------------------------------
create table public.farm_invitations (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms(id) on delete cascade,
  email            text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  role             public.member_role not null,
  invited_by       uuid references auth.users(id) default auth.uid(),
  accepted_at      timestamptz,
  accepted_user_id uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  unique (farm_id, email)
);
comment on table public.farm_invitations is 'دعوات الانضمام: الإيميل يتربط بالمزرعة تلقائيًا عند التسجيل';

-- تفعيل الدعوات المعلّقة لمستخدم معيّن
create or replace function app.apply_invitations(p_user uuid, p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.farm_members (farm_id, user_id, role)
  select i.farm_id, p_user, i.role
  from public.farm_invitations i
  where i.email = lower(btrim(p_email)) and i.accepted_at is null
  on conflict (farm_id, user_id) do update set role = excluded.role;

  update public.farm_invitations
     set accepted_at = now(), accepted_user_id = p_user
   where email = lower(btrim(p_email)) and accepted_at is null;
end $$;

-- عند تسجيل مستخدم جديد: profile + تفعيل دعواته
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  if new.email is not null then
    perform app.apply_invitations(new.id, new.email);
  end if;
  return new;
end $$;

-- عند إضافة دعوة لشخص مسجّل بالفعل: تتفعّل فورًا
create or replace function app.on_invitation_created() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = new.email limit 1;
  if v_user is not null then
    perform app.apply_invitations(v_user, new.email);
  end if;
  return null;
end $$;

create trigger farm_invitations_apply
  after insert on public.farm_invitations
  for each row execute function app.on_invitation_created();

revoke execute on function app.apply_invitations(uuid, text) from public, authenticated;
revoke execute on function app.on_invitation_created() from public, authenticated;
revoke execute on function app.handle_new_user() from public, authenticated;

alter table public.farm_invitations enable row level security;
-- admin يدعو بأي دور، ومدير المزرعة يدعو بأي دور ما عدا admin
create policy farm_invitations_select on public.farm_invitations for select to authenticated
  using (app.has_role(farm_id, '{admin,farm_manager}'));
create policy farm_invitations_insert on public.farm_invitations for insert to authenticated
  with check (app.has_role(farm_id, '{admin}')
              or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));
create policy farm_invitations_update on public.farm_invitations for update to authenticated
  using (app.has_role(farm_id, '{admin}')
         or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'))
  with check (app.has_role(farm_id, '{admin}')
              or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));
create policy farm_invitations_delete on public.farm_invitations for delete to authenticated
  using (app.has_role(farm_id, '{admin}')
         or (app.has_role(farm_id, '{farm_manager}') and role <> 'admin'));
grant select, insert, update, delete on public.farm_invitations to authenticated;
revoke all on public.farm_invitations from anon;

-- ---------------------------------------------------------------------
-- 2) وقت السيرفر — يستخدمه التابلت كمؤشر مزامنة موثوق
--    (ساعة التابلت ممكن تكون غلط، ساعة السيرفر لأ)
-- ---------------------------------------------------------------------
create or replace function public.server_now() returns timestamptz
language sql stable set search_path = '' as $$ select now() $$;
revoke execute on function public.server_now() from public, anon;
grant execute on function public.server_now() to authenticated;

-- ---------------------------------------------------------------------
-- 3) فهارس لكل المفاتيح الأجنبية اللي ملهاش فهرس (أداء الـ joins والـ RLS)
-- ---------------------------------------------------------------------
do $$
declare
  r record;
  v_cols text;
  v_name text;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname, c.conrelid, c.conkey
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f' and n.nspname = 'public'
  loop
    -- هل يوجد فهرس يبدأ بنفس أعمدة المفتاح الأجنبي؟
    if not exists (
      select 1 from pg_index i
      where i.indrelid = r.conrelid
        and (string_to_array(i.indkey::text, ' ')::int2[])[1:array_length(r.conkey, 1)] = r.conkey
    ) then
      select string_agg(quote_ident(a.attname), ', ' order by k.ord)
        into v_cols
      from unnest(r.conkey) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = r.conrelid and a.attnum = k.attnum;
      v_name := left(r.conname, 55) || '_idx';
      execute format('create index if not exists %I on %s (%s)', v_name, r.tbl, v_cols);
    end if;
  end loop;
end $$;
