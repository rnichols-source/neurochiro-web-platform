-- Doctor request pipeline.
-- Stages and dated history only. No phone, email, message, or health details.
-- Contact info stays on the source row the patient already sent to that doctor.
-- A doctor-to-doctor referral phone stays on doctor_referrals and is still hidden until accept.
-- Apply this file in the Supabase SQL editor before merging. Do not run it from the app.

begin;

create table if not exists public.doctor_request_pipeline (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  source text not null,
  source_id uuid not null,
  stage text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_request_pipeline_source_check check (source in ('visit', 'lead', 'contact_request')),
  constraint doctor_request_pipeline_stage_check check (stage in (
    'requested', 'contacted', 'scheduled', 'started_care', 'not_a_fit', 'no_answer', 'went_elsewhere'
  )),
  constraint doctor_request_pipeline_source_unique unique (source, source_id)
);

create index if not exists doctor_request_pipeline_doctor_idx
  on public.doctor_request_pipeline (doctor_id, stage);

create table if not exists public.doctor_request_stage_events (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.doctor_request_pipeline(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  stage text not null,
  happened_at timestamptz not null default now(),
  constraint doctor_request_stage_events_stage_check check (stage in (
    'requested', 'contacted', 'scheduled', 'started_care', 'not_a_fit', 'no_answer', 'went_elsewhere'
  ))
);

create index if not exists doctor_request_stage_events_doctor_month_idx
  on public.doctor_request_stage_events (doctor_id, happened_at);

-- Current lead stage only. Contact columns are not copied.
insert into public.doctor_request_pipeline (doctor_id, source, source_id, stage, created_at, updated_at)
select
  doctor_id,
  'lead',
  id,
  case
    when stage = 'converted' then 'started_care'
    when stage = 'scheduled' then 'scheduled'
    when stage = 'contacted' then 'contacted'
    else 'requested'
  end,
  coalesce(created_at, now()),
  now()
from public.leads
where doctor_id is not null
on conflict (source, source_id) do nothing;

insert into public.doctor_request_stage_events (pipeline_id, doctor_id, stage, happened_at)
select p.id, p.doctor_id, p.stage, p.created_at
from public.doctor_request_pipeline p
where p.source = 'lead'
and not exists (
  select 1 from public.doctor_request_stage_events e where e.pipeline_id = p.id
);

insert into public.doctor_request_pipeline (doctor_id, source, source_id, stage, created_at, updated_at)
select
  doctor_id,
  'visit',
  id,
  case when status = 'seen' then 'contacted' else 'requested' end,
  created_at,
  now()
from public.community_visit_requests
where status in ('requested', 'seen')
on conflict (source, source_id) do nothing;

insert into public.doctor_request_stage_events (pipeline_id, doctor_id, stage, happened_at)
select p.id, p.doctor_id, 'requested', v.created_at
from public.doctor_request_pipeline p
join public.community_visit_requests v on v.id = p.source_id
where p.source = 'visit'
and not exists (
  select 1 from public.doctor_request_stage_events e where e.pipeline_id = p.id
);

insert into public.doctor_request_stage_events (pipeline_id, doctor_id, stage, happened_at)
select p.id, p.doctor_id, 'contacted', coalesce(v.seen_at, v.created_at)
from public.doctor_request_pipeline p
join public.community_visit_requests v on v.id = p.source_id
where p.source = 'visit' and p.stage = 'contacted'
and not exists (
  select 1 from public.doctor_request_stage_events e
  where e.pipeline_id = p.id and e.stage = 'contacted'
);

alter table public.doctor_request_pipeline enable row level security;
alter table public.doctor_request_stage_events enable row level security;

revoke all on table public.doctor_request_pipeline from public, anon;
revoke all on table public.doctor_request_stage_events from public, anon;

grant select, insert, update on table public.doctor_request_pipeline to authenticated;
grant select, insert on table public.doctor_request_stage_events to authenticated;

drop policy if exists doctor_request_pipeline_owner on public.doctor_request_pipeline;
create policy doctor_request_pipeline_owner
  on public.doctor_request_pipeline
  for all
  to authenticated
  using (doctor_id in (select id from public.doctors where user_id = (select auth.uid())))
  with check (doctor_id in (select id from public.doctors where user_id = (select auth.uid())));

drop policy if exists doctor_request_stage_events_owner_select on public.doctor_request_stage_events;
create policy doctor_request_stage_events_owner_select
  on public.doctor_request_stage_events
  for select
  to authenticated
  using (doctor_id in (select id from public.doctors where user_id = (select auth.uid())));

drop policy if exists doctor_request_stage_events_owner_insert on public.doctor_request_stage_events;
create policy doctor_request_stage_events_owner_insert
  on public.doctor_request_stage_events
  for insert
  to authenticated
  with check (doctor_id in (select id from public.doctors where user_id = (select auth.uid())));

-- Admin ROI. Counts only. No names, phones, emails, or notes.
-- Month is UTC. Read with the service role (admin client).
create or replace view public.doctor_pipeline_monthly as
select
  doctor_id,
  date_trunc('month', happened_at) as month_start,
  count(*) filter (where stage = 'scheduled')::int as scheduled_count,
  count(*) filter (where stage = 'started_care')::int as started_care_count
from public.doctor_request_stage_events
group by 1, 2;

comment on view public.doctor_pipeline_monthly is
  'Admin ROI. Scheduled and Started care events per doctor per UTC month. No contact info. Read with the service role.';

revoke all on public.doctor_pipeline_monthly from public, anon, authenticated;
grant select on public.doctor_pipeline_monthly to service_role;

create table if not exists public.doctor_help_messages (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete set null,
  user_id uuid,
  name text,
  email text,
  clinic text,
  topic text,
  message text not null,
  created_at timestamptz not null default now(),
  constraint doctor_help_message_len check (char_length(message) between 1 and 4000)
);

alter table public.doctor_help_messages enable row level security;
revoke all on table public.doctor_help_messages from public, anon;
grant insert, select on table public.doctor_help_messages to authenticated;

drop policy if exists doctor_help_messages_owner on public.doctor_help_messages;
create policy doctor_help_messages_owner
  on public.doctor_help_messages
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.doctors
  add column if not exists getting_started_dismissed_at timestamptz;

alter table public.community_exercise_assignments
  add column if not exists opened_at timestamptz;

alter table public.community_doctor_care_invites
  add column if not exists set_id uuid references public.community_exercise_sets(id) on delete set null;

alter table public.community_doctor_care_invites
  alter column plan_slug drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_doctor_care_invites_plan_or_set'
  ) then
    alter table public.community_doctor_care_invites
      add constraint community_doctor_care_invites_plan_or_set
      check (plan_slug is not null or set_id is not null);
  end if;
end $$;

drop policy if exists community_library_done_doctor_select on public.community_library_exercise_done;
create policy community_library_done_doctor_select
  on public.community_library_exercise_done
  for select
  to authenticated
  using (
    assignment_id in (
      select id from public.community_exercise_assignments
      where doctor_id in (select id from public.doctors where user_id = (select auth.uid()))
    )
  );

drop policy if exists community_step_done_doctor_select on public.community_exercise_step_done;
create policy community_step_done_doctor_select
  on public.community_exercise_step_done
  for select
  to authenticated
  using (
    assignment_id in (
      select id from public.community_exercise_assignments
      where doctor_id in (select id from public.doctors where user_id = (select auth.uid()))
    )
  );

commit;
