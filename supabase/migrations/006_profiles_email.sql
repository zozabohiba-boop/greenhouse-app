-- =====================================================================
--  Migration 006 — إيميل المستخدم في profiles (لعرض فريق العمل داخل التطبيق)
-- =====================================================================
alter table public.profiles add column if not exists email text;

update public.profiles p set email = lower(u.email)
from auth.users u where u.id = p.id and p.email is null;

create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', lower(new.email))
  on conflict (id) do update set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  if new.email is not null then
    perform app.apply_invitations(new.id, new.email);
  end if;
  return new;
end $$;
revoke execute on function app.handle_new_user() from public, authenticated;

-- المستخدم يعدّل اسمه وتليفونه فقط — الإيميل يتبع حساب الدخول
revoke update on public.profiles from authenticated;
grant update (full_name, phone, preferred_language, updated_at) on public.profiles to authenticated;
