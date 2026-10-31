-- NOT RUN — Raymond reviews and runs
-- Admin-only login marker so the Discord portal ping fires once per doctor per day.
-- No policies for authenticated users. The service role writes this table.

create table if not exists public.portal_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  logged_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

alter table public.portal_logins enable row level security;
