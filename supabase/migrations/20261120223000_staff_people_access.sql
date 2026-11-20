-- Front desk can read and update patient requests for their doctor's office only.
-- Phone and email stay on the request row. This does not copy them anywhere else.
-- Apply before merge. Do not run this from the app. Not applied to production.

begin;

create or replace function public.office_doctor_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.id
  from public.doctors d
  where d.user_id = auth.uid()
  union
  select d.id
  from public.kpi_office_members m
  join public.doctors d on d.user_id = m.office_user_id
  where m.member_user_id = auth.uid()
    and m.status = 'active'
$$;

revoke all on function public.office_doctor_ids() from public, anon;
grant execute on function public.office_doctor_ids() to authenticated;

drop policy if exists community_visits_staff_select on public.community_visit_requests;
create policy community_visits_staff_select
  on public.community_visit_requests
  for select
  to authenticated
  using (doctor_id in (select public.office_doctor_ids()));

drop policy if exists community_visits_staff_update on public.community_visit_requests;
create policy community_visits_staff_update
  on public.community_visit_requests
  for update
  to authenticated
  using (doctor_id in (select public.office_doctor_ids()))
  with check (doctor_id in (select public.office_doctor_ids()));

drop policy if exists doctor_request_pipeline_staff on public.doctor_request_pipeline;
create policy doctor_request_pipeline_staff
  on public.doctor_request_pipeline
  for all
  to authenticated
  using (doctor_id in (select public.office_doctor_ids()))
  with check (doctor_id in (select public.office_doctor_ids()));

drop policy if exists doctor_request_stage_events_staff_select on public.doctor_request_stage_events;
create policy doctor_request_stage_events_staff_select
  on public.doctor_request_stage_events
  for select
  to authenticated
  using (doctor_id in (select public.office_doctor_ids()));

drop policy if exists doctor_request_stage_events_staff_insert on public.doctor_request_stage_events;
create policy doctor_request_stage_events_staff_insert
  on public.doctor_request_stage_events
  for insert
  to authenticated
  with check (doctor_id in (select public.office_doctor_ids()));

commit;
