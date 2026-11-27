-- استشاري المشروع = نفس صلاحيات مدير الشركة (كل فحص دور farm_manager يعدّيه الاستشاري)
create or replace function app.has_role(p_farm uuid, p_roles public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_system_admin()
      or coalesce('admin' = any (app.member_roles(p_farm))
                  or app.member_roles(p_farm) && p_roles
                  or ('consultant' = any (app.member_roles(p_farm)) and 'farm_manager' = any (p_roles)), false)
$$;
