-- NOT RUN — Raymond reviews and runs

-- Saved P&L months for the doctor portal.
-- One row per doctor per month. A doctor can read and change only their own rows.
-- Safe to run more than once. Does not touch leads, billing, or other tables' data.
-- Check first:
--   select user_id, month, count(*) from public.pl_snapshots group by 1, 2 having count(*) > 1;

create table if not exists public.pl_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  collections_cents bigint not null default 0,
  expenses jsonb not null default '{}'::jsonb,
  profit_margin numeric(12, 4) not null default 0,
  net_income_cents bigint,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pl_snapshots add column if not exists net_income_cents bigint;
alter table public.pl_snapshots add column if not exists currency text;
alter table public.pl_snapshots add column if not exists created_at timestamptz not null default now();
alter table public.pl_snapshots add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pl_snapshots'
      and column_name = 'collections_cents' and data_type = 'integer'
  ) then
    alter table public.pl_snapshots alter column collections_cents type bigint;
  end if;
end $$;

do $$
begin
  if to_regclass('public.pl_snapshots') is null then
    return;
  end if;
  if exists (
    select 1 from public.pl_snapshots
    where month is null or month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ) then
    raise exception 'pl_snapshots has a month that is not YYYY-MM. Fix those rows, then run this again.';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pl_snapshots'::regclass and conname = 'pl_snapshots_month_format'
  ) then
    alter table public.pl_snapshots
      add constraint pl_snapshots_month_format check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
  end if;
  if exists (
    select 1 from public.pl_snapshots group by user_id, month having count(*) > 1
  ) then
    raise exception 'pl_snapshots has two rows for the same doctor and month. Merge those, then run this again.';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pl_snapshots'::regclass and conname = 'pl_snapshots_user_month'
  ) then
    alter table public.pl_snapshots
      add constraint pl_snapshots_user_month unique (user_id, month);
  end if;
end $$;

alter table public.pl_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pl_snapshots' and policyname = 'pl_snapshots_select_own'
  ) then
    create policy pl_snapshots_select_own on public.pl_snapshots
      for select using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pl_snapshots' and policyname = 'pl_snapshots_insert_own'
  ) then
    create policy pl_snapshots_insert_own on public.pl_snapshots
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pl_snapshots' and policyname = 'pl_snapshots_update_own'
  ) then
    create policy pl_snapshots_update_own on public.pl_snapshots
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pl_snapshots' and policyname = 'pl_snapshots_delete_own'
  ) then
    create policy pl_snapshots_delete_own on public.pl_snapshots
      for delete using (user_id = auth.uid());
  end if;
end $$;

revoke all on public.pl_snapshots from public, anon;
grant select, insert, update, delete on public.pl_snapshots to authenticated;

-- Drafts for the open month live in doctor_tool_data, one row per doctor per tool key.
create table if not exists public.doctor_tool_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, tool)
);

alter table public.doctor_tool_data enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_tool_data' and policyname = 'doctor_tool_data_select_own'
  ) then
    create policy doctor_tool_data_select_own on public.doctor_tool_data
      for select using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_tool_data' and policyname = 'doctor_tool_data_write_own'
  ) then
    create policy doctor_tool_data_write_own on public.doctor_tool_data
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

revoke all on public.doctor_tool_data from public, anon;
grant select, insert, update, delete on public.doctor_tool_data to authenticated;
