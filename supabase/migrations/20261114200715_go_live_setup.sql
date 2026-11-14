-- NOT APPLIED. Review and run in the Supabase SQL editor for project gddapefwrmucimpdhjrz.
-- Go-live setup: checkout claims, nudge log, and listing flags for payment-driven membership.
-- Safe to run more than once.

begin;

alter table public.doctors
  add column if not exists needs_profile_finish boolean not null default false,
  add column if not exists profile_missing text[] not null default '{}',
  add column if not exists listing_exception text,
  add column if not exists sms_prompt_required boolean not null default false,
  add column if not exists sms_region_note text,
  add column if not exists duplicate_of uuid,
  add column if not exists go_live_flow_at timestamptz;

alter table public.doctor_applications
  add column if not exists auto_charge_claimed_at timestamptz,
  add column if not exists payment_link_sent_at timestamptz,
  add column if not exists payment_received_at timestamptz;

create table if not exists public.doctor_checkout_claims (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  email text,
  doctor_id uuid,
  user_id uuid,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create unique index if not exists doctor_checkout_claims_session_uidx
  on public.doctor_checkout_claims (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists doctor_checkout_claims_customer_uidx
  on public.doctor_checkout_claims (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists doctor_checkout_claims_subscription_uidx
  on public.doctor_checkout_claims (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.member_setup_nudges (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  nudge_key text not null,
  channel text not null,
  kind text not null,
  day_number integer not null,
  step text,
  sent_at timestamptz not null default now(),
  unique (doctor_id, nudge_key, channel)
);

create index if not exists member_setup_nudges_doctor_idx
  on public.member_setup_nudges (doctor_id, sent_at desc);

create index if not exists doctors_verified_at_live_idx
  on public.doctors (verified_at)
  where verified_at is not null;

create table if not exists public.waitlist_alert_sends (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  subscriber_id uuid not null,
  channel text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (doctor_id, subscriber_id, channel)
);

create table if not exists public.ig_waitlist (
  id uuid primary key default gen_random_uuid(),
  ig_handle text not null,
  name text,
  city text,
  state text,
  zip text,
  country text,
  latitude double precision,
  longitude double precision,
  location_raw text,
  requested_at timestamptz,
  status text not null default 'waiting',
  notified_doctor_ids uuid[] not null default '{}',
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists ig_waitlist_handle_uidx
  on public.ig_waitlist (lower(ig_handle));

create table if not exists public.ig_dm_batches (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid,
  kind text not null,
  created_at timestamptz not null default now(),
  emailed_at timestamptz
);

create table if not exists public.ig_dm_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.ig_dm_batches(id) on delete cascade,
  waitlist_id uuid not null references public.ig_waitlist(id),
  doctor_id uuid not null,
  ig_handle text not null,
  area text,
  distance_miles numeric,
  message text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (waitlist_id, doctor_id)
);

alter table public.doctor_checkout_claims enable row level security;
alter table public.member_setup_nudges enable row level security;
alter table public.waitlist_alert_sends enable row level security;
alter table public.ig_waitlist enable row level security;
alter table public.ig_dm_batches enable row level security;
alter table public.ig_dm_items enable row level security;

revoke all on table public.doctor_checkout_claims from anon, authenticated;
revoke all on table public.member_setup_nudges from anon, authenticated;
revoke all on table public.waitlist_alert_sends from anon, authenticated;
revoke all on table public.ig_waitlist from anon, authenticated;
revoke all on table public.ig_dm_batches from anon, authenticated;
revoke all on table public.ig_dm_items from anon, authenticated;

commit;
