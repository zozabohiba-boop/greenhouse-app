-- =====================================================================
--  Migration 007 — دالة تفعيل الدعوة لإيميل مسجّل بالفعل (تستدعيها Edge Function team-admin فقط)
-- =====================================================================
create or replace function public.apply_invitation_for_email(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
  if v_user is not null then
    perform app.apply_invitations(v_user, p_email);
  end if;
end $$;
revoke execute on function public.apply_invitation_for_email(text) from public, anon, authenticated;
grant execute on function public.apply_invitation_for_email(text) to service_role;
