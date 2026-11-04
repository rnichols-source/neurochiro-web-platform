-- NOT RUN — Raymond reviews and runs
-- Doctor-to-doctor patient referrals. Safe to run more than once.
-- NeuroChiro project gddapefwrmucimpdhjrz only. Do not run this on the clinic database.
-- Does not charge anyone, does not touch Stripe, and does not delete referral rows.
-- It fills a new phone-digits helper from the phone number already stored, so an open
-- duplicate can be blocked. Review the NOTICE lines if a check is skipped.
--
-- Overlaps supabase/migrations/20261102000000_referrals_v2.sql (also marked not run).
-- Run this file. You do not also need that one. Running both is safe: this file does
-- not rewrite a "pending" status into "sent".

-- ===================== CHECK FIRST =====================
select current_database() as database_name;
select to_regclass('public.doctor_referrals') as doctor_referrals_exists;

-- ===================== CHANGE =====================
begin;

alter table public.doctor_referrals add column if not exists viewed_at timestamptz;
alter table public.doctor_referrals add column if not exists contacted_at timestamptz;
alter table public.doctor_referrals add column if not exists scheduled_at timestamptz;
alter table public.doctor_referrals add column if not exists scheduled_for date;
alter table public.doctor_referrals add column if not exists cancelled_at timestamptz;
alter table public.doctor_referrals add column if not exists thank_you_note text;
alter table public.doctor_referrals add column if not exists patient_intro_sent_at timestamptz;
alter table public.doctor_referrals add column if not exists receiver_reminder_1_at timestamptz;
alter table public.doctor_referrals add column if not exists receiver_reminder_2_at timestamptz;
alter table public.doctor_referrals add column if not exists referrer_nudge_at timestamptz;
alter table public.doctor_referrals add column if not exists patient_phone_digits text;

alter table public.doctor_referrals alter column expires_at set default (now() + interval '7 days');

alter table public.doctor_referrals drop constraint if exists doctor_referrals_status_check;
alter table public.doctor_referrals
  add constraint doctor_referrals_status_check
  check (status in (
    'pending', 'sent', 'viewed', 'accepted', 'declined',
    'patient_contacted', 'scheduled', 'expired', 'cancelled'
  ));

do $$
begin
  if exists (
    select 1 from public.doctor_referrals
    where referring_doctor_id = receiving_doctor_id
  ) then
    raise notice 'Skipped self-referral rule: a doctor already referred a patient to themselves. Review that row, then rerun.';
  elsif not exists (
    select 1 from pg_constraint where conname = 'doctor_referrals_not_self'
  ) then
    alter table public.doctor_referrals
      add constraint doctor_referrals_not_self
      check (referring_doctor_id <> receiving_doctor_id);
  end if;
end $$;

update public.doctor_referrals
set patient_phone_digits = regexp_replace(coalesce(patient_phone, ''), '[^0-9]', '', 'g')
where patient_phone_digits is distinct from regexp_replace(coalesce(patient_phone, ''), '[^0-9]', '', 'g');

do $$
begin
  if exists (
    select 1
    from public.doctor_referrals
    where status in ('pending', 'sent', 'viewed')
      and coalesce(patient_phone_digits, '') <> ''
    group by referring_doctor_id, receiving_doctor_id, patient_phone_digits
    having count(*) > 1
  ) then
    raise notice 'Skipped duplicate rule: two open referrals already share a doctor pair and phone. Review them, then rerun.';
  elsif not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'doctor_referrals_one_open_patient'
  ) then
    create unique index doctor_referrals_one_open_patient
      on public.doctor_referrals (referring_doctor_id, receiving_doctor_id, patient_phone_digits)
      where status in ('pending', 'sent', 'viewed')
        and patient_phone_digits is not null
        and patient_phone_digits <> '';
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.guard_doctor_referral_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  mine_referrer boolean;
  mine_receiver boolean;
