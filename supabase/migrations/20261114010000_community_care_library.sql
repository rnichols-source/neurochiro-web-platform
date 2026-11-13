-- NeuroChiro exercise library assignments and family-remedy account data.
-- Plan and remedy wording lives in the app. This migration stores the 28 plan
-- slugs, who a plan was assigned to, and a community member's own checks.
-- Does not change profiles.role. Does not touch billing, applications, or referrals.
-- Does not add a medication calculator. Safe to run more than once.
-- Do not apply from the app server.

begin;

create table if not exists public.community_library_plans (
  slug text primary key,
  title text not null,
  category text not null,
  sort_order int not null,
  constraint community_library_plan_slug check (slug ~ '^[a-z0-9-]{2,64}$'),
  constraint community_library_plan_category check (category in (
    'spine', 'neck', 'shoulder', 'hip', 'knee', 'hand', 'head', 'core', 'posture', 'prenatal', 'lifestyle', 'recovery'
  ))
);

insert into public.community_library_plans (slug, title, category, sort_order) values
  ('si-joint', $plan$SI Joint Stability & Pelvic Rebalancing$plan$, 'hip', 1),
  ('anterior-pelvic-tilt', $plan$Anterior Pelvic Tilt Correction$plan$, 'hip', 2),
  ('weekend-joint', $plan$Weekend Joint Protection Plan$plan$, 'lifestyle', 3),
  ('low-back-relief', $plan$Low Back Relief Plan$plan$, 'spine', 4),
  ('shoulder-pain', $plan$Shoulder Pain Relief$plan$, 'shoulder', 5),
  ('neck-pain', $plan$Neck Pain & Cervico-Thoracic Support$plan$, 'neck', 6),
  ('thoracic-mobility', $plan$Thoracic Mobility + Rib Cage Reset$plan$, 'spine', 7),
  ('lumbosacral-disc', $plan$Lumbosacral Disc Recovery Plan$plan$, 'spine', 8),
  ('shoulder-stability', $plan$Shoulder Stability & Rotator Cuff Rebuild$plan$, 'shoulder', 9),
  ('elbow-wrist-relief', $plan$Elbow & Wrist Relief Plan$plan$, 'hand', 10),
  ('cervicogenic-headaches', $plan$Cervicogenic Headaches / Atlas-Axis Reset (C0–C2)$plan$, 'head', 11),
  ('tech-neck-forward-head', $plan$Tech Neck & Forward Head Posture Recovery Plan$plan$, 'posture', 12),
  ('lumbar-facet-syndrome', $plan$Lumbar Facet Syndrome / Extension Intolerance Recovery Plan$plan$, 'spine', 13),
  ('knee-rebuild', $plan$Knee Rebuild Plan (Tracking / Tendon / Arthritis)$plan$, 'knee', 14),
  ('ankle-foot-realignment', $plan$Ankle & Foot Realignment Plan$plan$, 'knee', 15),
  ('tmj-jaw-pain', $plan$TMJ Reset & Jaw Pain Relief Plan$plan$, 'head', 16),
  ('vestibular-reset-dizziness', $plan$Vestibular Reset & Dizziness Protocol$plan$, 'head', 17),
  ('lateral-knee-injury', $plan$Lateral Knee Injury Recovery Plan$plan$, 'knee', 18),
  ('pregnancy-pelvic-balance', $plan$Pregnancy Pelvic Balance Plan$plan$, 'prenatal', 19),
  ('tight-hips-relief', $plan$Tight Hips Relief & Mobility$plan$, 'hip', 20),
  ('meditation-breathwork', $plan$Meditation & Breathwork Guide$plan$, 'lifestyle', 21),
  ('daily-spinal-hygiene', $plan$Daily Spinal Hygiene Routine$plan$, 'spine', 22),
  ('hip-flexor-injury-recovery', $plan$Hip Flexor Injury Recovery$plan$, 'hip', 23),
  ('core-training-low-back', $plan$Core Training for Low Back Pain$plan$, 'core', 24),
  ('tailbone-pain-recovery', $plan$Tailbone Pain Recovery Protocol$plan$, 'hip', 25),
  ('thoracic-outlet-syndrome', $plan$Thoracic Outlet Syndrome Recovery$plan$, 'neck', 26),
  ('desk-posture', $plan$Posture Reset for Desk Workers$plan$, 'posture', 27),
  ('stress-nervous', $plan$Vagus Nerve Stimulation & Nervous System Reset$plan$, 'lifestyle', 28)
on conflict (slug) do nothing;

alter table public.community_exercise_assignments
  add column if not exists library_plan_slug text references public.community_library_plans (slug),
  add column if not exists doctor_note text;

alter table public.community_exercise_assignments
  alter column set_id drop not null;

alter table public.community_exercise_assignments
  drop constraint if exists community_exercise_assignment_target;

alter table public.community_exercise_assignments
  add constraint community_exercise_assignment_target check (
    (set_id is not null and library_plan_slug is null)
    or (set_id is null and library_plan_slug is not null)
  );

alter table public.community_exercise_assignments
  drop constraint if exists community_exercise_doctor_note_len;

