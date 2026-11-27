-- =====================================================================
--  Migration 017 — أكثر من سمة (دور) للعضو الواحد في المشروع
--  role = الدور الأساسي (كما كان)، extra_roles = أدوار إضافية. الصلاحية = اتحاد كل الأدوار.
--  admin لا يكون دورًا إضافيًا أبدًا (مدير النظام جدول منفصل).
-- =====================================================================
alter table public.farm_members
  add column if not exists extra_roles public.member_role[] not null default '{}';
alter table public.farm_members drop constraint if exists farm_members_extra_roles_chk;
alter table public.farm_members add constraint farm_members_extra_roles_chk
  check (not ('admin' = any (extra_roles)) and not (role = any (extra_roles)));

alter table public.farm_invitations
  add column if not exists extra_roles public.member_role[] not null default '{}';
alter table public.farm_invitations drop constraint if exists farm_invitations_extra_roles_chk;
alter table public.farm_invitations add constraint farm_invitations_extra_roles_chk
  check (not ('admin' = any (extra_roles)) and not (role = any (extra_roles)));

comment on column public.farm_members.extra_roles is 'أدوار إضافية للعضو (بخلاف role). الصلاحيات = اتحاد الدور الأساسي والإضافية';

-- كل أدوار المستخدم الحالي في مشروع (الأساسي + الإضافية)
create or replace function app.member_roles(p_farm uuid) returns public.member_role[]
language sql stable security definer set search_path = '' as $$
  select array[role] || extra_roles from public.farm_members
  where farm_id = p_farm and user_id = auth.uid()
$$;

create or replace function app.has_role(p_farm uuid, p_roles public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce('admin' = any (app.member_roles(p_farm)) or app.member_roles(p_farm) && p_roles, false)
$$;

create or replace function app.can_read_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce(
           app.member_roles(p_farm) is not null
           and (p_domain = 'general' or exists (
                 select 1 from unnest(app.member_roles(p_farm)) r where p_domain = any (app.role_read_domains(r)))),
           false)
$$;

create or replace function app.can_write_domain(p_farm uuid, p_domain text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (p_domain is not null and app.is_system_admin())
      or coalesce(exists (
           select 1 from unnest(app.member_roles(p_farm)) r
           where r <> 'executive' and (p_domain = 'general' or p_domain = any (app.role_write_domains(r)))),
         false)
$$;

-- عضو لديه دور واحد على الأقل غير «متابعة فقط»
create or replace function app.has_write_role(p_farm uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(exists (select 1 from unnest(app.member_roles(p_farm)) r where r <> 'executive'), false)
$$;
revoke execute on function app.member_roles(uuid), app.has_write_role(uuid) from public, anon;
grant execute on function app.member_roles(uuid), app.has_write_role(uuid) to authenticated;

alter policy purchase_requests_insert on public.purchase_requests
  with check (app.has_write_role(farm_id) or app.is_system_admin());

-- تفعيل الدعوة ينقل الأدوار الإضافية أيضًا
create or replace function app.apply_invitations(p_user uuid, p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.farm_members (farm_id, user_id, role, extra_roles)
  select i.farm_id, p_user, i.role, i.extra_roles
  from public.farm_invitations i
  where i.email = lower(btrim(p_email)) and i.accepted_at is null
  on conflict (farm_id, user_id) do update set role = excluded.role, extra_roles = excluded.extra_roles;

  update public.farm_invitations
     set accepted_at = now(), accepted_user_id = p_user
   where email = lower(btrim(p_email)) and accepted_at is null;
end $$;
