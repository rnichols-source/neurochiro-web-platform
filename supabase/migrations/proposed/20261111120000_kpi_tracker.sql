-- NOT RUN — Raymond reviews and runs
-- KPI scorecard. Each doctor gets their own list of measures and one number per measure per day.
-- This does not delete the old kpi_entries rows. It copies them.
-- Old collections were saved in cents. This copy divides by 100 so $2,800 stays $2,800.
-- Safe to run more than once. A second run will not overwrite numbers a doctor already changed.
-- Run this in the NeuroChiro Supabase project (gddapefwrmucimpdhjrz).
-- Do not run this against the clinic database.
-- New doctors who have never saved a number get their starting list when they open the scorecard.
-- This script only copies doctors who already saved something.

-- ===================== CHECK FIRST =====================
select to_regclass('public.kpi_entries') as old_daily_numbers;
select to_regclass('public.doctor_tool_data') as saved_goals_and_extras;
select to_regclass('public.kpi_definitions') as new_measure_list;
select to_regclass('public.kpi_values') as new_daily_numbers;

-- ===================== CHANGE =====================
begin;

create table if not exists public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  kind text not null,
  unit text not null,
  entry_frequency text not null,
  direction text not null,
  aggregation text not null,
  formula text,
  formula_text text,
  enabled boolean not null default true,
  sort_order integer not null,
  goal_value numeric,
  goal_period text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kpi_definitions_user_slug unique (user_id, slug),
  constraint kpi_definitions_kind_check check (kind in ('entered', 'calculated')),
  constraint kpi_definitions_unit_check check (unit in ('count', 'currency', 'percent', 'number')),
  constraint kpi_definitions_frequency_check check (entry_frequency in ('daily', 'weekly')),
  constraint kpi_definitions_direction_check check (direction in ('higher', 'lower')),
  constraint kpi_definitions_aggregation_check check (aggregation in ('sum', 'average', 'latest', 'ratio')),
  constraint kpi_definitions_goal_period_check check (goal_period is null or goal_period in ('daily', 'weekly', 'monthly')),
  constraint kpi_definitions_formula_check check (
    (kind = 'calculated' and formula is not null)
    or (kind = 'entered' and formula is null)
  ),
  constraint kpi_definitions_name_check check (char_length(name) between 1 and 60)
);

create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  definition_id uuid not null references public.kpi_definitions(id) on delete cascade,
  entry_date date not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kpi_values_one_per_day unique (user_id, definition_id, entry_date),
  constraint kpi_values_value_check check (value >= 0 and value <= 1000000000)
);

create index if not exists kpi_definitions_user_sort_idx on public.kpi_definitions (user_id, sort_order);
create index if not exists kpi_values_user_date_idx on public.kpi_values (user_id, entry_date);

