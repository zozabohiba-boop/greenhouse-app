-- لوجو الشركة لكل مشروع: صورة صغيرة (data URL) تنزل مع بيانات المشروع وتعمل أوفلاين
alter table public.farms add column if not exists logo_data text;
alter table public.farms drop constraint if exists farms_logo_data_chk;
alter table public.farms add constraint farms_logo_data_chk
  check (logo_data is null or (logo_data like 'data:image/%' and length(logo_data) <= 200000));
comment on column public.farms.logo_data is 'لوجو الشركة (data:image/*) يظهر مكان لوجو التطبيق داخل المشروع';
