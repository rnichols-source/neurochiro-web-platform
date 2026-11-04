-- NOT RUN — Raymond reviews and runs
-- Patient waitlist: let postal codes besides US 5-digit ZIPs be saved,
-- and store an optional mobile number only when the person opts in to texts.
-- Also stores coordinates so a new doctor can be matched when the postal
-- code is not in the zip_codes table (India, UAE, and other countries).
-- Safe to run more than once. Does not text anyone. Does not delete rows.

-- ===================== CHECK FIRST =====================
-- Constraint names and column names only. No emails or phone numbers.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.subscribers'::regclass
  and contype = 'c';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'subscribers'
  and column_name in (
    'country', 'sms_phone', 'sms_consent', 'sms_consent_at',
    'sms_consent_version', 'sms_consent_text', 'sms_opted_out_at',
    'latitude', 'longitude'
  )
order by column_name;

-- ===================== CHANGE =====================
begin;

alter table public.subscribers add column if not exists country text;

-- Drop the old "5 digits only" check, whatever it was named.
do $$
declare
  old_check record;
begin
  for old_check in
    select conname
    from pg_constraint
    where conrelid = 'public.subscribers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%zip%'
      and pg_get_constraintdef(oid) like '%d{5}%'
  loop
    execute format('alter table public.subscribers drop constraint %I', old_check.conname);
  end loop;
end $$;

alter table public.subscribers drop constraint if exists subscribers_zip_check;

alter table public.subscribers add constraint subscribers_zip_check
  check (
    zip is null
    or char_length(btrim(zip)) = 0
    or char_length(btrim(zip)) between 2 and 16
  );

alter table public.subscribers
  add column if not exists sms_phone text,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_version text,
  add column if not exists sms_consent_text text,
  add column if not exists sms_opted_out_at timestamptz,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.subscribers.sms_phone is
  'E.164 mobile. Saved only when sms_consent is true.';
comment on column public.subscribers.sms_opted_out_at is
  'When set, do not text this subscriber. Inbound STOP replies are not written here yet.';

commit;

-- ===================== CHECK AFTER =====================
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.subscribers'::regclass
  and conname = 'subscribers_zip_check';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'subscribers'
  and column_name in (
    'country', 'sms_phone', 'sms_consent', 'sms_consent_at',
    'sms_consent_version', 'sms_consent_text', 'sms_opted_out_at',
    'latitude', 'longitude'
  )
order by column_name;
