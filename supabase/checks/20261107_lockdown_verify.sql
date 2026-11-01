-- NOT RUN — Raymond reviews and runs
-- Replace the two UUIDs below with a non-staff user and a staff user from Step 0.
-- Every write is inside begin … rollback.

-- (a) anon is denied on private tables
begin; set local role anon; select count(*) from public.profiles; rollback;
begin; set local role anon; select count(*) from public.leads; rollback;
begin; set local role anon; select count(*) from public.job_applications; rollback;
begin; set local role anon; select count(*) from public.students; rollback;
begin; set local role anon; select count(*) from public.automation_queue; rollback;
begin; set local role anon; select count(*) from public.match_cycles; rollback;
begin; set local role anon; select count(*) from public.doctors; rollback;

-- (b) authenticated non-staff sees only their own profile and student row
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select id from public.profiles;
select id from public.students;
rollback;

-- (c) that user cannot set role = admin (42501) and can set full_name
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001';
rollback;

begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
update public.profiles set full_name = 'Lockdown verify' where id = '00000000-0000-4000-8000-000000000001';
rollback;

-- (d) staff can read leads
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select count(*) from public.leads;
rollback;
