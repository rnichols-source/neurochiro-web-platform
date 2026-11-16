-- NOT RUN — apply in order after the earlier student migrations.
-- Additive only. Creates the tables the student portal saves into, and lets a mentorship
-- request open a conversation. Does not change existing rows.

create table if not exists public.financial_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.technique_quiz_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quiz_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  contract_text text,
  analysis_results jsonb,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists contracts_user_idx on public.contracts (user_id, created_at desc);

create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  message text not null,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined')),
  doctor_reply text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists mentorship_requests_doctor_idx on public.mentorship_requests (doctor_id, created_at desc);
create index if not exists mentorship_requests_student_idx on public.mentorship_requests (student_id, status);

alter table public.financial_plans enable row level security;
alter table public.technique_quiz_state enable row level security;
alter table public.contracts enable row level security;
alter table public.mentorship_requests enable row level security;

drop policy if exists financial_plans_own on public.financial_plans;
create policy financial_plans_own on public.financial_plans
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists technique_quiz_state_own on public.technique_quiz_state;
create policy technique_quiz_state_own on public.technique_quiz_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists contracts_own on public.contracts;
create policy contracts_own on public.contracts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists mentorship_requests_student_read on public.mentorship_requests;
create policy mentorship_requests_student_read on public.mentorship_requests
  for select to authenticated
  using (student_id = auth.uid());

drop policy if exists mentorship_requests_doctor_read on public.mentorship_requests;
create policy mentorship_requests_doctor_read on public.mentorship_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.doctors d
      where d.id = mentorship_requests.doctor_id
        and d.user_id = auth.uid()
    )
  );

-- Writes go through the admin client. Students and doctors can read their own rows.

alter table public.conversations drop constraint if exists conversations_context_type_check;
alter table public.conversations
  add constraint conversations_context_type_check
  check (
    context_type is null
    or context_type in ('referral', 'job_application', 'chiromatch', 'direct', 'broadcast', 'shadow', 'match', 'mentorship')
  );
