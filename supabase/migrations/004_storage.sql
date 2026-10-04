-- =====================================================================
--  Migration 004 — تخزين صور الإصابات والنباتات (Supabase Storage)
--  bucket خاص (غير عام)، والمسار: <farm_id>/<yyyy>/<uuid>.jpg
--  كل عضو يشوف صور مزرعته فقط
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('field-photos', 'field-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create or replace function app.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;

create policy field_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'field-photos'
         and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy field_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'field-photos'
              and app.has_role(app.try_uuid((storage.foldername(name))[1]),
                               '{admin,farm_manager,consultant,scout}'));

create policy field_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'field-photos'
         and app.has_role(app.try_uuid((storage.foldername(name))[1]), '{admin,farm_manager}'))
  with check (bucket_id = 'field-photos'
         and app.has_role(app.try_uuid((storage.foldername(name))[1]), '{admin,farm_manager}'));

create policy field_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'field-photos'
         and app.has_role(app.try_uuid((storage.foldername(name))[1]), '{admin,farm_manager}'));
