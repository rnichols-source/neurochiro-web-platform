-- NOT RUN — Raymond reviews and runs
-- Permanent lockdown. Idempotent if supabase/emergency/20261031_lockdown_emergency.sql already ran.
-- This file is 20261107000000_security_lockdown.sql. Quiz already owns
-- 20261107000000_quiz_events.sql. The full names differ, so this does not overwrite quiz.
-- Alphabetical apply order is quiz_events, then security_lockdown.
-- No DROP TABLE, TRUNCATE, or DELETE of user data. Token clearing is an UPDATE.

-- ===== A · CHECK FIRST (read-only) =====
select c.relname as table, c.relrowsecurity as rls_on, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles','leads','job_applications','students','automation_queue','doctors','match_cycles','match_positions')
order by 1;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','leads','job_applications','students','automation_queue','doctors','match_cycles','match_positions')
order by 1, 2;

select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
  and table_name in ('profiles','leads','job_applications','students','automation_queue','doctors','match_cycles')
group by 1, 2 order by 1, 2;

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'students'
  and column_name in ('verification_token','verification_token_expires_at','school_verified','verified_at')
order by 1;

select id, public from storage.buckets
where id ilike '%resume%' or id ilike '%student%'
order by 1;

select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;

-- ===== B · LOCKDOWN =====
begin;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('admin','super_admin','founder','regional_admin')
  );
$$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

revoke select, update, delete on public.profiles, public.leads, public.job_applications, public.students, public.automation_queue from anon;
revoke insert on public.profiles, public.job_applications, public.students, public.automation_queue from anon;

alter table public.profiles          enable row level security;
alter table public.leads             enable row level security;
alter table public.job_applications  enable row level security;
alter table public.students          enable row level security;
alter table public.automation_queue  enable row level security;

do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','leads','job_applications','students','automation_queue')
      and cmd in ('SELECT','ALL')
      and (qual is null or btrim(qual) in ('true','(true)'))
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

drop policy if exists lockdown_profiles_select_own on public.profiles;
create policy lockdown_profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());

-- The emergency SQL's temporary "any logged-in user can read every profile" policy ends here.
drop policy if exists lockdown_profiles_select_auth_temp on public.profiles;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists lockdown_students_own on public.students;
create policy lockdown_students_own on public.students
  for select to authenticated using (id = auth.uid() or public.is_staff());

drop policy if exists lockdown_leads_staff on public.leads;
create policy lockdown_leads_staff on public.leads
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists lockdown_leads_insert_public on public.leads;
create policy lockdown_leads_insert_public on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists lockdown_automation_staff on public.automation_queue;
create policy lockdown_automation_staff on public.automation_queue
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists lockdown_job_apps_staff on public.job_applications;
create policy lockdown_job_apps_staff on public.job_applications
  for select to authenticated using (public.is_staff());
do $$
declare owner_col text;
begin
  select column_name into owner_col from information_schema.columns
  where table_schema = 'public' and table_name = 'job_applications'
    and column_name in ('user_id','applicant_id','student_id') order by column_name limit 1;
  if owner_col is not null then
    execute 'drop policy if exists lockdown_job_apps_own on public.job_applications';
    execute format('create policy lockdown_job_apps_own on public.job_applications for select to authenticated using (%I = auth.uid())', owner_col);
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'job_applications' and column_name = 'student_user_id'
  ) then
    execute 'drop policy if exists lockdown_job_apps_student on public.job_applications';
    execute 'create policy lockdown_job_apps_student on public.job_applications for select to authenticated using (student_user_id = auth.uid())';
  end if;
end $$;

create or replace function public.protect_profile_privileged_columns() returns trigger
language plpgsql security definer set search_path = public as $$
declare jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if jwt_role in ('anon','authenticated') and not public.is_staff() then
    if new.role is distinct from old.role
       or new.tier is distinct from old.tier
       or new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'Changing role, tier or billing fields is not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns before update on public.profiles
for each row execute function public.protect_profile_privileged_columns();

-- Column grants: authenticated may update only the fields the app writes for the signed-in user.
do $$
declare
  col text;
  allowed text[] := array['full_name','avatar_url','notification_preferences','onboarding_completed_at','region_code','updated_at'];
  present text[] := array[]::text[];