begin
  new.patient_phone_digits := regexp_replace(coalesce(new.patient_phone, ''), '[^0-9]', '', 'g');

  -- Server jobs (reminders, the intro timestamp) have no signed-in user.
  -- Row security still blocks a signed-out browser. This does not open the table.
  if actor is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.referring_doctor_id = new.receiving_doctor_id then
      raise exception 'Pick another doctor';
    end if;
    if new.consent_confirmed is not true then
      raise exception 'Patient consent is required';
    end if;
    if char_length(coalesce(new.reason, '')) > 2000
       or char_length(coalesce(new.thank_you_note, '')) > 1000
       or char_length(coalesce(new.decline_reason, '')) > 500 then
      raise exception 'That note is too long';
    end if;
    if char_length(coalesce(new.patient_phone_digits, '')) < 7
       or char_length(new.patient_phone_digits) > 15 then
      raise exception 'Enter a phone number';
    end if;
    if not exists (
      select 1 from public.doctors
      where id = new.referring_doctor_id and user_id = actor
    ) then
      raise exception 'Sign in to refer';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.referring_doctor_id is distinct from old.referring_doctor_id
     or new.receiving_doctor_id is distinct from old.receiving_doctor_id
     or new.patient_first_name is distinct from old.patient_first_name
     or new.patient_last_initial is distinct from old.patient_last_initial
     or new.patient_phone is distinct from old.patient_phone
     or new.patient_email is distinct from old.patient_email
     or new.patient_city is distinct from old.patient_city
     or new.patient_zip is distinct from old.patient_zip
     or new.reason is distinct from old.reason
     or new.urgency is distinct from old.urgency
     or new.consent_confirmed is distinct from old.consent_confirmed
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Those referral details are locked';
  end if;

  select exists (
    select 1 from public.doctors where id = old.referring_doctor_id and user_id = actor
  ) into mine_referrer;
  select exists (
    select 1 from public.doctors where id = old.receiving_doctor_id and user_id = actor
  ) into mine_receiver;

  if mine_receiver and not mine_referrer then
    if new.cancelled_at is distinct from old.cancelled_at
       or new.notified_at is distinct from old.notified_at
       or new.reminder_sent_at is distinct from old.reminder_sent_at
       or new.expires_at is distinct from old.expires_at
       or new.patient_intro_sent_at is distinct from old.patient_intro_sent_at
       or new.receiver_reminder_1_at is distinct from old.receiver_reminder_1_at
       or new.receiver_reminder_2_at is distinct from old.receiver_reminder_2_at
       or new.referrer_nudge_at is distinct from old.referrer_nudge_at
    then
      raise exception 'Those referral details are locked';
    end if;
    if new.status is distinct from old.status and not (
      (old.status in ('pending', 'sent') and new.status = 'viewed')
      or (old.status in ('pending', 'sent', 'viewed') and new.status in ('accepted', 'declined'))
      or (old.status = 'accepted' and new.status = 'patient_contacted')
      or (old.status in ('accepted', 'patient_contacted') and new.status = 'scheduled')
    ) then
      raise exception 'That status change is not allowed';
    end if;
    return new;
  end if;

  if mine_referrer and not mine_receiver then
    if new.decline_reason is distinct from old.decline_reason
       or new.responded_at is distinct from old.responded_at
       or new.viewed_at is distinct from old.viewed_at
       or new.contacted_at is distinct from old.contacted_at
       or new.scheduled_at is distinct from old.scheduled_at
       or new.scheduled_for is distinct from old.scheduled_for
       or new.thank_you_note is distinct from old.thank_you_note
       or new.notified_at is distinct from old.notified_at
       or new.reminder_sent_at is distinct from old.reminder_sent_at
       or new.expires_at is distinct from old.expires_at
       or new.patient_intro_sent_at is distinct from old.patient_intro_sent_at
       or new.receiver_reminder_1_at is distinct from old.receiver_reminder_1_at
       or new.receiver_reminder_2_at is distinct from old.receiver_reminder_2_at
       or new.referrer_nudge_at is distinct from old.referrer_nudge_at
    then
      raise exception 'Those referral details are locked';
    end if;
    if new.status is distinct from old.status
       and not (old.status in ('pending', 'sent', 'viewed') and new.status = 'cancelled') then
      raise exception 'You can only cancel an open referral';
    end if;
    return new;
  end if;

  raise exception 'You cannot change this referral';
end;
$$;

revoke all on function private.guard_doctor_referral_write() from public, anon;
grant execute on function private.guard_doctor_referral_write() to authenticated, service_role;

