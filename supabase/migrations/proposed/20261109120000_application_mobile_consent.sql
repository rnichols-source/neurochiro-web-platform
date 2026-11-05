-- NOT RUN — Raymond reviews and runs
-- Mobile number and text consent on doctor applications.
-- Additive only. Does not change existing listings, prices, or charges.
-- Safe to run more than once. Does not text anyone.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz).
-- Do not run this against the clinic database.
-- The application still saves if this has not been run yet: the number and consent
-- stay in a hidden note on the application, and are copied onto the doctor record
-- when the lead-text columns already exist. Run this so they live in their own columns.

-- ===================== CHECK FIRST =====================
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctor_applications'
  and column_name in ('mobile_e164', 'sms_consent', 'sms_consent_at', 'sms_consent_text')
order by column_name;

-- ===================== CHANGE =====================
begin;

alter table public.doctor_applications
  add column if not exists mobile_e164 text,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_text text;

commit;

-- ===================== CHECK AFTER =====================
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctor_applications'
  and column_name in ('mobile_e164', 'sms_consent', 'sms_consent_at', 'sms_consent_text')
order by column_name;
