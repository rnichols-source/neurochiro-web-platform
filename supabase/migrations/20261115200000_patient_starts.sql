-- Patients who started care (reported by founders from doctor calls).
-- Admin / service_role only. Idempotent. Does not seed or overwrite rows.
-- Production already has this table; this file keeps preview and future
-- environments in sync.

create table if not exists public.patient_starts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id),
  doctor_slug text not null,
  doctor_name text not null,
  clinic_name text,
  city text,
  state text,
  patients_started integer not null check (patients_started >= 0),
  reported_on date not null,
  notes text,
  care_plan_value_usd numeric,
  value_is_estimate boolean not null default true,
  value_source text,
  est_revenue_usd numeric generated always as (patients_started * care_plan_value_usd) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists patient_starts_doctor_reported_uidx
  on public.patient_starts (doctor_id, reported_on);

create index if not exists patient_starts_doctor_id_idx
  on public.patient_starts (doctor_id);

create index if not exists patient_starts_slug_idx
  on public.patient_starts (doctor_slug);

alter table public.patient_starts enable row level security;

revoke all on table public.patient_starts from public, anon, authenticated;
grant all on table public.patient_starts to service_role;

-- Network totals for admin / recruiting. Null est. revenue if any row is still unknown.
create or replace view public.patient_starts_totals
  with (security_invoker = true)
as
select
  count(*)::integer as doctor_count,
  coalesce(sum(patients_started), 0)::integer as total_patients_started,
  case
    when count(*) = 0 then null
    when bool_or(care_plan_value_usd is null) then null
    else sum(est_revenue_usd)
  end as total_est_revenue_usd
from public.patient_starts;

revoke all on table public.patient_starts_totals from public, anon, authenticated;
grant select on table public.patient_starts_totals to service_role;
