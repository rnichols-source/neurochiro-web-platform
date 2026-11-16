-- analytics_events.doctor_id referenced profiles(id). Profile buttons send
-- doctors.id, which is never a profile id, so every insert failed the
-- foreign key and the route reported success anyway. Point the column at
-- doctors.id and keep the existing rows by rewriting each profile id to
-- that doctor's row. profile_views on doctors is unchanged.
--
-- visitor_key lets a profile_view be stored once per visitor per doctor
-- per UTC day. Clicks leave it null.

alter table public.analytics_events
  add column if not exists visitor_key text;

do $$
begin
  if exists (
    select 1
    from public.analytics_events e
    where (
      select count(*)
      from public.doctors d
      where d.id = e.doctor_id or d.user_id = e.doctor_id
    ) <> 1
  ) then
    raise exception 'analytics_events.doctor_id does not match exactly one doctor';
  end if;
end $$;

alter table public.analytics_events
  drop constraint if exists analytics_events_doctor_id_fkey;

update public.analytics_events e
set doctor_id = d.id
from public.doctors d
where d.user_id = e.doctor_id
  and not exists (
    select 1 from public.doctors existing where existing.id = e.doctor_id
  );

alter table public.analytics_events
  add constraint analytics_events_doctor_id_fkey
  foreign key (doctor_id) references public.doctors(id) on delete cascade;

create unique index if not exists analytics_events_profile_view_visitor_day
  on public.analytics_events (
    doctor_id,
    visitor_key,
    ((timezone('utc', created_at))::date)
  )
  where event_type = 'profile_view' and visitor_key is not null;

alter table public.analytics_events
  drop constraint if exists analytics_events_profile_view_visitor;

alter table public.analytics_events
  add constraint analytics_events_profile_view_visitor
  check (event_type <> 'profile_view' or visitor_key is not null);
