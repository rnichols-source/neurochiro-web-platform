-- How often a home plan or home remedy was sent, and remedy check-ins.
-- Plan and remedy wording stays in the app. This file stores a weekly pace
-- and which days a remedy was marked done. It does not store health details.
-- Apply this file in the Supabase SQL editor before merging. Do not run it from the app.
-- It was not applied to production.

begin;

alter table public.community_exercise_assignments
  add column if not exists times_per_week smallint;

alter table public.community_exercise_assignments
  drop constraint if exists community_exercise_times_per_week_check;

alter table public.community_exercise_assignments
  add constraint community_exercise_times_per_week_check
  check (times_per_week is null or times_per_week between 1 and 7);

alter table public.community_doctor_care_invites
  add column if not exists times_per_week smallint;

alter table public.community_doctor_care_invites
  drop constraint if exists community_doctor_care_invites_times_per_week_check;

alter table public.community_doctor_care_invites
  add constraint community_doctor_care_invites_times_per_week_check
  check (times_per_week is null or times_per_week between 1 and 7);

create table if not exists public.community_remedy_recommendations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  email text,
  remedy_key text not null,
  times_per_week smallint not null default 3,
  opened_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint community_remedy_recommendations_key_len check (char_length(remedy_key) between 3 and 120),
  constraint community_remedy_recommendations_times_check check (times_per_week between 1 and 7),
  constraint community_remedy_recommendations_status_check check (status in ('active', 'ended')),
  constraint community_remedy_recommendations_email_len check (email is null or char_length(email) between 3 and 320),
  constraint community_remedy_recommendations_who_check check (profile_id is not null or email is not null)
);

create index if not exists community_remedy_recommendations_doctor_idx
  on public.community_remedy_recommendations (doctor_id, created_at desc);

create unique index if not exists community_remedy_recommendations_profile_active
  on public.community_remedy_recommendations (doctor_id, profile_id, remedy_key)
  where profile_id is not null and status = 'active';

create table if not exists public.community_remedy_checkins (
  recommendation_id uuid not null references public.community_remedy_recommendations(id) on delete cascade,
  checked_on date not null,
  primary key (recommendation_id, checked_on)
);

alter table public.community_remedy_recommendations enable row level security;
alter table public.community_remedy_checkins enable row level security;

revoke all on table public.community_remedy_recommendations from public, anon;
revoke all on table public.community_remedy_checkins from public, anon;

grant select on table public.community_remedy_recommendations to authenticated;
grant select, insert on table public.community_remedy_checkins to authenticated;

drop policy if exists community_remedy_recommendations_owner_select on public.community_remedy_recommendations;
create policy community_remedy_recommendations_owner_select
  on public.community_remedy_recommendations
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists community_remedy_recommendations_doctor_select on public.community_remedy_recommendations;
create policy community_remedy_recommendations_doctor_select
  on public.community_remedy_recommendations
  for select
  to authenticated
  using (
    exists (select 1 from public.doctors where id = doctor_id and user_id = auth.uid())
  );

drop policy if exists community_remedy_checkins_owner_select on public.community_remedy_checkins;
create policy community_remedy_checkins_owner_select
  on public.community_remedy_checkins
  for select
  to authenticated
  using (
    recommendation_id in (
      select id from public.community_remedy_recommendations where profile_id = auth.uid()
    )
  );

drop policy if exists community_remedy_checkins_owner_insert on public.community_remedy_checkins;
create policy community_remedy_checkins_owner_insert
  on public.community_remedy_checkins
  for insert
  to authenticated
  with check (
    recommendation_id in (
      select id from public.community_remedy_recommendations where profile_id = auth.uid()
    )
  );

commit;