begin
  revoke update on public.profiles from authenticated;
  foreach col in array allowed loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = col
    ) then
      present := array_append(present, col);
    end if;
  end loop;
  if coalesce(array_length(present, 1), 0) > 0 then
    execute format(
      'grant update (%s) on public.profiles to authenticated',
      (select string_agg(quote_ident(c), ', ') from unnest(present) as c)
    );
  end if;
end $$;

-- Students: add an expiry column when none exists, hide the token, limit updates.
do $$
declare
  col text;
  allowed text[] := array['school_name','graduation_year','full_name','school','location_city','interests','skills','is_looking_for_mentorship','resume_url','region_code'];
  present text[] := array[]::text[];
  cols text;
begin
  if to_regclass('public.students') is null then
    return;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students'
      and column_name in ('verification_token_expires_at','verification_expires_at','token_expires_at')
  ) then
    alter table public.students add column verification_token_expires_at timestamptz;
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'students'
    and column_name <> 'verification_token';
  revoke select on table public.students from anon, authenticated;
  if cols is not null then
    execute format('grant select (%s) on public.students to authenticated', cols);
  end if;

  revoke update on table public.students from authenticated;
  foreach col in array allowed loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'students' and column_name = col
    ) then
      present := array_append(present, col);
    end if;
  end loop;
  if coalesce(array_length(present, 1), 0) > 0 then
    execute format(
      'grant update (%s) on public.students to authenticated',
      (select string_agg(quote_ident(c), ', ') from unnest(present) as c)
    );
  end if;
end $$;

-- Void leaked school-verification tokens. This is an UPDATE, not a delete.
update public.students set verification_token = null where verification_token is not null;

-- match_cycles holds a public schedule only, but "anyone can read" is still too open.
-- Reads in the app go through the service role after this (see student and doctor chiromatch actions).
do $$
begin
  if to_regclass('public.match_cycles') is not null then
    execute 'revoke select, insert, update, delete on public.match_cycles from anon';
    execute 'alter table public.match_cycles enable row level security';
    execute 'drop policy if exists "Anyone can read cycles" on public.match_cycles';
    execute 'drop policy if exists lockdown_match_cycles_staff on public.match_cycles';
    execute 'create policy lockdown_match_cycles_staff on public.match_cycles for select to authenticated using (public.is_staff())';
  end if;
  if to_regclass('public.match_positions') is not null then
    execute 'revoke select, insert, update, delete on public.match_positions from anon';
    execute 'alter table public.match_positions enable row level security';
    execute 'drop policy if exists "Anyone can read active positions" on public.match_positions';
  end if;
end $$;

-- Drop any remaining anon-open SELECT policy on these private tables when the table exists.
do $$
declare r record;
begin
  for r in
    select p.tablename, p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in (
        'messages','conversations','doctor_referrals','seminar_registrations','contact_requests',
        'course_progress','student_calls','student_call_secrets','student_call_rsvps','shadow_requests',
        'ai_usage','student_notices','match_profiles','match_interests','matches','match_outcomes',
        'match_weights','match_outcome_tokens','match_outcome_prompts','portal_logins','lead_notifications',
        'quiz_events','user_blocks','message_reports','conversation_mutes','message_email_log',
        'student_roadmap_progress','applications'
      )
      and p.cmd in ('SELECT','ALL')
      and (p.qual is null or btrim(p.qual) in ('true','(true)'))
      and p.roles::text like '%anon%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Server-only security definer functions. Skip any signature that is not installed.
-- record_job_view is called from src/lib/jobs/board.ts through the admin client, not the browser.
-- seminar_reserve_seat is called from seminars/register-actions.ts through the admin client.
-- create_match_if_mutual is called from src/lib/match/store.ts through the admin client.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'seminar_reserve_seat','create_match_if_mutual','record_job_view','get_inbox','get_unread_summary'
      )
  loop
    execute format('revoke all on function %s from anon', r.sig);
  end loop;
end $$;

commit;

