insert into auth.users(id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@test.local', '{"full_name":"مدير الاختبار"}'),
 ('bbbbbbbb-0000-0000-0000-000000000002', 'scout@test.local', '{"full_name":"مهندس الفحص"}');
insert into organizations(id, name) values ('cccccccc-0000-0000-0000-000000000001', 'Plantology');
insert into farms(id, organization_id, name) values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'المزرعة الرئيسية');
insert into farm_invitations(farm_id, email, role) values
 ('dddddddd-0000-0000-0000-000000000001', 'admin@test.local', 'admin'),
 ('dddddddd-0000-0000-0000-000000000001', 'scout@test.local', 'scout');
