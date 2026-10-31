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

-- PR E additions. NOT RUN. SUGGESTIONS ONLY. Raymond reviews each SELECT, then runs the matching statement inside BEGIN; … COMMIT; himself.
-- NOT RUN — Raymond reviews and runs.

-- E1. Test messages between the dr-raymond-nichols account and Dr. John Caruso.
-- Body is exactly "Test Test Test" or starts with "Test". Columns are id, conversation, sender, and time only.
select m.id, m.conversation_id, m.sender_id, m.created_at
from public.messages m
join public.conversations c on c.id = m.conversation_id
join public.doctors d on d.slug = 'dr-raymond-nichols'
join public.profiles caruso on caruso.full_name ilike '%john caruso%'
where m.deleted_at is null
  and (m.body = 'Test Test Test' or m.body like 'Test%')
  and (
    (c.participant_one_id = d.user_id and c.participant_two_id = caruso.id)
    or (c.participant_two_id = d.user_id and c.participant_one_id = caruso.id)
  );
-- Soft-delete so the other person's thread stays intact. Do not hard-delete.
-- update public.messages
-- set deleted_at = now(), body = ''
-- where id in (/* ids from the select above */);

-- E2. Test leads and contact requests for this doctor.
-- SELECT only. Talk to Grok Bot before changing; this touches the lead system.
select l.id, l.created_at
from public.leads l
join public.doctors d on d.id = l.doctor_id
left join public.profiles p on p.id = d.user_id
where d.slug = 'dr-raymond-nichols'
  and (
    (p.email is not null and lower(coalesce(l.email, '')) = lower(p.email))
    or coalesce(l.notes, '') ilike '%test%'
    or coalesce(l.first_name, '') ilike '%test%'
    or coalesce(l.last_name, '') ilike '%test%'
  );

select c.id, c.created_at
from public.contact_requests c
join public.doctors d on d.id = c.doctor_id
left join public.profiles p on p.id = d.user_id
where d.slug = 'dr-raymond-nichols'
  and (
    (p.email is not null and lower(coalesce(c.email, '')) = lower(p.email))
    or coalesce(c.note, '') ilike '%test%'
    or coalesce(c.name, '') ilike '%test%'
  );

-- E3. Job titled Associate Job Test.
-- The doctor toggle writes status 'Closed' (capital C). Public listings use 'Active' and 'open'.
-- There is no lowercase 'closed' in that toggle. Read the current status before updating.
select id, title, status, doctor_id, created_at
from public.job_postings
where title = 'Associate Job Test';
-- update public.job_postings
-- set status = 'Closed'
-- where title = 'Associate Job Test'
--   and status in ('Active', 'open', 'Draft');

-- E4. Seminar "New Beginnings — 35th Anniversary Year" dated 2017.
-- SELECT only. Fix the date in admin, don't delete.
select id, title, dates, location
from public.seminars
where title ilike '%New Beginnings%35th Anniversary%'
   or (title ilike '%New Beginnings%' and dates < '2020-01-01');

-- E5. Review "Thank you so much!" from Raymond on dr-raymond-nichols.
-- Table is public.seminar_reviews (review_text, reviewer_id). No is_hidden column exists in the app or migrations.
select r.id, r.seminar_id, r.reviewer_id, r.created_at
from public.seminar_reviews r
join public.seminars s on s.id = r.seminar_id
join public.doctors host on host.user_id = s.host_id
join public.profiles reviewer on reviewer.id = r.reviewer_id
where host.slug = 'dr-raymond-nichols'
  and r.review_text = 'Thank you so much!'
  and reviewer.full_name ilike 'raymond%';
-- delete from public.seminar_reviews where id in (/* ids from the select above */);

-- E6. Stored doctor_badges for this doctor. E3 ignores these rows and computes badges from live numbers.
-- SELECT for info. No delete.
select b.user_id, b.badge_id, b.earned_at
from public.doctor_badges b
join public.doctors d on d.user_id = b.user_id
where d.slug = 'dr-raymond-nichols';
