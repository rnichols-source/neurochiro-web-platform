create table if not exists public.community_doctor_care_invites (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  email text not null,
  plan_slug text not null,
  note text,
  token text not null unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  claimed_profile_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz
);

alter table public.community_doctor_care_invites enable row level security;

drop policy if exists community_doctor_care_invites_select on public.community_doctor_care_invites;
create policy community_doctor_care_invites_select
  on public.community_doctor_care_invites
  for select
  to authenticated
  using (
    doctor_id in (select id from public.doctors where user_id = (select auth.uid()))
    or claimed_profile_id = (select auth.uid())
    or lower(email) = lower((select email from public.profiles where id = (select auth.uid())))
  );

drop policy if exists community_doctor_care_invites_insert on public.community_doctor_care_invites;
create policy community_doctor_care_invites_insert
  on public.community_doctor_care_invites
  for insert
  to authenticated
  with check (
    doctor_id in (select id from public.doctors where user_id = (select auth.uid()))
  );

revoke all on table public.community_doctor_care_invites from public, anon;
grant select, insert on table public.community_doctor_care_invites to authenticated;
