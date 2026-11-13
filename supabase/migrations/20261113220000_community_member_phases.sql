-- Phases 2–5: This week, exercise sets, care passport, care invitations, work interest.
-- Does not change profiles.role. Community accounts stay role 'patient'.
-- Does not touch billing, applications, or member referrals.
-- Safe to run more than once. Do not apply from the app server.

begin;

create table if not exists public.community_week_checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  feeling text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_week_feeling_check check (feeling in ('doing_well', 'a_little_off', 'want_to_talk')),
  constraint community_week_unique unique (profile_id, week_start)
);

create table if not exists public.community_live_questions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  show_date date not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_live_question_len check (char_length(btrim(body)) between 8 and 280),
  constraint community_live_question_unique unique (profile_id, show_date)
);

create index if not exists community_live_questions_show_idx
  on public.community_live_questions (show_date desc, created_at desc);

create table if not exists public.community_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  title text not null,
  note text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  constraint community_exercise_title_len check (char_length(btrim(title)) between 3 and 80),
  constraint community_exercise_note_len check (note is null or char_length(note) <= 240)
);

create table if not exists public.community_exercise_steps (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.community_exercise_sets(id) on delete cascade,
  position int not null,
  label text not null,
  constraint community_exercise_step_pos check (position between 1 and 8),
  constraint community_exercise_step_len check (char_length(btrim(label)) between 3 and 160),
  constraint community_exercise_step_unique unique (set_id, position)
);

create table if not exists public.community_exercise_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  set_id uuid not null references public.community_exercise_sets(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  reminder_enabled boolean not null default false,
  share_on_passport boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_exercise_assignment_status check (status in ('active', 'done'))
);

create index if not exists community_exercise_assignments_profile_idx
  on public.community_exercise_assignments (profile_id, created_at desc);

create table if not exists public.community_exercise_step_done (
  assignment_id uuid not null references public.community_exercise_assignments(id) on delete cascade,
  step_id uuid not null references public.community_exercise_steps(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, step_id)
);

create table if not exists public.community_passport_trips (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  place_label text not null,
  city text,
  state_code text,
  country_code text,
  starts_on date not null,
  ends_on date not null,
  kind text not null default 'trip',
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  constraint community_trip_kind_check check (kind in ('trip', 'move', 'second_look')),
  constraint community_trip_status_check check (status in ('upcoming', 'closed')),
  constraint community_trip_dates_check check (ends_on >= starts_on),
  constraint community_trip_place_len check (char_length(btrim(place_label)) between 2 and 80)
);

create index if not exists community_trips_profile_idx
  on public.community_passport_trips (profile_id, starts_on desc);

create table if not exists public.community_passport_introductions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.community_passport_trips(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  shared_first_name text,
  home_clinic_label text,
  family_first_names text,
  exercise_titles text,
  note text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  constraint community_intro_status_check check (status in ('sent', 'seen')),
  constraint community_intro_note_len check (note is null or char_length(note) <= 280)
);

create index if not exists community_intro_doctor_idx
  on public.community_passport_introductions (doctor_id, created_at desc);

create index if not exists community_intro_profile_idx
  on public.community_passport_introductions (profile_id, created_at desc);

create table if not exists public.community_care_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_words text not null,
  place_label text not null,
  city text,
  state_code text,
  country_code text,
  doctor_id uuid references public.doctors(id) on delete set null,
  note text,
  status text not null default 'sent',
  opened_at timestamptz,
  found_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_invite_token_unique unique (token),
  constraint community_invite_token_len check (char_length(token) between 20 and 64),
  constraint community_invite_status_check check (status in ('sent', 'opened', 'found')),
  constraint community_invite_words_len check (char_length(btrim(recipient_words)) between 2 and 80),
  constraint community_invite_note_len check (note is null or char_length(note) <= 280)
);

create index if not exists community_invites_sender_idx
  on public.community_care_invitations (sender_profile_id, created_at desc);

create table if not exists public.community_work_interest (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  place_label text not null,
  city text,
  state_code text,
  country_code text,
  note text,
  share_contact boolean not null default false,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_work_path_check check (path in ('ca', 'front_desk', 'student')),
  constraint community_work_status_check check (status in ('open', 'connected', 'closed')),
  constraint community_work_note_len check (note is null or char_length(note) <= 280)
);

create index if not exists community_work_place_idx
  on public.community_work_interest (state_code, country_code, status);

create index if not exists community_work_profile_idx
  on public.community_work_interest (profile_id, created_at desc);

