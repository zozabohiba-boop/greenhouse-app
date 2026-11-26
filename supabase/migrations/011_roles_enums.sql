-- =====================================================================
--  011 — قيم جديدة للأنواع الثابتة (لازم تتنفذ وتتثبت قبل 012)
--  * أدوار المهندسين المتخصصين داخل المشروع:
--      scout       = مهندس مكافحة وفحص (موجود من قبل — تغيّر معناه فقط)
--      irrigation  = مهندس ري وتسميد
--      operations  = مهندس عمليات زراعية وخدمة أرضية
--      supervisor  = مهندس مشرف / منفذ (كل المجالات، بدون إدارة الفريق أو الهيكل)
--  * نوع معاملة جديد: تغذية ورقية (من مجال الري والتسميد)
--  * فئة عمليات جديدة: الخدمة الأرضية وتجهيز التربة
-- =====================================================================
alter type public.member_role add value if not exists 'irrigation';
alter type public.member_role add value if not exists 'operations';
alter type public.member_role add value if not exists 'supervisor';

alter type public.activity_type add value if not exists 'foliar_nutrition';

alter type public.operation_category add value if not exists 'land_preparation';
