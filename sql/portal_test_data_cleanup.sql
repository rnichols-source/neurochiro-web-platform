-- NOT RUN. SUGGESTIONS ONLY. Raymond reviews each SELECT result, then runs the matching DELETE/UPDATE inside BEGIN; … COMMIT; himself.

-- 1. Demo doctor dr-sophia-chen-demo and the profile for drsophia@neurovitalchiro.com.
-- Deleting auth users is done in Supabase Dashboard → Authentication → Users.
select id, slug, user_id, clinic_name from public.doctors where slug = 'dr-sophia-chen-demo';
select id, email, role from public.profiles where email = 'drsophia@neurovitalchiro.com';
-- delete from public.doctors where slug = 'dr-sophia-chen-demo';
-- delete from public.profiles where email = 'drsophia@neurovitalchiro.com';

-- 2. Auth users doctor@test.com and student@test.com.
-- Deleting auth users is done in Supabase Dashboard → Authentication → Users.
select id, email, role from public.profiles where email in ('doctor@test.com', 'student@test.com');
-- delete from public.profiles where email in ('doctor@test.com', 'student@test.com');

-- 3. Duplicate CE certificates. Keep the earliest per registration_id,
-- or per user_id + seminar_id when registration_id is null.
-- Also list certificates issued before the seminar start.
select c.id, c.registration_id, c.user_id, c.seminar_id, c.created_at
from public.ce_certificates c
join (
  select registration_id, min(created_at) as keep_at
  from public.ce_certificates
  where registration_id is not null
  group by registration_id
  having count(*) > 1
) d on d.registration_id = c.registration_id and c.created_at > d.keep_at;

select c.id, c.user_id, c.seminar_id, c.created_at, s.dates
from public.ce_certificates c
left join public.seminars s on s.id = c.seminar_id
where s.dates is not null
  and c.created_at < s.dates;
-- delete from public.ce_certificates where id in (/* ids from the selects above */);

-- 4. Portal login rows that were written into the doctor's own notifications.
select id, user_id, created_at from public.notifications where type = 'portal_login';
-- delete from public.notifications where type = 'portal_login';

-- 5. Match cycles still marked open after their dates passed.
select id, status, ranking_opens_at, ranking_closes_at, match_day
from public.match_cycles
where status in ('ranking_open', 'upcoming')
  and coalesce(ranking_closes_at, match_day) < now();
-- update public.match_cycles
-- set status = 'matched'
-- where status in ('ranking_open', 'upcoming')
--   and coalesce(ranking_closes_at, match_day) < now();

-- 6. Leads whose doctor_id is an auth user id instead of doctors.id.
-- SELECT only. Talk to Grok Bot before changing; this touches the lead system.
select l.id, l.doctor_id, l.created_at
from public.leads l
where l.doctor_id in (select user_id from public.doctors where user_id is not null);

-- 7. Seminars with a start before 2020, including New Beginnings 2017.
-- SELECT only. Fix the date in admin, don't delete.
select id, title, dates, location
from public.seminars
where dates < '2020-01-01';