drop trigger if exists guard_doctor_referral_write on public.doctor_referrals;
create trigger guard_doctor_referral_write
  before insert or update on public.doctor_referrals
  for each row execute function private.guard_doctor_referral_write();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_referrals' and policyname = 'referrer_can_cancel'
  ) then
    create policy referrer_can_cancel on public.doctor_referrals
      for update
      using (referring_doctor_id in (select id from public.doctors where user_id = auth.uid()))
      with check (
        referring_doctor_id in (select id from public.doctors where user_id = auth.uid())
        and status = 'cancelled'
      );
  end if;
end $$;

-- The signed-in doctor reads this view, not the raw phone columns.
drop view if exists public.doctor_referrals_safe;
create view public.doctor_referrals_safe
  with (security_barrier = true, security_invoker = false)
as
select
  dr.id,
  dr.referring_doctor_id,
  dr.receiving_doctor_id,
  dr.patient_first_name,
  dr.patient_last_initial,
  case
    when dr.referring_doctor_id in (select id from public.doctors where user_id = auth.uid())
      then dr.patient_phone
    when dr.status in ('accepted', 'patient_contacted', 'scheduled')
      and dr.receiving_doctor_id in (select id from public.doctors where user_id = auth.uid())
      then dr.patient_phone
    else null
  end as patient_phone,
  case
    when dr.referring_doctor_id in (select id from public.doctors where user_id = auth.uid())
      then dr.patient_email
    when dr.status in ('accepted', 'patient_contacted', 'scheduled')
      and dr.receiving_doctor_id in (select id from public.doctors where user_id = auth.uid())
      then dr.patient_email
    else null
  end as patient_email,
  dr.patient_city,
  dr.patient_zip,
  dr.reason,
  dr.urgency,
  dr.consent_confirmed,
  dr.status,
  dr.decline_reason,
  dr.created_at,
  dr.responded_at,
  dr.expires_at,
  dr.notified_at,
  dr.reminder_sent_at,
  dr.viewed_at,
  dr.contacted_at,
  dr.scheduled_at,
  dr.scheduled_for,
  dr.cancelled_at,
  dr.thank_you_note,
  dr.patient_intro_sent_at,
  dr.receiver_reminder_1_at,
  dr.receiver_reminder_2_at,
  dr.referrer_nudge_at
from public.doctor_referrals dr
where
  dr.referring_doctor_id in (select id from public.doctors where user_id = auth.uid())
  or dr.receiving_doctor_id in (select id from public.doctors where user_id = auth.uid());

revoke all on public.doctor_referrals_safe from public, anon;
grant select on public.doctor_referrals_safe to authenticated;

-- Direct table reads no longer include the phone, email, or digit copy.
-- The view above is the only way a signed-in doctor sees them, and only when allowed.
revoke select (patient_phone, patient_email, patient_phone_digits)
  on public.doctor_referrals from public, anon, authenticated;

create table if not exists public.referral_emails (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.doctor_referrals(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  provider_id text,
  unique (referral_id, kind)
);
alter table public.referral_emails enable row level security;
revoke all on public.referral_emails from public, anon, authenticated;

create table if not exists public.doctor_favorites (
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  favorite_doctor_id uuid not null references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (doctor_id, favorite_doctor_id)
);
alter table public.doctor_favorites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_favorites' and policyname = 'doctor_favorites_owner'
  ) then
    create policy doctor_favorites_owner on public.doctor_favorites
      for all
      using (doctor_id in (select id from public.doctors where user_id = auth.uid()))
      with check (doctor_id in (select id from public.doctors where user_id = auth.uid()));
  end if;
end $$;

create table if not exists public.referral_attachments (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.doctor_referrals(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime text,
  size_bytes integer,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
alter table public.referral_attachments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'referral_attachments' and policyname = 'referral_attachments_select'
  ) then
    create policy referral_attachments_select on public.referral_attachments
      for select
      using (
        exists (
          select 1
          from public.doctor_referrals dr
          join public.doctors me on me.user_id = auth.uid()
          where dr.id = referral_attachments.referral_id
            and (
              dr.referring_doctor_id = me.id
              or (
                dr.receiving_doctor_id = me.id
                and dr.status in ('accepted', 'patient_contacted', 'scheduled')
              )
            )
        )
      );
  end if;
end $$;

commit;
