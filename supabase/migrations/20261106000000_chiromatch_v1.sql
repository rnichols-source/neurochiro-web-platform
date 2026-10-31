-- NOT RUN — Raymond reviews and runs
-- ChiroMatch v1. Always-on mutual match. Does not email anyone. Does not delete rows.
-- Does not change match_cycles or the older match tables.
-- Answer keys are checked in src/config/match-questions.ts, not in a SQL check.
-- Run the student and job-board migrations before this file.

alter table public.doctors add column if not exists booking_url text;

create table if not exists public.match_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  side text not null check (side in ('student', 'doctor')),
  doctor_id uuid null references public.doctors(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  visible boolean not null default true,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.match_interests (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('interested', 'not_now')),
  decided_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user)
);

create index if not exists match_interests_to_user_idx on public.match_interests (to_user);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users(id) on delete cascade,
  doctor_user_id uuid not null references auth.users(id) on delete cascade,
  score int not null,
  score_version text not null,
  factors jsonb not null default '{}'::jsonb,
  reasons text[] not null default '{}',
  conversation_id uuid null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_reason text,
  unique (student_user_id, doctor_user_id)
);

create index if not exists matches_student_idx on public.matches (student_user_id);
create index if not exists matches_doctor_idx on public.matches (doctor_user_id);

create table if not exists public.match_outcomes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('talked', 'shadow_booked', 'shadow_done', 'interviewed', 'offer', 'hired', 'not_a_fit', 'no_reply')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.match_weights (
  version text primary key,
  weights jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seed is commented. v1 weights live in src/lib/match/score.ts until Raymond approves a change.
-- insert into public.match_weights (version, weights, active)
-- values ('v1', '{"technique":25,"patient_focus":15,"practice_model":15,"location":15,"start_window":10,"comp_model":10,"practice_size":5,"care_style":5}'::jsonb, true);

create table if not exists public.match_outcome_tokens (
  token_hash text primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.match_outcome_prompts (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.match_profiles enable row level security;
alter table public.match_interests enable row level security;
alter table public.matches enable row level security;
alter table public.match_outcomes enable row level security;
alter table public.match_weights enable row level security;
alter table public.match_outcome_tokens enable row level security;
alter table public.match_outcome_prompts enable row level security;

drop policy if exists match_profiles_select on public.match_profiles;
create policy match_profiles_select on public.match_profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists match_profiles_insert on public.match_profiles;
create policy match_profiles_insert on public.match_profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists match_profiles_update on public.match_profiles;
create policy match_profiles_update on public.match_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists match_interests_select on public.match_interests;
create policy match_interests_select on public.match_interests
  for select to authenticated using (from_user = auth.uid());

drop policy if exists match_interests_insert on public.match_interests;
create policy match_interests_insert on public.match_interests
  for insert to authenticated with check (from_user = auth.uid());

drop policy if exists match_interests_update on public.match_interests;
create policy match_interests_update on public.match_interests
  for update to authenticated using (from_user = auth.uid()) with check (from_user = auth.uid());

drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated
  using (student_user_id = auth.uid() or doctor_user_id = auth.uid());

drop policy if exists match_outcomes_select on public.match_outcomes;
create policy match_outcomes_select on public.match_outcomes
  for select to authenticated using (reported_by = auth.uid());

drop policy if exists match_outcomes_insert on public.match_outcomes;
create policy match_outcomes_insert on public.match_outcomes
  for insert to authenticated
  with check (
    reported_by = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.student_user_id = auth.uid() or m.doctor_user_id = auth.uid())
    )
  );

-- match_weights, match_outcome_tokens, and match_outcome_prompts have no client policies.

do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.conversations'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%context_type%';
  if cname is not null then
    execute format('alter table public.conversations drop constraint %I', cname);
  end if;
exception when undefined_table then
  null;
end $$;

alter table public.conversations drop constraint if exists conversations_context_type_check;
alter table public.conversations
  add constraint conversations_context_type_check
  check (
    context_type is null
    or context_type in ('referral', 'job_application', 'chiromatch', 'direct', 'broadcast', 'shadow', 'match')
  );

create or replace function public.create_match_if_mutual(
  p_student uuid,
  p_doctor uuid,
  p_score int,
  p_version text,
  p_factors jsonb,
  p_reasons text[]
) returns table (id uuid, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  inserted_id uuid;
begin
  if not exists (
    select 1 from public.match_interests
    where from_user = p_student and to_user = p_doctor and decision = 'interested'
  ) or not exists (
    select 1 from public.match_interests
    where from_user = p_doctor and to_user = p_student and decision = 'interested'
  ) then
    return;
  end if;

  select m.id into existing_id
  from public.matches m
  where m.student_user_id = p_student and m.doctor_user_id = p_doctor;

  if existing_id is not null then
    return query select existing_id, false;
    return;
  end if;

  insert into public.matches (student_user_id, doctor_user_id, score, score_version, factors, reasons)
  values (p_student, p_doctor, p_score, p_version, p_factors, p_reasons)
  on conflict (student_user_id, doctor_user_id) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    return query select inserted_id, true;
    return;
  end if;

  select m.id into existing_id
  from public.matches m
  where m.student_user_id = p_student and m.doctor_user_id = p_doctor;
  if existing_id is not null then
    return query select existing_id, false;
  end if;
end;
$$;

revoke all on function public.create_match_if_mutual(uuid, uuid, int, text, jsonb, text[]) from public;
grant execute on function public.create_match_if_mutual(uuid, uuid, int, text, jsonb, text[]) to service_role;
