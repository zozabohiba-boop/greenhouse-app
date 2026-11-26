insert into auth.users(id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@test.local', '{"full_name":"مدير الاختبار"}'),
 ('bbbbbbbb-0000-0000-0000-000000000002', 'scout@test.local', '{"full_name":"مهندس الفحص"}'),
 ('bbbbbbbb-0000-0000-0000-000000000003', 'ops@test.local',   '{"full_name":"مهندس العمليات"}'),
 ('bbbbbbbb-0000-0000-0000-000000000004', 'irr@test.local',   '{"full_name":"مهندس الري"}'),
 ('bbbbbbbb-0000-0000-0000-000000000005', 'manager@test.local', '{"full_name":"مدير الشركة"}'),
 ('bbbbbbbb-0000-0000-0000-000000000006', 'store@test.local', '{"full_name":"أمين المخزن"}');
insert into organizations(id, name) values ('cccccccc-0000-0000-0000-000000000001', 'Plantology');
insert into farms(id, organization_id, name) values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'المزرعة الرئيسية');
-- مدير النظام فوق كل المشاريع (من غير عضوية)
insert into system_admins(user_id) values ('aaaaaaaa-0000-0000-0000-000000000001');
insert into farm_invitations(farm_id, email, role) values
 ('dddddddd-0000-0000-0000-000000000001', 'scout@test.local', 'scout'),
 ('dddddddd-0000-0000-0000-000000000001', 'ops@test.local', 'operations'),
 ('dddddddd-0000-0000-0000-000000000001', 'irr@test.local', 'irrigation'),
 ('dddddddd-0000-0000-0000-000000000001', 'manager@test.local', 'farm_manager'),
 ('dddddddd-0000-0000-0000-000000000001', 'store@test.local', 'storekeeper');

-- للاختبار فقط: محاكاة إنشاء حساب من Edge Function (team-admin)
create or replace function public.e2e_create_user(p_email text, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values (v, lower(p_email), case when p_name is null then '{}'::jsonb else jsonb_build_object('full_name', p_name) end);
  return v;
end $$;
revoke execute on function public.e2e_create_user(text, text) from public, anon, authenticated;
grant execute on function public.e2e_create_user(text, text) to service_role;