alter table public.kpi_definitions enable row level security;
alter table public.kpi_values enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'kpi_definitions_select_own') then
    create policy kpi_definitions_select_own on public.kpi_definitions
      for select using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'kpi_definitions_insert_own') then
    create policy kpi_definitions_insert_own on public.kpi_definitions
      for insert with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'kpi_definitions_update_own') then
    create policy kpi_definitions_update_own on public.kpi_definitions
      for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'kpi_definitions_delete_own') then
    create policy kpi_definitions_delete_own on public.kpi_definitions
      for delete using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'kpi_values_select_own') then
    create policy kpi_values_select_own on public.kpi_values
      for select using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'kpi_values_insert_own') then
    create policy kpi_values_insert_own on public.kpi_values
      for insert with check (
        user_id = (select auth.uid())
        and exists (
          select 1 from public.kpi_definitions d
          where d.id = definition_id and d.user_id = (select auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'kpi_values_update_own') then
    create policy kpi_values_update_own on public.kpi_values
      for update using (user_id = (select auth.uid()))
      with check (
        user_id = (select auth.uid())
        and exists (
          select 1 from public.kpi_definitions d
          where d.id = definition_id and d.user_id = (select auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'kpi_values_delete_own') then
    create policy kpi_values_delete_own on public.kpi_values
      for delete using (user_id = (select auth.uid()));
  end if;
end $$;

revoke all on table public.kpi_definitions from public, anon;
revoke all on table public.kpi_values from public, anon;
grant select, insert, update, delete on table public.kpi_definitions to authenticated;
grant select, insert, update, delete on table public.kpi_values to authenticated;

comment on table public.kpi_definitions is 'Measures each doctor chose to track. Hiding one keeps its history.';
comment on table public.kpi_values is 'One saved number per doctor, per measure, per clinic-local day.';

create temp table kpi_migrate_users (user_id uuid primary key) on commit drop;

do $$
begin
  if to_regclass('public.kpi_entries') is not null then
    execute $q$
      insert into kpi_migrate_users (user_id)
      select distinct user_id from public.kpi_entries
      where user_id is not null
      on conflict do nothing
    $q$;
  end if;
  if to_regclass('public.doctor_tool_data') is not null then
    execute $q$
      insert into kpi_migrate_users (user_id)
      select distinct user_id from public.doctor_tool_data
      where user_id is not null
        and tool in ('kpi_goals', 'kpi_extras', 'kpi_tracker')
      on conflict do nothing
    $q$;
  end if;
end $$;

insert into public.kpi_definitions (
  user_id, slug, name, description, kind, unit, entry_frequency, direction,
  aggregation, formula, formula_text, enabled, sort_order, goal_value, goal_period, is_custom
)
select
  users.user_id,
  defs.slug,
  defs.name,
  defs.description,
  defs.kind,
  defs.unit,
  defs.entry_frequency,
  defs.direction,
  defs.aggregation,
  defs.formula,
  defs.formula_text,
  defs.enabled,
  defs.sort_order,
  defs.goal_value,
  defs.goal_period,
  false
from kpi_migrate_users users
cross join (
  values
  ('patient_visits'::text, 'Patient visits'::text, 'How many patient visits the office saw.'::text, 'entered'::text, 'count'::text, 'daily'::text, 'higher'::text, 'sum'::text, null::text, null::text, true, 10::int, 40::numeric, 'daily'::text),
  ('new_patients', 'New patients', 'People who came in as new patients.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 20, 2, 'daily'),
  ('new_patient_exams', 'New patient exams', 'New-patient exams or consults.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 30, 2, 'daily'),
  ('care_plans_accepted', 'Care plans accepted', 'Care plans (cases) the patient agreed to start.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 40, 1, 'daily'),
  ('pva', 'Patient visit average', 'Patient visits divided by new patients, for the period you are looking at.', 'calculated', 'number', 'daily', 'higher', 'ratio', 'pva', 'Patient visits divided by new patients, for the period you are looking at.', true, 45, 12, null),
  ('case_acceptance_rate', 'Care plan acceptance', 'Care plans accepted divided by new patient exams, shown as a percent.', 'calculated', 'percent', 'daily', 'higher', 'ratio', 'case_acceptance_rate', 'Care plans accepted divided by new patient exams, shown as a percent.', true, 50, 70, null),
  ('reactivations', 'Reactivations', 'Past patients who started care again.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 60, 1, 'daily'),
  ('cancellations', 'Cancellations', 'Visits that were cancelled.', 'entered', 'count', 'daily', 'lower', 'sum', null, null, true, 70, 2, 'daily'),
  ('no_shows', 'No-shows', 'Visits where the patient did not come and did not cancel.', 'entered', 'count', 'daily', 'lower', 'sum', null, null, true, 80, 2, 'daily'),
  ('cancellation_rate', 'Cancellation rate', 'Cancellations divided by visits plus no-shows plus cancellations, shown as a percent.', 'calculated', 'percent', 'daily', 'lower', 'ratio', 'cancellation_rate', 'Cancellations divided by visits plus no-shows plus cancellations, shown as a percent.', true, 85, 10, null),
  ('no_show_rate', 'No-show rate', 'No-shows divided by visits plus no-shows plus cancellations, shown as a percent.', 'calculated', 'percent', 'daily', 'lower', 'ratio', 'no_show_rate', 'No-shows divided by visits plus no-shows plus cancellations, shown as a percent.', true, 90, 10, null),
  ('collections', 'Collections', 'Money collected.', 'entered', 'currency', 'daily', 'higher', 'sum', null, null, true, 100, 2800, 'daily'),
  ('charges', 'Charges billed', 'Services billed, before you count what was collected.', 'entered', 'currency', 'daily', 'higher', 'sum', null, null, true, 110, 3000, 'daily'),
  ('collection_rate', 'Collection rate', 'Collections divided by charges billed, shown as a percent.', 'calculated', 'percent', 'daily', 'higher', 'ratio', 'collection_rate', 'Collections divided by charges billed, shown as a percent.', true, 115, 95, null),
  ('collections_per_visit', 'Collections per visit', 'Collections divided by patient visits.', 'calculated', 'currency', 'daily', 'higher', 'ratio', 'collections_per_visit', 'Collections divided by patient visits.', true, 120, 70, null),
  ('referrals', 'Referrals', 'Patients sent by someone who already trusts the office.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 130, 1, 'daily'),
  ('leads', 'New leads', 'New people who asked about care, from every source.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 140, 1, 'daily'),
  ('neurochiro_leads', 'NeuroChiro leads', 'New leads that came from NeuroChiro.', 'entered', 'count', 'daily', 'higher', 'sum', null, null, true, 150, 1, 'daily'),
  ('neurochiro_lead_share', 'NeuroChiro share of leads', 'NeuroChiro leads divided by all new leads, shown as a percent.', 'calculated', 'percent', 'daily', 'higher', 'ratio', 'neurochiro_lead_share', 'NeuroChiro leads divided by all new leads, shown as a percent.', true, 155, null, null),
  ('google_reviews', 'Google reviews', 'New Google reviews. Enter this once for the week.', 'entered', 'count', 'weekly', 'higher', 'sum', null, null, true, 200, 2, 'weekly'),
  ('dropped_off', 'Patients who dropped off', 'Patients who stopped care. Enter this once for the week.', 'entered', 'count', 'weekly', 'lower', 'sum', null, null, true, 210, 2, 'weekly'),
  ('active_patients', 'Active patients', 'Patients still under care. Enter the current count once a week.', 'entered', 'count', 'weekly', 'higher', 'latest', null, null, true, 220, 150, 'monthly'),
  ('drop_off_rate', 'Drop-off rate', 'Patients who stopped care divided by patients still active plus patients who stopped, shown as a percent.', 'calculated', 'percent', 'weekly', 'lower', 'ratio', 'drop_off_rate', 'Patients who stopped care divided by patients still active plus patients who stopped, shown as a percent.', true, 225, 5, null),
  ('energy', 'Energy', 'How the day felt, from 1 low to 5 high.', 'entered', 'number', 'daily', 'higher', 'average', null, null, false, 900, null, null)
) as defs(slug, name, description, kind, unit, entry_frequency, direction, aggregation, formula, formula_text, enabled, sort_order, goal_value, goal_period)
on conflict (user_id, slug) do nothing;

do $$
begin
  if to_regclass('public.kpi_entries') is not null and to_regclass('public.doctor_tool_data') is not null then
    execute $q$
      insert into public.kpi_values (user_id, definition_id, entry_date, value)
      select e.user_id, d.id, left(e.date::text, 10)::date, v.value
      from public.kpi_entries e
      cross join lateral (
        values
          ('patient_visits'::text, e.patient_visits::numeric),
          ('new_patients', e.new_patients::numeric),
          ('no_shows', e.no_shows::numeric),
          ('collections', case when e.collections is null then null else e.collections::numeric / 100.0 end),
          ('energy', case when e.energy_level::numeric > 0 then e.energy_level::numeric else null end)
      ) as v(slug, value)
      join public.kpi_definitions d on d.user_id = e.user_id and d.slug = v.slug
      where e.user_id is not null
        and v.value is not null
        and left(e.date::text, 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        and not exists (
          select 1 from public.doctor_tool_data f
          where f.user_id = e.user_id and f.tool = 'kpi_v2_imported'
        )
      on conflict (user_id, definition_id, entry_date) do nothing
    $q$;
  elsif to_regclass('public.kpi_entries') is not null then
    execute $q$
      insert into public.kpi_values (user_id, definition_id, entry_date, value)
      select e.user_id, d.id, left(e.date::text, 10)::date, v.value
      from public.kpi_entries e
      cross join lateral (
        values
          ('patient_visits'::text, e.patient_visits::numeric),
          ('new_patients', e.new_patients::numeric),
          ('no_shows', e.no_shows::numeric),
          ('collections', case when e.collections is null then null else e.collections::numeric / 100.0 end),
          ('energy', case when e.energy_level::numeric > 0 then e.energy_level::numeric else null end)
      ) as v(slug, value)
      join public.kpi_definitions d on d.user_id = e.user_id and d.slug = v.slug
      where e.user_id is not null
        and v.value is not null
        and left(e.date::text, 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      on conflict (user_id, definition_id, entry_date) do nothing
    $q$;
  end if;

  if to_regclass('public.doctor_tool_data') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.doctor_tool_data'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%user_id%'
      and pg_get_constraintdef(oid) ilike '%tool%'
  ) then
    raise exception 'doctor_tool_data needs a unique rule on user_id and tool before this script can mark the copy as done.';
  end if;

  execute $q$
    insert into public.kpi_definitions (
      user_id, slug, name, description, kind, unit, entry_frequency, direction,
      aggregation, formula, formula_text, enabled, sort_order, goal_value, goal_period, is_custom
    )
    select t.user_id, x.slug, x.name, x.description, 'entered', x.unit, 'daily', 'higher', 'average', null, null, false, x.sort_order, null, null, false
    from public.doctor_tool_data t
    cross join lateral (
      values
        ('legacy_case_acceptance'::text, 'Case acceptance (earlier entry)'::text, 'A percent typed on the earlier scorecard. The new acceptance rate is calculated from exams and care plans, so this older number is kept separately.'::text, 'percent'::text, 910),
        ('legacy_services_per_visit', 'Services per visit (earlier entry)', 'A number typed on the earlier scorecard. Kept so that entry is not lost.', 'number', 920)
    ) as x(slug, name, description, unit, sort_order)
    where t.tool = 'kpi_extras'
      and not exists (
        select 1 from public.doctor_tool_data f
        where f.user_id = t.user_id and f.tool = 'kpi_v2_imported'
      )
      and (
        (x.slug = 'legacy_case_acceptance' and coalesce(t.data->>'caseAcceptance', '') ~ '^[0-9]+(\.[0-9]+)?$')
        or (x.slug = 'legacy_services_per_visit' and coalesce(t.data->>'servicesPerVisit', '') ~ '^[0-9]+(\.[0-9]+)?$')
      )
    on conflict (user_id, slug) do nothing
  $q$;

  execute $q$
    insert into public.kpi_values (user_id, definition_id, entry_date, value)
    select t.user_id, d.id, (t.data->>'date')::date, x.value
    from public.doctor_tool_data t
    cross join lateral (
      values
        ('referrals'::text, case when coalesce(t.data->>'referrals', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'referrals')::numeric else null end),
        ('reactivations', case when coalesce(t.data->>'reactivations', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'reactivations')::numeric else null end),
        ('legacy_case_acceptance', case when coalesce(t.data->>'caseAcceptance', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'caseAcceptance')::numeric else null end),
        ('legacy_services_per_visit', case when coalesce(t.data->>'servicesPerVisit', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'servicesPerVisit')::numeric else null end)
    ) as x(slug, value)
    join public.kpi_definitions d on d.user_id = t.user_id and d.slug = x.slug
    where t.tool = 'kpi_extras'
      and x.value is not null
      and coalesce(t.data->>'date', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      and not exists (
        select 1 from public.doctor_tool_data f
        where f.user_id = t.user_id and f.tool = 'kpi_v2_imported'
      )
    on conflict (user_id, definition_id, entry_date) do nothing
  $q$;

  execute $q$
    update public.kpi_definitions d
    set goal_value = g.goal_value,
        goal_period = 'daily',
        updated_at = now()
    from (
      select t.user_id, x.slug, x.goal_value, x.default_goal
      from public.doctor_tool_data t
      cross join lateral (
        values
          ('patient_visits'::text, case when coalesce(t.data->>'visits', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'visits')::numeric else null end, 40::numeric),
          ('new_patients', case when coalesce(t.data->>'newPatients', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'newPatients')::numeric else null end, 2::numeric),
          ('collections', case when coalesce(t.data->>'collections', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'collections')::numeric / 100.0 else null end, 2800::numeric),
          ('no_shows', case when coalesce(t.data->>'noShows', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'noShows')::numeric else null end, 2::numeric),
          ('referrals', case when coalesce(t.data->>'referrals', '') ~ '^[0-9]+(\.[0-9]+)?$' then (t.data->>'referrals')::numeric else null end, 1::numeric)
      ) as x(slug, goal_value, default_goal)
      where t.tool = 'kpi_goals'
        and x.goal_value is not null
        and not exists (
          select 1 from public.doctor_tool_data f
          where f.user_id = t.user_id and f.tool = 'kpi_v2_imported'
        )
    ) g
    where d.user_id = g.user_id
      and d.slug = g.slug
      and d.goal_value = g.default_goal
  $q$;

  execute $q$
    update public.kpi_definitions d
    set enabled = true,
        updated_at = now()
    where d.slug = 'energy'
      and d.enabled = false
      and exists (
        select 1 from public.kpi_values v
        where v.definition_id = d.id and v.value > 0
      )
      and not exists (
        select 1 from public.doctor_tool_data f
        where f.user_id = d.user_id and f.tool = 'kpi_v2_imported'
      )
  $q$;

  execute $q$
    insert into public.doctor_tool_data (user_id, tool, data, updated_at)
    select user_id, 'kpi_v2_imported', '{"source":"sql"}'::jsonb, now()
    from kpi_migrate_users
    on conflict (user_id, tool) do nothing
  $q$;
end $$;

commit;
