-- NOT RUN — Raymond reviews and runs
-- Unfinished doctor applications.
-- Remembers which step they reached, and when the 1-hour and 24-hour reminder emails went out.
-- Does not change prices, listings, or charges. Does not email or text anyone.
-- Safe to run more than once.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz).
-- Do not run this against the clinic database.
-- The site still saves answers if this has not been run. Reminders wait until it has.

-- ===================== CHECK FIRST =====================
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctor_applications'
  and column_name in ('step_reached', 'reminder_1h_sent_at', 'reminder_24h_sent_at')
order by column_name;

-- ===================== CHANGE =====================
begin;

alter table public.doctor_applications
  add column if not exists step_reached smallint,
  add column if not exists reminder_1h_sent_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'doctor_applications_step_reached_check'
  ) then
    alter table public.doctor_applications
      add constraint doctor_applications_step_reached_check
      check (step_reached is null or step_reached between 1 and 3);
  end if;
end $$;

create index if not exists doctor_applications_draft_reminder_idx
  on public.doctor_applications (created_at)
  where status = 'draft' and card_on_file = false;

commit;

-- ===================== CHECK AFTER =====================
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'doctor_applications'
  and column_name in ('step_reached', 'reminder_1h_sent_at', 'reminder_24h_sent_at')
order by column_name;
