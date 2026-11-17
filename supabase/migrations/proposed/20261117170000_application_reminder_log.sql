-- NOT RUN — Raymond reviews and runs
-- Log of doctor-application reminder emails and texts.
-- Also marks payment-link applications approved so they leave the review queue.
-- Does not charge anyone, send email, or send a text.
-- Safe to run more than once.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz).
-- Do not run this against the clinic database.

-- ===================== CHECK FIRST =====================
select to_regclass('public.application_reminder_sends') as reminder_log_exists;
select id, status, payment_received_at
from public.doctor_applications
where status = 'under_review' and payment_received_at is not null;

-- ===================== CHANGE =====================
begin;

create table if not exists public.application_reminder_sends (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.doctor_applications(id) on delete cascade,
  channel text not null,
  kind text not null,
  timezone text,
  sent_at timestamptz not null default now(),
  constraint application_reminder_sends_channel_check check (channel in ('email', 'sms')),
  constraint application_reminder_sends_kind_check check (kind in ('1h', '24h'))
);

create index if not exists application_reminder_sends_application_idx
  on public.application_reminder_sends (application_id, sent_at desc);

alter table public.application_reminder_sends enable row level security;

revoke all on table public.application_reminder_sends from public, anon, authenticated;

update public.doctor_applications
set status = 'approved',
    reviewed_at = coalesce(reviewed_at, now()),
    updated_at = now()
where status = 'under_review'
  and payment_received_at is not null;

commit;

-- ===================== CHECK AFTER =====================
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'application_reminder_sends'
order by ordinal_position;

select count(*) as still_waiting
from public.doctor_applications
where status = 'under_review' and payment_received_at is not null;
