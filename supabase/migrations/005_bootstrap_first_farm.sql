-- =====================================================================
--  005 — تأسيس أول شركة ومزرعة + دعوة مدير النظام
--  (بيانات، مش هيكل) — عدّل القيم في قسم الإعدادات قبل التنفيذ
--  لو الإيميل مسجّل بالفعل يتضاف فورًا، ولو لأ يتضاف أول ما يسجّل
-- =====================================================================
do $$
declare
  -- ===== الإعدادات =====
  v_admin_email text := 'zozabohiba@gmail.com';
  v_org_name    text := 'Plantology';
  v_farm_name   text := 'المزرعة الرئيسية';
  -- =====================
  v_org  uuid;
  v_farm uuid;
begin
  select id into v_org from public.organizations where name = v_org_name and deleted_at is null limit 1;
  if v_org is null then
    insert into public.organizations (name) values (v_org_name) returning id into v_org;
  end if;

  select id into v_farm from public.farms where organization_id = v_org and name = v_farm_name and deleted_at is null limit 1;
  if v_farm is null then
    insert into public.farms (organization_id, name) values (v_org, v_farm_name) returning id into v_farm;
  end if;

  insert into public.farm_invitations (farm_id, email, role)
  values (v_farm, lower(v_admin_email), 'admin')
  on conflict (farm_id, email) do nothing;
end $$;

select o.name as organization, f.name as farm, i.email, i.role,
       case when i.accepted_at is null then 'في انتظار التسجيل' else 'مفعّل' end as status
from public.farm_invitations i
join public.farms f on f.id = i.farm_id
join public.organizations o on o.id = f.organization_id;
