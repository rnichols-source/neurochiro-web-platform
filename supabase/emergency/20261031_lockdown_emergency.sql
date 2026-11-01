-- NOT RUN — Raymond reviews and runs
-- Emergency lockdown, Oct 31 2026. Run in Supabase → SQL editor, one step at a time.
-- Tables: profiles, leads, job_applications, students, automation_queue

-- ===== STEP 0 · CHECK FIRST (read-only). Save the output. =====
select c.relname as table, c.relrowsecurity as rls_on, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles','leads','job_applications','students','automation_queue')
order by 1;

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles','leads','job_applications','students','automation_queue')
order by 1, 2;

select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
  and table_name in ('profiles','leads','job_applications','students','automation_queue')
group by 1, 2 order by 1, 2;

-- Who counts as staff (role values in use), and the new-user trigger (send this output to Grok Bot):
select role::text, count(*) from public.profiles group by 1 order by 2 desc;
select p.proname, pg_get_functiondef(p.oid) as definition
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;

-- ===== STEP 1 · BACKUP (writes only to a private backup schema) =====
begin;
create schema if not exists security_backup;
revoke all on schema security_backup from public, anon, authenticated;

create table if not exists security_backup.policies_20261031 as
select now() as saved_at, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles','leads','job_applications','students','automation_queue');

create table if not exists security_backup.rls_20261031 as
select c.relname as tablename, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles','leads','job_applications','students','automation_queue');

create table if not exists security_backup.student_tokens_20261031 as
select id, verification_token from public.students where verification_token is not null;
commit;

-- ===== STEP 2 · LOCKDOWN =====
begin;

-- a) Staff check used by the new policies (security definer avoids policy recursion on profiles).
--    Edit the role list to match STEP 0's output if your admin role has a different name.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('admin','super_admin','founder','regional_admin')
  );
$$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- b) Logged-out visitors: no reads, updates or deletes on these tables. (INSERT on leads is kept for public forms.)
revoke select, update, delete on public.profiles, public.leads, public.job_applications, public.students, public.automation_queue from anon;
revoke insert on public.profiles, public.job_applications, public.students, public.automation_queue from anon;

-- c) RLS on for all five.
alter table public.profiles          enable row level security;
alter table public.leads             enable row level security;
alter table public.job_applications  enable row level security;
alter table public.students          enable row level security;
alter table public.automation_queue  enable row level security;

-- d) Drop "everyone can read" policies (SELECT/ALL with no row condition). Own-row policies stay.
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

-- e) Replacement policies: own row + staff. Temporary "logged-in can read profiles" keeps names
--    in messaging/admin working until the PR moves them server-side; anon still can't read.
drop policy if exists lockdown_profiles_select_own on public.profiles;
create policy lockdown_profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
drop policy if exists lockdown_profiles_select_auth_temp on public.profiles;
create policy lockdown_profiles_select_auth_temp on public.profiles for select to authenticated using (true);

drop policy if exists lockdown_students_own on public.students;
create policy lockdown_students_own on public.students for select to authenticated using (id = auth.uid() or public.is_staff());

drop policy if exists lockdown_leads_staff on public.leads;
create policy lockdown_leads_staff on public.leads for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists lockdown_leads_insert_public on public.leads;
create policy lockdown_leads_insert_public on public.leads for insert to anon, authenticated with check (true);

drop policy if exists lockdown_automation_staff on public.automation_queue;
create policy lockdown_automation_staff on public.automation_queue for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists lockdown_job_apps_staff on public.job_applications;
create policy lockdown_job_apps_staff on public.job_applications for select to authenticated using (public.is_staff());
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
end $$;

-- f) Nobody but the server (service role) or staff may change role / tier / billing fields.
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

-- g) Void the leaked school-verification links (those students request a new one).
update public.students set verification_token = null where verification_token is not null;

commit;

-- ===== STEP 3 · CHECK AFTER (read-only; each anon line must say "permission denied") =====
begin; set local role anon; select count(*) from public.profiles;         rollback;
begin; set local role anon; select count(*) from public.leads;            rollback;
begin; set local role anon; select count(*) from public.job_applications; rollback;
begin; set local role anon; select count(*) from public.students;         rollback;
begin; set local role anon; select count(*) from public.automation_queue; rollback;
-- Directory must still be public (expect a number, not an error):
begin; set local role anon; select count(*) from public.doctors;          rollback;
-- Re-run the three STEP 0 queries and compare. Then tell Grok Bot "emergency SQL done" so it can re-check from outside.

-- ===== ROLLBACK (only if something important broke; restores the pre-lockdown state) =====
-- begin;
-- grant select, insert, update, delete on public.profiles, public.leads, public.job_applications, public.students, public.automation_queue to anon;
-- drop trigger if exists protect_profile_privileged_columns on public.profiles;
-- drop function if exists public.protect_profile_privileged_columns();
-- drop policy if exists lockdown_profiles_select_own on public.profiles;
-- drop policy if exists lockdown_profiles_select_auth_temp on public.profiles;
-- drop policy if exists lockdown_students_own on public.students;
-- drop policy if exists lockdown_leads_staff on public.leads;
-- drop policy if exists lockdown_leads_insert_public on public.leads;
-- drop policy if exists lockdown_automation_staff on public.automation_queue;
-- drop policy if exists lockdown_job_apps_staff on public.job_applications;
-- drop policy if exists lockdown_job_apps_own on public.job_applications;
-- do $$
-- declare r record;
-- begin
--   for r in select * from security_backup.policies_20261031 loop
--     if not exists (select 1 from pg_policies p where p.schemaname = r.schemaname and p.tablename = r.tablename and p.policyname = r.policyname) then
--       execute format('create policy %I on %I.%I as %s for %s to %s %s %s',
--         r.policyname, r.schemaname, r.tablename, r.permissive, r.cmd, array_to_string(r.roles, ', '),
--         case when r.qual is not null then 'using (' || r.qual || ')' else '' end,
--         case when r.with_check is not null then 'with check (' || r.with_check || ')' else '' end);
--     end if;
--   end loop;
--   for r in select * from security_backup.rls_20261031 where not rls_on loop
--     execute format('alter table public.%I disable row level security', r.tablename);
--   end loop;
-- end $$;
-- update public.students s set verification_token = b.verification_token
--   from security_backup.student_tokens_20261031 b where b.id = s.id;
-- drop function if exists public.is_staff();
-- commit;
-- (Leave security_backup in place until the PR is merged and verified; then: drop schema security_backup cascade;)
