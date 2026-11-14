-- Additive. Not applied by this change. Review and run in the Supabase SQL editor.
-- Profile research jobs queued when a doctor is approved.
-- Service role only: RLS is on, and anon/authenticated have no privileges and no policies.
-- doctors.profile_built_at already exists. This file does not add it.

begin;

create table if not exists public.profile_build_jobs (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  application_id uuid,
  website_url text,
  booking_url text,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  extracted jsonb,
  next_run_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_build_jobs_status_chk
    check (status in ('pending', 'processing', 'succeeded', 'failed')),
  constraint profile_build_jobs_attempts_chk
    check (attempts >= 0 and attempts <= 3)
);

create index if not exists profile_build_jobs_due_idx
  on public.profile_build_jobs (next_run_at, created_at)
  where status in ('pending', 'failed');

create unique index if not exists profile_build_jobs_open_doctor_uidx
  on public.profile_build_jobs (doctor_id)
  where status in ('pending', 'processing');

alter table public.profile_build_jobs enable row level security;

revoke all on table public.profile_build_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.profile_build_jobs to service_role;

commit;
