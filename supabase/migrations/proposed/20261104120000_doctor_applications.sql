-- NOT RUN — Raymond reviews and runs
-- Doctor applications. A new table for the apply → card on file → approve flow.
-- Does not change existing listings. Does not charge anyone. Safe to run more than once.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz) before turning on APPLICATION_FLOW_ENABLED.
-- Do not run this against the clinic database.

-- ===================== CHECK FIRST =====================
select to_regclass('public.doctor_applications') as doctor_applications_exists;
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctors'
  and column_name in ('stripe_customer_id', 'stripe_subscription_id', 'paid_at', 'is_approved', 'is_founding_member')
order by column_name;

-- ===================== CHANGE =====================
begin;

create table if not exists public.doctor_applications (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  user_id uuid,
  status text not null default 'draft',
  practice_approach text,
  techniques text,
  uses_nervous_system_scans boolean,
  scan_types text,
  years_in_practice integer,
  office_address text,
  city text,
  state text,
  country text,
  website text,
  instagram text,
  heard_about text,
  why_join text,
  referral_code text,
  plan text,
  currency text,
  stripe_price_id text,
  price_label text,
  stripe_customer_id text,
  stripe_payment_method_id text,
  stripe_setup_session_id text,
  stripe_subscription_id text,
  card_on_file boolean not null default false,
  charge_attempt integer not null default 0,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_applications_status_check check (
    status in ('draft', 'under_review', 'approved', 'declined', 'needs_action')
  ),
  constraint doctor_applications_plan_check check (
    plan is null or plan in ('monthly', 'annual')
  )
);

create unique index if not exists doctor_applications_doctor_id_key
  on public.doctor_applications (doctor_id);

create index if not exists doctor_applications_status_idx
  on public.doctor_applications (status, created_at desc);

create index if not exists doctor_applications_customer_idx
  on public.doctor_applications (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.doctors
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists doctors_stripe_customer_id_idx
  on public.doctors (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.doctor_applications enable row level security;

revoke all on table public.doctor_applications from public, anon, authenticated;

drop policy if exists doctor_applications_select_own on public.doctor_applications;
create policy doctor_applications_select_own
  on public.doctor_applications
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on table public.doctor_applications to authenticated;

commit;

-- ===================== CHECK AFTER =====================
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'doctor_applications'
order by ordinal_position;
