-- =====================================================================
--  Migration 008 — إغلاق التوصية تلقائيًا عند تنفيذها
--  لما يسجّل أي مهندس معاملة مرتبطة بتوصية (activities.recommendation_id)
--  تتحول التوصية إلى "نُفّذت" على السيرفر — بدون ما نحتاج نعطي الكشاف
--  صلاحية تعديل التوصيات نفسها.
-- =====================================================================

create or replace function app.close_recommendation_on_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.recommendation_id is not null and new.deleted_at is null then
    update public.recommendations
       set status = 'done',
           resolved_at = coalesce(resolved_at, now()),
           updated_at = now()
     where id = new.recommendation_id
       and farm_id = new.farm_id
       and status in ('open', 'in_progress');
  end if;
  return null;
end $$;

create trigger activities_close_recommendation
  after insert or update of recommendation_id, deleted_at on public.activities
  for each row execute function app.close_recommendation_on_activity();

revoke execute on function app.close_recommendation_on_activity() from public, anon, authenticated;
