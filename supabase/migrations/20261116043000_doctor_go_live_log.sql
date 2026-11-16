-- Doctor go-live step log and Stripe webhook health.
-- Apply on project gddapefwrmucimpdhjrz. Safe to run more than once.
-- Does not send email or SMS.

begin;

alter table public.doctors
  add column if not exists needs_ai_enrich boolean not null default false;

create table if not exists public.doctor_go_live_runs (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  source text not null,
  dry_run boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_go_live_runs_doctor_idx
  on public.doctor_go_live_runs (doctor_id, created_at desc);

create table if not exists public.doctor_go_live_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.doctor_go_live_runs (id) on delete cascade,
  doctor_id uuid not null,
  step text not null,
  status text not null,
  reason text,
  detail jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint doctor_go_live_steps_status_chk check (status in ('ok', 'failed', 'skipped')),
  constraint doctor_go_live_steps_step_chk check (step in (
    'checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'
  )),
  unique (run_id, step)
);

create index if not exists doctor_go_live_steps_doctor_idx
  on public.doctor_go_live_steps (doctor_id, updated_at desc);

create table if not exists public.stripe_webhook_health (
  id text primary key,
  last_event_at timestamptz,
  last_event_id text,
  last_event_type text,
  last_signature_failure_at timestamptz,
  last_alert_at timestamptz,
  last_alert_reason text
);

insert into public.stripe_webhook_health (id)
values ('stripe')
on conflict (id) do nothing;

alter table public.doctor_go_live_runs enable row level security;
alter table public.doctor_go_live_steps enable row level security;
alter table public.stripe_webhook_health enable row level security;

revoke all on table public.doctor_go_live_runs from public, anon, authenticated;
revoke all on table public.doctor_go_live_steps from public, anon, authenticated;
revoke all on table public.stripe_webhook_health from public, anon, authenticated;

grant select, insert, update, delete on table public.doctor_go_live_runs to service_role;
grant select, insert, update, delete on table public.doctor_go_live_steps to service_role;
grant select, insert, update, delete on table public.stripe_webhook_health to service_role;

commit;
