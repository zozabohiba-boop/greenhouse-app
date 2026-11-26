-- =====================================================================
--  014 — أدوار المخازن والمشتريات (لازم تتثبت قبل 015)
--    storekeeper = أمين المخزن: الاستلام والصرف والجرد ووزن الحصاد
--    purchasing  = مسؤول المشتريات: طلبات الشراء ومتابعتها
-- =====================================================================
alter type public.member_role add value if not exists 'storekeeper';
alter type public.member_role add value if not exists 'purchasing';
