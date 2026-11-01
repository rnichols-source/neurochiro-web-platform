-- NOT RUN — Raymond reviews and runs

-- Section A. Funnel events for /quiz. No anon or authenticated policies:
-- only the server service role writes and reads.

create table if not exists public.quiz_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event text not null check (event in ('start','step_view','step_answer','complete','results_shown','no_local','request_open','request_sent','email_sent','alerts_opt_in','error')),
  step text check (step in ('concern','location','experience','priority','results')),
  source text,
  country text,
  concern text,
  match_count int,
  band_miles int,
  doctor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists quiz_events_created_idx on public.quiz_events (created_at desc);
create index if not exists quiz_events_session_idx on public.quiz_events (session_id);

alter table public.quiz_events enable row level security;

-- Section B. The repo still creates subscribers.zip with a 5-digit check in
-- sql/subscribers_migration.sql (line 8: zip ~ '^\d{5}$').
-- No later file in sql/, sql_archive/, or supabase/migrations/ drops it.
-- Do not assume production still has that check. Run CHECK FIRST.
-- Without a wider check, non-US alert sign-ups fail. That is already true
-- for /api/subscribe today.

-- CHECK FIRST:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.subscribers'::regclass;

-- Run the block below only if CHECK FIRST shows zip ~ '^\d{5}$'.
-- The new check allows the codes detect-postal.ts stores:
-- US 5 digits, CA FSA, UK outward code, AU/NZ 4 digits.
--
-- alter table public.subscribers drop constraint if exists subscribers_zip_check;
-- alter table public.subscribers add constraint subscribers_zip_check
--   check (zip ~ '^(\d{5}|[A-Z]\d[A-Z]|[A-Z]{1,2}\d[A-Z\d]?|\d{4})$');

-- Section C. Read-only report for the last 30 days. Safe to run any time after section A.

-- Steps reached per day
-- select date_trunc('day', created_at) as day, step, count(distinct session_id) as sessions
-- from public.quiz_events
-- where created_at > now() - interval '30 days' and event = 'step_view'
-- group by 1, 2
-- order by 1 desc, 2;

-- Drop-off: sessions that saw a step and did not see the next one
-- with views as (
--   select session_id, step from public.quiz_events
--   where created_at > now() - interval '30 days' and event = 'step_view'
-- )
-- select step, count(distinct session_id) as reached
-- from views
-- group by step
-- order by step;

-- Completion to request rate
-- select
--   count(distinct session_id) filter (where event = 'complete') as completed,
--   count(distinct session_id) filter (where event = 'request_sent') as requested
-- from public.quiz_events
-- where created_at > now() - interval '30 days';

-- Requests by entry source
-- select source, count(*) as requests
-- from public.quiz_events
-- where created_at > now() - interval '30 days' and event = 'request_sent'
-- group by source
-- order by requests desc;