create table if not exists public.community_work_connections (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null references public.community_work_interest(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_work_connection_unique unique (interest_id, doctor_id)
);

insert into public.community_exercise_sets (id, doctor_id, title, note, is_sample)
values (
  'a11ce000-0000-4000-8000-000000000001',
  null,
  'Sample · how a set looks',
  'This is sample content so you can see a set. It is not care, and it is not from a doctor.',
  true
)
on conflict (id) do nothing;

insert into public.community_exercise_steps (set_id, position, label)
values
  ('a11ce000-0000-4000-8000-000000000001', 1, 'Read the title your doctor wrote for you'),
  ('a11ce000-0000-4000-8000-000000000001', 2, 'Follow the step they gave you, in their words'),
  ('a11ce000-0000-4000-8000-000000000001', 3, 'Mark the step done here when you have done it')
on conflict (set_id, position) do nothing;

alter table public.community_week_checkins enable row level security;
alter table public.community_live_questions enable row level security;
alter table public.community_exercise_sets enable row level security;
alter table public.community_exercise_steps enable row level security;
alter table public.community_exercise_assignments enable row level security;
alter table public.community_exercise_step_done enable row level security;
alter table public.community_passport_trips enable row level security;
alter table public.community_passport_introductions enable row level security;
alter table public.community_care_invitations enable row level security;
alter table public.community_work_interest enable row level security;
alter table public.community_work_connections enable row level security;

revoke all on table public.community_week_checkins from public, anon;
revoke all on table public.community_live_questions from public, anon;
revoke all on table public.community_exercise_sets from public, anon;
revoke all on table public.community_exercise_steps from public, anon;
revoke all on table public.community_exercise_assignments from public, anon;
revoke all on table public.community_exercise_step_done from public, anon;
revoke all on table public.community_passport_trips from public, anon;
revoke all on table public.community_passport_introductions from public, anon;
revoke all on table public.community_care_invitations from public, anon;
revoke all on table public.community_work_interest from public, anon;
revoke all on table public.community_work_connections from public, anon;

grant select, insert, update, delete on table public.community_week_checkins to authenticated;
grant select, insert, delete on table public.community_live_questions to authenticated;
grant select, insert on table public.community_exercise_sets to authenticated;
grant select, insert on table public.community_exercise_steps to authenticated;
grant select, insert, update on table public.community_exercise_assignments to authenticated;
grant select, insert, delete on table public.community_exercise_step_done to authenticated;
grant select, insert, update, delete on table public.community_passport_trips to authenticated;
grant select, insert, update, delete on table public.community_passport_introductions to authenticated;
grant select, insert, update, delete on table public.community_care_invitations to authenticated;
grant select, insert, update, delete on table public.community_work_interest to authenticated;
grant select on table public.community_work_connections to authenticated;

drop policy if exists community_week_owner_all on public.community_week_checkins;
create policy community_week_owner_all
  on public.community_week_checkins
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_live_owner_all on public.community_live_questions;
create policy community_live_owner_all
  on public.community_live_questions
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Questions for the show are read through the server for doctors.
-- There is no doctor select policy, so a doctor cannot list who asked.

drop policy if exists community_sets_read on public.community_exercise_sets;
create policy community_sets_read
  on public.community_exercise_sets
  for select
  to authenticated
  using (
    is_sample
    or doctor_id in (select id from public.doctors where user_id = auth.uid())
    or id in (select set_id from public.community_exercise_assignments where profile_id = auth.uid())
  );

drop policy if exists community_sets_doctor_insert on public.community_exercise_sets;
create policy community_sets_doctor_insert
  on public.community_exercise_sets
  for insert
  to authenticated
  with check (
    is_sample = false
    and doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

drop policy if exists community_steps_read on public.community_exercise_steps;
create policy community_steps_read
  on public.community_exercise_steps
  for select
  to authenticated
  using (
    set_id in (
      select id from public.community_exercise_sets
      where is_sample
        or doctor_id in (select id from public.doctors where user_id = auth.uid())
        or id in (select set_id from public.community_exercise_assignments where profile_id = auth.uid())
    )
  );

drop policy if exists community_steps_doctor_insert on public.community_exercise_steps;
create policy community_steps_doctor_insert
  on public.community_exercise_steps
  for insert
  to authenticated
  with check (
    set_id in (
      select id from public.community_exercise_sets
      where doctor_id in (select id from public.doctors where user_id = auth.uid())
    )
  );

drop policy if exists community_assignments_owner_all on public.community_exercise_assignments;
create policy community_assignments_owner_all
  on public.community_exercise_assignments
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_assignments_doctor_select on public.community_exercise_assignments;
create policy community_assignments_doctor_select
  on public.community_exercise_assignments
  for select
  to authenticated
  using (doctor_id in (select id from public.doctors where user_id = auth.uid()));

drop policy if exists community_step_done_owner on public.community_exercise_step_done;
create policy community_step_done_owner
  on public.community_exercise_step_done
  for all
  to authenticated
  using (
    assignment_id in (select id from public.community_exercise_assignments where profile_id = auth.uid())
  )
  with check (
    assignment_id in (select id from public.community_exercise_assignments where profile_id = auth.uid())
  );

drop policy if exists community_trips_owner_all on public.community_passport_trips;
create policy community_trips_owner_all
  on public.community_passport_trips
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_intro_owner_all on public.community_passport_introductions;
create policy community_intro_owner_all
  on public.community_passport_introductions
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_intro_doctor_select on public.community_passport_introductions;
create policy community_intro_doctor_select
  on public.community_passport_introductions
  for select
  to authenticated
  using (doctor_id in (select id from public.doctors where user_id = auth.uid()));

drop policy if exists community_intro_doctor_update on public.community_passport_introductions;
create policy community_intro_doctor_update
  on public.community_passport_introductions
  for update
  to authenticated
  using (doctor_id in (select id from public.doctors where user_id = auth.uid()))
  with check (doctor_id in (select id from public.doctors where user_id = auth.uid()));

drop policy if exists community_invites_owner_all on public.community_care_invitations;
create policy community_invites_owner_all
  on public.community_care_invitations
  for all
  to authenticated
  using (sender_profile_id = auth.uid())
  with check (sender_profile_id = auth.uid());

drop policy if exists community_work_owner_all on public.community_work_interest;
create policy community_work_owner_all
  on public.community_work_interest
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_work_connections_member_select on public.community_work_connections;
create policy community_work_connections_member_select
  on public.community_work_connections
  for select
  to authenticated
  using (
    interest_id in (select id from public.community_work_interest where profile_id = auth.uid())
    or doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

commit;