alter table public.community_exercise_assignments
  add constraint community_exercise_doctor_note_len check (
    doctor_note is null or char_length(doctor_note) <= 240
  );

create unique index if not exists community_exercise_library_active_unique
  on public.community_exercise_assignments (profile_id, library_plan_slug)
  where library_plan_slug is not null and status = 'active';

create table if not exists public.community_library_exercise_done (
  assignment_id uuid not null references public.community_exercise_assignments (id) on delete cascade,
  exercise_key text not null,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, exercise_key),
  constraint community_library_exercise_key_len check (char_length(exercise_key) between 3 and 80)
);

create table if not exists public.community_remedy_favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  remedy_key text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, remedy_key),
  constraint community_remedy_key_len check (char_length(remedy_key) between 3 and 120)
);

create table if not exists public.community_shopping_checks (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  item_key text not null,
  primary key (profile_id, item_key),
  constraint community_shopping_key_len check (char_length(item_key) between 3 and 160)
);

create table if not exists public.community_illness_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  started_on date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint community_illness_note_len check (note is null or char_length(note) <= 240)
);

create index if not exists community_illness_notes_profile_idx
  on public.community_illness_notes (profile_id, started_on desc);

alter table public.community_library_plans enable row level security;
alter table public.community_library_exercise_done enable row level security;
alter table public.community_remedy_favorites enable row level security;
alter table public.community_shopping_checks enable row level security;
alter table public.community_illness_notes enable row level security;

revoke all on table public.community_library_plans from public, anon;
revoke all on table public.community_library_exercise_done from public, anon;
revoke all on table public.community_remedy_favorites from public, anon;
revoke all on table public.community_shopping_checks from public, anon;
revoke all on table public.community_illness_notes from public, anon;

grant select on table public.community_library_plans to authenticated;
grant select, insert, update, delete on table public.community_library_exercise_done to authenticated;
grant select, insert, delete on table public.community_remedy_favorites to authenticated;
grant select, insert, delete on table public.community_shopping_checks to authenticated;
grant select, insert, update, delete on table public.community_illness_notes to authenticated;

-- Catalog titles are for doctors. Community members do not get a select policy,
-- so they cannot list the library through the API. The server shows a plan only
-- after it is assigned to that account.

drop policy if exists community_library_plans_doctor_select on public.community_library_plans;
create policy community_library_plans_doctor_select
  on public.community_library_plans
  for select
  to authenticated
  using (
    exists (select 1 from public.doctors where user_id = auth.uid())
  );

-- Replace the wide owner policy so a community member cannot insert a library
-- plan onto their own account. They can still update a reminder on a row they own.

drop policy if exists community_assignments_owner_all on public.community_exercise_assignments;
drop policy if exists community_assignments_owner_select on public.community_exercise_assignments;
drop policy if exists community_assignments_owner_insert on public.community_exercise_assignments;
drop policy if exists community_assignments_owner_update on public.community_exercise_assignments;

create policy community_assignments_owner_select
  on public.community_exercise_assignments
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy community_assignments_owner_insert
  on public.community_exercise_assignments
  for insert
  to authenticated
  with check (profile_id = auth.uid() and library_plan_slug is null);

create policy community_assignments_owner_update
  on public.community_exercise_assignments
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_library_done_owner on public.community_library_exercise_done;
create policy community_library_done_owner
  on public.community_library_exercise_done
  for all
  to authenticated
  using (
    assignment_id in (select id from public.community_exercise_assignments where profile_id = auth.uid())
  )
  with check (
    assignment_id in (select id from public.community_exercise_assignments where profile_id = auth.uid())
  );

drop policy if exists community_remedy_favorites_owner on public.community_remedy_favorites;
create policy community_remedy_favorites_owner
  on public.community_remedy_favorites
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_shopping_checks_owner on public.community_shopping_checks;
create policy community_shopping_checks_owner
  on public.community_shopping_checks
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists community_illness_notes_owner on public.community_illness_notes;
create policy community_illness_notes_owner
  on public.community_illness_notes
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create or replace function public.community_library_assignment_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(auth.role(), '');
begin
  if tg_op = 'INSERT' then
    if new.library_plan_slug is not null and jwt_role is distinct from 'service_role' then
      if not exists (
        select 1 from public.doctors
        where id = new.doctor_id and user_id = auth.uid()
      ) then
        raise exception 'A library plan is assigned by that community member''s doctor';
      end if;
    end if;
  elsif tg_op = 'UPDATE' then
    if jwt_role is distinct from 'service_role' and (
      new.profile_id is distinct from old.profile_id
      or new.set_id is distinct from old.set_id
      or new.library_plan_slug is distinct from old.library_plan_slug
      or new.doctor_id is distinct from old.doctor_id
      or new.doctor_note is distinct from old.doctor_note
    ) then
      raise exception 'This assignment cannot be retargeted';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists community_library_assignment_guard on public.community_exercise_assignments;
create trigger community_library_assignment_guard
  before insert or update on public.community_exercise_assignments
  for each row execute function public.community_library_assignment_guard();

revoke all on function public.community_library_assignment_guard() from public, anon, authenticated;

commit;