-- ===== C · CHECK AFTER (read-only; each anon line must say permission denied) =====
begin; set local role anon; select count(*) from public.profiles;         rollback;
begin; set local role anon; select count(*) from public.leads;            rollback;
begin; set local role anon; select count(*) from public.job_applications; rollback;
begin; set local role anon; select count(*) from public.students;         rollback;
begin; set local role anon; select count(*) from public.automation_queue; rollback;
begin; set local role anon; select count(*) from public.doctors;          rollback;
begin; set local role anon; select count(*) from public.match_cycles;     rollback;

-- ===== D · ROLLBACK (commented; only if this migration itself caused the break) =====
-- The emergency file's rollback restores the pre-lockdown grants. This block undoes
-- only the extra permanent changes: the temp-policy drop is reversed by recreating it,
-- column grants go back to table-level update, and match_cycles anon select returns.
-- begin;
-- drop policy if exists lockdown_match_cycles_staff on public.match_cycles;
-- grant select on public.match_cycles to anon;
-- create policy "Anyone can read cycles" on public.match_cycles for select using (true);
-- grant select on public.match_positions to anon;
-- create policy "Anyone can read active positions" on public.match_positions for select using (true);
-- grant update on public.profiles to authenticated;
-- grant select, update on public.students to authenticated;
-- create policy lockdown_profiles_select_auth_temp on public.profiles for select to authenticated using (true);
-- drop trigger if exists protect_profile_privileged_columns on public.profiles;
-- drop function if exists public.protect_profile_privileged_columns();
-- commit;

-- ===== E · ASK FIRST — don't run until Raymond OKs =====
-- E1. Doctors. Anon currently has table-level select, so private columns are granted
-- even when the app lists columns. Private: email, phone, user_id, any stripe_*,
-- any license column, any notes column, patient_leads, average_case_value,
-- referral_code, referred_by, google_place_id.
-- The live directory still selects phone (DoctorCard tel: link) until you OK this
-- and the matching code change. PUBLIC_DOCTOR_COLUMNS in src/lib/security/public-columns.ts
-- is the list below, and it does not include phone.
--
-- begin;
-- revoke select on public.doctors from anon;
-- grant select (
--   id, slug, first_name, last_name, clinic_name, city, state, country, zip_code, address,
--   latitude, longitude, instagram_url, facebook_url, website_url, bio, specialties,
--   rating, review_count, verification_status, membership_tier, is_hiring, is_mentoring,
--   region_code, photo_url, video_url, seo_keywords, created_at, updated_at, profile_views,
--   is_founding_member, accepting_new_patients, offers_telehealth, accepts_walkins,
--   languages, hours, booking_url
-- ) on public.doctors to anon, authenticated;
-- commit;

-- E2. Storage. If section A shows a resume or student bucket with public = true, make it private.
-- Doctor-facing resume links already use a 10-minute signed URL for student-resumes/ paths.
-- update storage.buckets set public = false
-- where public = true and (id ilike '%resume%' or id = 'student-resumes');

-- E3. ASK FIRST — paste the current auth.users → profiles function here before replacing it.
-- Step 0 of the emergency SQL prints pg_get_functiondef. The body below is a template, not a guess
-- at the live function. Do not run it until the pasted body is reviewed.
--
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--   requested text := coalesce(new.raw_user_meta_data->>'role', '');
--   safe_role text := case when requested in ('doctor','student','patient') then requested else 'patient' end;
-- begin
--   insert into public.profiles (id, email, full_name, role)
--   values (
--     new.id,
--     new.email,
--     coalesce(new.raw_user_meta_data->>'full_name', ''),
--     safe_role
--   )
--   on conflict (id) do update
--     set email = excluded.email,
--         full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
--   -- tier is never taken from metadata. stripe_* is never copied.
--   return new;
-- end $$;

-- E4. student_calls has an authenticated SELECT policy using (true) in
-- supabase/migrations/20261104000000_students_membership.sql. Anon was not granted that
-- policy. Narrow it only if the call list should not be visible to every logged-in user.
-- Leave it until you say so.

-- E5. Any other security definer function that section A shows anon can execute, and that
-- returns private rows, should lose anon execute. Name the public page if the site calls it
-- with the publishable key before revoking.
