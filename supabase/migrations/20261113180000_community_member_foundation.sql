-- Phase 1 community member foundation.
-- Does not change profiles.role. Existing community accounts stay role 'patient'.
-- Does not touch doctors, billing, applications, or member referrals.
-- Safe to run more than once. Do not apply from the app server; run as a migration.

begin;

create table if not exists public.community_households (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.community_households(id) on delete cascade,
  first_name text not null,
  relationship text not null,
  invited_email text,
  created_at timestamptz not null default now(),
  constraint community_family_first_name_len check (char_length(btrim(first_name)) between 1 and 40),
  constraint community_family_relationship_check check (
    relationship in ('spouse', 'partner', 'child', 'parent', 'sibling', 'other')
  ),
  constraint community_family_email_len check (invited_email is null or char_length(invited_email) <= 200)
);

create index if not exists community_family_household_idx
  on public.community_family_members (household_id);

create table if not exists public.community_home_doctors (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_home_doctors_doctor_idx
  on public.community_home_doctors (doctor_id);

create table if not exists public.community_visit_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  family_member_id uuid references public.community_family_members(id) on delete set null,
  shared_first_name text,
  for_first_name text,
  shared_email text,
  callback_phone text,
  shared_family_names text,
  note text,
  preferred_window text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  constraint community_visit_status_check check (status in ('requested', 'seen', 'closed')),
  constraint community_visit_note_len check (note is null or char_length(note) <= 400)
);

create index if not exists community_visits_profile_idx
  on public.community_visit_requests (profile_id, created_at desc);

create index if not exists community_visits_doctor_idx
  on public.community_visit_requests (doctor_id, created_at desc);

create table if not exists public.community_privacy (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  share_name_with_home_doctor boolean not null default false,
  share_email_with_home_doctor boolean not null default false,
  share_phone_with_home_doctor boolean not null default false,
  share_family_first_names_with_home_doctor boolean not null default false,
  share_home_clinic_with_other_doctors boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.community_households enable row level security;
alter table public.community_family_members enable row level security;
alter table public.community_home_doctors enable row level security;
alter table public.community_visit_requests enable row level security;
alter table public.community_privacy enable row level security;

revoke all on table public.community_households from public, anon;
revoke all on table public.community_family_members from public, anon;
revoke all on table public.community_home_doctors from public, anon;
revoke all on table public.community_visit_requests from public, anon;
revoke all on table public.community_privacy from public, anon;

grant select, insert, update, delete on table public.community_households to authenticated;
grant select, insert, update, delete on table public.community_family_members to authenticated;
grant select, insert, update, delete on table public.community_home_doctors to authenticated;
grant select, insert, update on table public.community_visit_requests to authenticated;
grant select, insert, update, delete on table public.community_privacy to authenticated;

drop policy if exists community_households_owner_all on public.community_households;
create policy community_households_owner_all
  on public.community_households
  for all
  to authenticated
  using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

drop policy if exists community_family_owner_all on public.community_family_members;
create policy community_family_owner_all
  on public.community_family_members
  for all
  to authenticated
  using (
    household_id in (
      select id from public.community_households where owner_profile_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select id from public.community_households where owner_profile_id = auth.uid()
    )
  );

drop policy if exists community_home_doctors_owner_all on public.community_home_doctors;
create policy community_home_doctors_owner_all
  on public.community_home_doctors
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_privacy_owner_all on public.community_privacy;
create policy community_privacy_owner_all
  on public.community_privacy
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_visits_owner_select on public.community_visit_requests;
create policy community_visits_owner_select
  on public.community_visit_requests
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists community_visits_owner_insert on public.community_visit_requests;
create policy community_visits_owner_insert
  on public.community_visit_requests
  for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists community_visits_doctor_select on public.community_visit_requests;
create policy community_visits_doctor_select
  on public.community_visit_requests
  for select
  to authenticated
  using (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

drop policy if exists community_visits_doctor_update on public.community_visit_requests;
create policy community_visits_doctor_update
  on public.community_visit_requests
  for update
  to authenticated
  using (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  )
  with check (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

commit;
