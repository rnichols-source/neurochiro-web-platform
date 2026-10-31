-- NOT RUN — Raymond reviews and runs
-- Student membership: calls, roadmap, shadow days, AI usage, seminar audience.
-- Idempotent. Safe to re-run. Does not email anyone.

alter table public.doctors add column if not exists open_to_students boolean default false;
alter table public.doctors add column if not exists offers_shadowing boolean default false;
alter table public.doctors add column if not exists accepts_interns boolean default false;
alter table public.doctors add column if not exists student_note text;
alter table public.profiles add column if not exists student_past_due_since timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'doctors' and column_name = 'student_note'
  ) then
    alter table public.doctors drop constraint if exists doctors_student_note_len;
    alter table public.doctors add constraint doctors_student_note_len check (student_note is null or char_length(student_note) <= 280);
  end if;
end $$;

create table if not exists public.student_calls (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  duration_min int default 60,
  topic text,
  description text,
  guest_doctor_id uuid references public.doctors(id),
  guest_name text,
  recording_url text,
  status text not null default 'scheduled' check (status in ('scheduled','live','done','cancelled')),
  created_by uuid,
  announced_at timestamptz,
  recording_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.student_call_secrets (
  call_id uuid primary key references public.student_calls(id) on delete cascade,
  join_url text not null
);

create table if not exists public.student_call_rsvps (
  call_id uuid not null references public.student_calls(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  reminded_24h_at timestamptz,
  reminded_1h_at timestamptz,
  primary key (call_id, user_id)
);

create table if not exists public.student_roadmap_progress (
  user_id uuid not null,
  step_key text not null,
  done_at timestamptz not null default now(),
  primary key (user_id, step_key)
);

create table if not exists public.shadow_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  doctor_id uuid not null references public.doctors(id),
  proposed_dates date[],
  message text,
  status text not null default 'requested' check (status in ('requested','accepted','declined','cancelled','completed')),
  doctor_reply text,
  decided_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null,
  feature text not null,
  used_on date not null,
  count int not null default 0,
  primary key (user_id, feature, used_on)
);

create table if not exists public.student_notices (
  user_id uuid not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.seminar_ticket_types add column if not exists audience text default 'all';
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'seminar_ticket_types' and column_name = 'audience'
  ) then
    alter table public.seminar_ticket_types drop constraint if exists seminar_ticket_types_audience_check;
    alter table public.seminar_ticket_types add constraint seminar_ticket_types_audience_check check (audience in ('all','student'));
  end if;
exception when undefined_table then
  null;
end $$;

alter table public.student_calls enable row level security;
alter table public.student_call_secrets enable row level security;
alter table public.student_call_rsvps enable row level security;
alter table public.student_roadmap_progress enable row level security;
alter table public.shadow_requests enable row level security;
alter table public.ai_usage enable row level security;
alter table public.student_notices enable row level security;

-- join links live only in student_call_secrets. No client policies on that table.

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'student_calls' and policyname = 'Authenticated can read scheduled calls') then
    create policy "Authenticated can read scheduled calls" on public.student_calls
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'student_call_rsvps' and policyname = 'RSVP own rows') then
    create policy "RSVP own rows" on public.student_call_rsvps
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'student_roadmap_progress' and policyname = 'Roadmap own rows') then
    create policy "Roadmap own rows" on public.student_roadmap_progress
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shadow_requests' and policyname = 'Student reads own shadow requests') then
    create policy "Student reads own shadow requests" on public.shadow_requests
      for select to authenticated using (student_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shadow_requests' and policyname = 'Doctor reads own shadow requests') then
    create policy "Doctor reads own shadow requests" on public.shadow_requests
      for select to authenticated using (
        exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id::text = auth.uid()::text)
      );
  end if;
end $$;

-- profiles.tier: student_paid is already stored in production. student_comped is
-- the scholarship tier. Do not replace profiles_tier_check here. A replacement
-- limited to free/pro/neuros/student_paid/student_comped would reject other
-- live values such as basic or growth. If an insert of student_comped fails
-- the check, widen the existing constraint in the SQL editor and keep every
-- tier value the audit shows.
