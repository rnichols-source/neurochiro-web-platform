-- NOT RUN — Raymond reviews and runs
-- Follow-ups for the doctor scorecard.
-- Closed days, who typed a number, and office staff who may enter numbers.
-- Does not delete any scorecard numbers. Safe to run more than once.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz) after the KPI scorecard script.
-- Do not run this against the clinic database.

begin;

create table if not exists public.kpi_office_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  open_weekdays integer[] not null default array[1, 2, 3, 4, 5],
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_closed_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  closed_on date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint kpi_closed_dates_one unique (user_id, closed_on)
);

create table if not exists public.kpi_office_members (
  id uuid primary key default gen_random_uuid(),
  office_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null,
  can_view_pl boolean not null default false,
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kpi_office_members_role_check check (role in ('associate', 'front_desk')),
  constraint kpi_office_members_status_check check (status in ('invited', 'active', 'removed'))
);

create unique index if not exists kpi_office_members_office_email
  on public.kpi_office_members (office_user_id, lower(email));

alter table public.kpi_office_settings enable row level security;
alter table public.kpi_closed_dates enable row level security;
alter table public.kpi_office_members enable row level security;

do $$
begin
  if to_regclass('public.kpi_values') is not null then
    alter table public.kpi_values add column if not exists source text not null default 'manual';
    alter table public.kpi_values add column if not exists entered_by uuid;
    alter table public.kpi_values add column if not exists entered_by_name text;
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.kpi_values'::regclass and conname = 'kpi_values_source_check'
    ) then
      alter table public.kpi_values
        add constraint kpi_values_source_check check (source in ('manual', 'auto'));
    end if;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_office_settings' and policyname = 'kpi_office_settings_owner') then
    create policy kpi_office_settings_owner on public.kpi_office_settings
      for all to authenticated
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_office_settings' and policyname = 'kpi_office_settings_member_select') then
    create policy kpi_office_settings_member_select on public.kpi_office_settings
      for select to authenticated
      using (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = kpi_office_settings.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_closed_dates' and policyname = 'kpi_closed_dates_owner') then
    create policy kpi_closed_dates_owner on public.kpi_closed_dates
      for all to authenticated
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_closed_dates' and policyname = 'kpi_closed_dates_member_select') then
    create policy kpi_closed_dates_member_select on public.kpi_closed_dates
      for select to authenticated
      using (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = kpi_closed_dates.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_office_members' and policyname = 'kpi_office_members_owner') then
    create policy kpi_office_members_owner on public.kpi_office_members
      for all to authenticated
      using (office_user_id = (select auth.uid()))
      with check (office_user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_office_members' and policyname = 'kpi_office_members_self_select') then
    create policy kpi_office_members_self_select on public.kpi_office_members
      for select to authenticated
      using (
        member_user_id = (select auth.uid())
        or (
          status = 'invited'
          and lower(email) = lower(coalesce((select p.email from public.profiles p where p.id = (select auth.uid())), ''))
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_office_members' and policyname = 'kpi_office_members_claim') then
    create policy kpi_office_members_claim on public.kpi_office_members
      for update to authenticated
      using (
        status = 'invited'
        and member_user_id is null
        and lower(email) = lower(coalesce((select p.email from public.profiles p where p.id = (select auth.uid())), ''))
      )
      with check (
        member_user_id = (select auth.uid())
        and status = 'active'
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.kpi_definitions') is not null
    and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'kpi_definitions_member_select') then
    create policy kpi_definitions_member_select on public.kpi_definitions
      for select to authenticated
      using (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = kpi_definitions.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
        )
      );
  end if;
  if to_regclass('public.kpi_values') is not null
    and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'kpi_values_member_all') then
    create policy kpi_values_member_all on public.kpi_values
      for all to authenticated
      using (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = kpi_values.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
        )
      )
      with check (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = kpi_values.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
        )
      );
  end if;
  if to_regclass('public.pl_snapshots') is not null
    and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pl_snapshots' and policyname = 'pl_snapshots_member_select') then
    create policy pl_snapshots_member_select on public.pl_snapshots
      for select to authenticated
      using (
        exists (
          select 1 from public.kpi_office_members m
          where m.office_user_id = pl_snapshots.user_id
            and m.member_user_id = (select auth.uid())
            and m.status = 'active'
            and m.can_view_pl
        )
      );
  end if;
end $$;

revoke all on table public.kpi_office_settings from public, anon;
revoke all on table public.kpi_closed_dates from public, anon;
revoke all on table public.kpi_office_members from public, anon;
grant select, insert, update, delete on table public.kpi_office_settings to authenticated;
grant select, insert, update, delete on table public.kpi_closed_dates to authenticated;
grant select, insert, update, delete on table public.kpi_office_members to authenticated;

commit;
