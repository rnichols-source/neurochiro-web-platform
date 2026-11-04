-- NOT RUN — Raymond reviews and runs
-- Instant lead texts. Adds patient SMS consent, doctor alert mobiles, and sms_log.
-- Safe to run more than once. Does not drop anything. Does not text anyone.

-- ===================== CHECK FIRST =====================
-- Counts and column names only. No names, phones, or emails.
select to_regclass('public.sms_log') as sms_log_exists;
select count(*) as contact_requests from public.contact_requests;
select count(*) as doctors from public.doctors;
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contact_requests'
  and column_name in ('sms_consent', 'sms_consent_at', 'sms_consent_version', 'sms_consent_text', 'sms_phone')
order by column_name;
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctors'
  and column_name in ('lead_alert_phones', 'sms_alerts_enabled', 'sms_alerts_consent_at', 'sms_alerts_consent_text')
order by column_name;

-- ===================== CHANGE =====================
begin;

alter table public.contact_requests
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_version text,
  add column if not exists sms_consent_text text,
  add column if not exists sms_phone text;

alter table public.doctors
  add column if not exists lead_alert_phones text[] not null default '{}',
  add column if not exists sms_alerts_enabled boolean not null default true,
  add column if not exists sms_alerts_consent_at timestamptz,
  add column if not exists sms_alerts_consent_text text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'doctors_lead_alert_phones_max3'
  ) then
    alter table public.doctors
      add constraint doctors_lead_alert_phones_max3
      check (coalesce(cardinality(lead_alert_phones), 0) <= 3);
  end if;
end $$;

create table if not exists public.sms_log (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  kind text not null,
  audience text not null,
  contact_request_id uuid references public.contact_requests(id) on delete set null,
  doctor_id uuid,
  to_phone text not null,
  body text not null,
  status text not null default 'queued',
  send_after timestamptz not null default now(),
  attempt int not null default 0,
  quo_message_id text,
  error text,
  test_mode boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint sms_log_kind_check check (kind in ('patient_request_confirm', 'doctor_new_lead')),
  constraint sms_log_audience_check check (audience in ('patient', 'doctor')),
  constraint sms_log_status_check check (status in (
    'queued',
    'held_quiet_hours',
    'sending',
    'sent',
    'failed',
    'skipped_disabled',
    'skipped_no_consent',
    'skipped_invalid_phone',
    'canceled'
  ))
);

create index if not exists sms_log_status_send_after_idx
  on public.sms_log (status, send_after);

alter table public.sms_log enable row level security;

revoke all on table public.sms_log from public, anon, authenticated;

commit;

-- ===================== CHECK AFTER =====================
-- Counts, flags, and column names only. No names, phones, or emails.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contact_requests'
  and column_name in ('sms_consent', 'sms_consent_at', 'sms_consent_version', 'sms_consent_text', 'sms_phone')
order by column_name;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctors'
  and column_name in ('lead_alert_phones', 'sms_alerts_enabled', 'sms_alerts_consent_at', 'sms_alerts_consent_text')
order by column_name;

select c.relrowsecurity as sms_log_rls_on
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'sms_log';

select count(*) as sms_log_policies
from pg_policies
where schemaname = 'public' and tablename = 'sms_log';

select count(*) as sms_log_rows from public.sms_log;

-- Optional, still commented. Raymond fills this in himself for doctors who asked for texts.
-- Placeholder numbers only. Do not put a real mobile in the repo.
-- update public.doctors
--   set lead_alert_phones = array['+1XXXXXXXXXX'],
--       sms_alerts_consent_at = now(),
--       sms_alerts_consent_text = 'Replied by email asking for lead texts'
--   where lower(email) = lower('doctor@example.com');
