-- NOT RUN — Raymond reviews and runs
-- Doctor portal cleanup. Nothing here runs by itself.
--
-- How to run it
-- 1. Open Supabase, SQL editor, New query.
--    https://supabase.com/dashboard/project/gddapefwrmucimpdhjrz/sql/new
-- 2. Paste Step 1 only and run it. Step 1 only reads.
-- 3. Check each result against the note above it. Copy the ids you agree with
--    into the matching Step 2 block. A nil uuid deletes nothing.
-- 4. Run Step 2 one block at a time. Each block is begin; ... ; select; commit;.
--    If the last select looks wrong, run rollback; instead of commit;.
-- 5. Blocks marked ASK FIRST stay commented until you decide.
--
-- "me" is the auth user on the public profile /directory/dr-raymond-nichols.
-- That login's display name is Mariya Shaeffer on purpose. Do not change it.
--
-- Columns used, and where they are defined:
--   doctors.user_id, doctors.slug
--     supabase/migrations/20261030000000_lead_followup.sql:91
--   profiles.full_name, profiles.email, profiles.role
--     sql_archive/ONBOARDING_TRIGGERS.sql:49
--     sql_archive/PERFORMANCE_INDEXES.sql:38
--   conversations.participant_one_id, participant_two_id, last_message_at, created_at, context_type
--     sql_archive/MESSAGING_SCHEMA.sql:4-11
--   conversations.archived_at, context_id
--     supabase/migrations/20261020_messaging_rebuild.sql:6-9
--   messages.body, created_at, deleted_at
--     sql_archive/MESSAGING_SCHEMA.sql:17-25
--     supabase/migrations/20261020_messaging_rebuild.sql:14
--   message_reports.message_id  (on delete cascade from messages)
--     supabase/migrations/20261020_messaging_rebuild.sql:35-39
--   conversation_mutes.conversation_id  (on delete cascade from conversations)
--     supabase/migrations/20261020_messaging_rebuild.sql:59-64
--   message_email_log.conversation_id  (on delete cascade from conversations)
--     supabase/migrations/20261020_messaging_rebuild.sql:79-84
--   notifications.conversation_id  (no foreign key in the migration)
--     supabase/migrations/20261103000000_messaging_hardening.sql:290
--   patient_stories.doctor_id, patient_first_name, story_text, approved
--     sql_archive/PHASE3_TABLES.sql:27-35
--     doctor_id references doctors(id) with no on-delete rule, so a story
--     delete does not touch the doctor.
--   seminar_reviews.review_text, reviewer_id, seminar_id
--     sql/create_seminar_upgrades.sql:14-21
--     seminar_id references seminars(id) on delete cascade.
--   contact_requests.doctor_id, name, phone, note, source, created_at
--     supabase/migrations/20261030000000_lead_followup.sql:34-57
--   contact_requests.email, message
--     supabase/migrations/20261030000000_lead_followup.sql:131-133
--   lead_notifications.contact_request_id  (on delete cascade)
--     supabase/migrations/20261030000000_lead_followup.sql:159-161
--   contact_request_escalations.contact_request_id
--     supabase/migrations/20261030000000_lead_followup.sql:58-60
--     The on-delete rule is not in this repo. Delete these rows first.
--   escalation_run_log.contact_request_id
--     supabase/migrations/20261030000000_lead_followup.sql:70-74
--     No foreign key is declared in this repo. Delete these rows first.
--   leads.first_name, last_name, email, phone, created_at
--     sql_archive/LEADS_SCHEMA.sql:9-13
--   leads.doctor_id, confirmed_at
--     sql_archive/ROI_ANALYTICS_SCHEMA.sql:5-6
--     doctor_id references profiles(id). The app also stores the doctors.id
--     in some rows, so the preview checks both.
--   leads.stage, notes, last_contacted_at
--     sql/create_doctor_portal_upgrades.sql:6-9
--   job_postings.title, status
--     sql_archive/RECRUITING_HUB_PRODUCTION_UPDATE.sql:2-14
--   job_postings.expires_at
--     sql_archive/JOB_SYSTEM_FIX.sql:7
--   job_applications.job_id  (on delete cascade)
--     sql_archive/JOB_SYSTEM_FIX.sql:27-29
--   applications.job_id  (on delete cascade)
--     sql_archive/RECRUITING_HUB_PRODUCTION_UPDATE.sql:18-20
--   job_post_views.job_id  (on delete cascade)
--     supabase/migrations/20261105000000_job_board_v2.sql:45
--   seminars.title, dates, is_approved, is_past, host_id
--     sql/hotfix_seminars_rls.sql:37-42
--   seminars.ends_at, timezone
--     supabase/migrations/20261031120000_seminars_phase1.sql:16-17
--   seminar_registrations.seminar_id  (on delete cascade)
--     sql_archive/SEMINAR_HUB_PRODUCTION_UPDATE.sql:18-20
--   seminar_ticket_types, seminar_outbound_clicks, seminar_email_jobs
--     reference seminars with no on-delete rule
--     supabase/migrations/20261031120000_seminars_phase1.sql:147, 255, 273
--     A seminar delete fails while those children exist.
--   ce_certificates.user_id, seminar_id, issued_at
--     sql/create_seminar_upgrades.sql:38-45
--     seminar_id on delete cascade.
--   notifications.user_id, type, title, body, created_at, read_at
--     supabase/migrations/20261030000000_lead_followup.sql:115-125
--   doctor_tool_data.user_id, tool, data
--     sql_archive/DOCTOR_TOOL_DATA.sql:5-10
--
-- Expected children, before the live foreign-key check below confirms them:
--   conversations: messages cascade; mutes cascade; email log cascade;
--     message_reports cascade through messages; notifications.conversation_id
--     does not cascade.
--   contact_requests: lead_notifications cascade; escalations and
--     escalation_run_log are deleted first because their rules are not in repo.
--   leads: no child foreign key found in this repo.
--   job_postings: job_applications, applications, and job_post_views cascade.
--   seminars: registrations, reviews, and certificates cascade. Ticket types,
--     outbound clicks, and email jobs block the delete.
--   patient_stories, notifications, ce_certificates: no children found.

-- =============================================================================
-- Step 1. Preview only.
-- =============================================================================

-- F1.0 What a delete would cascade.
-- confdeltype a = no action, r = restrict, c = cascade.
select conrelid::regclass as child, confrelid::regclass as parent, confdeltype
from pg_constraint
where contype = 'f'
  and confrelid in (
    'public.conversations'::regclass,
    'public.contact_requests'::regclass,
    'public.leads'::regclass,
    'public.job_postings'::regclass,
    'public.seminars'::regclass,
    'public.patient_stories'::regclass,
    'public.notifications'::regclass,
    'public.ce_certificates'::regclass
  );

-- F1.1 ASK FIRST. Test thread with Dr. John Caruso.
-- Shows the thread. Does not remove it. Deleting also removes it from his inbox.
with me as (
  select user_id as id from public.doctors where slug = 'dr-raymond-nichols'
),
caruso as (
  select id, full_name, split_part(email, '@', 2) as email_domain
  from public.profiles
  where full_name ilike '%john caruso%'
)
select
  c.id,
  c.context_type,
  c.archived_at,
  c.last_message_at,
  p.full_name as other_name,
  p.email_domain,
  (select count(*) from public.messages m where m.conversation_id = c.id) as message_count,
  (select left(m.body, 40) from public.messages m where m.conversation_id = c.id and m.deleted_at is null order by m.created_at asc, m.id asc limit 1) as first_body,
  (select left(m.body, 40) from public.messages m where m.conversation_id = c.id and m.deleted_at is null order by m.created_at desc, m.id desc limit 1) as last_body
from public.conversations c
join caruso p on p.id in (c.participant_one_id, c.participant_two_id)
where (select id from me) in (c.participant_one_id, c.participant_two_id);

-- F1.2 Hey Ray. This login messaging a profile named Raymond Nichols.
with me as (
  select user_id as id from public.doctors where slug = 'dr-raymond-nichols'
),
others as (
  select id, full_name, role, split_part(email, '@', 2) as email_domain
  from public.profiles
  where full_name ilike 'raymond nichols%'
    and id <> (select id from me)
)
select id, full_name, role, email_domain from others;

with me as (
  select user_id as id from public.doctors where slug = 'dr-raymond-nichols'
),
others as (
  select id from public.profiles
  where full_name ilike 'raymond nichols%'
    and id <> (select id from me)
)
select
  c.id,
  c.context_type,
  c.last_message_at,
  o.id as other_id,
  (select count(*) from public.messages m where m.conversation_id = c.id) as message_count,
  (select left(m.body, 40) from public.messages m where m.conversation_id = c.id order by m.created_at asc, m.id asc limit 1) as first_body,
  (select left(m.body, 40) from public.messages m where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1) as last_body
from public.conversations c
join others o on o.id in (c.participant_one_id, c.participant_two_id)
where (select id from me) in (c.participant_one_id, c.participant_two_id);

-- Child ids for those Hey Ray conversations. Paste each id into Step 2.
with me as (
  select user_id as id from public.doctors where slug = 'dr-raymond-nichols'
),
threads as (
  select c.id
  from public.conversations c
  join public.profiles o
    on o.full_name ilike 'raymond nichols%'
   and o.id <> (select id from me)
   and o.id in (c.participant_one_id, c.participant_two_id)
  where (select id from me) in (c.participant_one_id, c.participant_two_id)
)
select 'message' as kind, m.id, left(m.body, 40) as preview
from public.messages m
where m.conversation_id in (select id from threads)
union all
select 'report', r.id, left(coalesce(r.reason, ''), 40)
from public.message_reports r
where r.message_id in (select m.id from public.messages m where m.conversation_id in (select id from threads))
union all
select 'mute', u.id, ''
from public.conversation_mutes u
where u.conversation_id in (select id from threads)
union all
select 'email_log', e.id, ''
from public.message_email_log e
where e.conversation_id in (select id from threads)
union all
select 'notification', n.id, left(coalesce(n.title, ''), 40)
from public.notifications n
where n.conversation_id in (select id from threads);

-- F1.3 Testimonial "Thank you so much!" from Raymond.
select id, doctor_id, patient_first_name, left(story_text, 40) as preview, approved, created_at
from public.patient_stories
where doctor_id = (select id from public.doctors where slug = 'dr-raymond-nichols')
  and story_text ilike 'thank you so much%';

select r.id, r.seminar_id, r.reviewer_id, left(r.review_text, 40) as preview, r.created_at
from public.seminar_reviews r
where r.review_text ilike 'thank you so much%';

-- F1.4 Test lead "Raymond Nichols" on 2026-09-27, America/New_York.
-- Also the follow-up rows the lead cron reads.
with doc as (
  select id, user_id from public.doctors where slug = 'dr-raymond-nichols'
),
windowed as (
  select timestamptz '2026-09-27 00:00:00 America/New_York' as start_at,
         timestamptz '2026-09-28 00:00:00 America/New_York' as end_at
)
select 'lead' as kind, l.id, l.first_name, l.last_name, split_part(l.email, '@', 2) as email_domain,
       l.stage, left(coalesce(l.notes, ''), 40) as preview, l.created_at
from public.leads l, doc, windowed w
where (l.doctor_id = doc.id or l.doctor_id = doc.user_id)
  and (coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')) ilike '%raymond%nichols%'
  and l.created_at >= w.start_at
  and l.created_at < w.end_at
union all
select 'contact_request', c.id, c.name, '', split_part(coalesce(c.email, ''), '@', 2),
       c.source, left(coalesce(c.message, c.note, ''), 40), c.created_at
from public.contact_requests c, doc, windowed w
where c.doctor_id = doc.id
  and c.name ilike '%raymond%nichols%'
  and c.created_at >= w.start_at
  and c.created_at < w.end_at;

-- Follow-up children for those contact requests. Paste the contact request id.
select 'lead_notification' as kind, n.id, n.kind as detail, n.created_at
from public.lead_notifications n
where n.contact_request_id in ('00000000-0000-0000-0000-000000000000')
union all
select 'escalation', e.id, e.channel, e.sent_at
from public.contact_request_escalations e
where e.contact_request_id in ('00000000-0000-0000-0000-000000000000')
union all
select 'run_log', g.id, g.action, g.run_at
from public.escalation_run_log g
where g.contact_request_id in ('00000000-0000-0000-0000-000000000000');

-- F1.4 ASK FIRST. Brooke, source dm_outreach. She may be a real patient.
-- Email domain only. The phone number is not selected.
select c.id, c.name, c.created_at, c.source,
       split_part(coalesce(c.email, ''), '@', 2) as email_domain,
       (c.phone is not null) as has_phone
from public.contact_requests c
where c.doctor_id = (select id from public.doctors where slug = 'dr-raymond-nichols')
  and c.source = 'dm_outreach'
  and c.name ilike '%brooke%';

-- F1.5 Job "Associate Job Test".
select j.id, j.title, j.status, j.expires_at, j.doctor_id::text as doctor_id,
  (select count(*) from public.job_applications a where a.job_id::text = j.id::text) as job_applications,
  (select count(*) from public.applications a where a.job_id::text = j.id::text) as applications
from public.job_postings j
where j.title = 'Associate Job Test';

-- F1.6 ASK FIRST. 2017 seminar "New Beginnings — 35th Anniversary Year".
-- Earlier notes said to fix the year in admin rather than delete it.
select s.id, s.title, s.dates, s.is_approved, s.is_past, s.host_id, s.ends_at, s.timezone,
  (select count(*) from public.seminar_registrations r where r.seminar_id = s.id) as registrations
from public.seminars s
where s.title ilike '%New Beginnings%'
  and s.dates ilike '%2017%';

-- F2. Every notification on this login.
select n.id, n.type, n.title, left(n.body, 60) as body, n.created_at, n.read_at
from public.notifications n
where n.user_id = (select user_id from public.doctors where slug = 'dr-raymond-nichols')
order by n.created_at;

-- F2. Same seeded titles on other doctors. Read only.
-- Expected titles from the portal audit: "Badge earned: Top 10",
-- lead names Megan Hernandez and Jason Roberts, referral "Sarah Thompson",
-- "family of 4", and a student job application. Titles may differ slightly.
-- Copy only the rows you recognize as fake.
select n.user_id, n.id, n.type, n.title, left(n.body, 60) as body, n.created_at
from public.notifications n
where n.user_id is distinct from (select user_id from public.doctors where slug = 'dr-raymond-nichols')
  and (
    n.title in (
      'Badge earned: Top 10',
      'Megan Hernandez',
      'Jason Roberts',
      'Sarah Thompson'
    )
    or n.title ilike 'Badge earned%'
    or n.body ilike '%Megan Hernandez%'
    or n.body ilike '%Jason Roberts%'
    or n.body ilike '%Sarah Thompson%'
    or n.body ilike '%family of 4%'
  )
order by n.created_at;

-- F5 ASK FIRST. Example P&L drafts. Old saves may not have the marker yet.
select id, user_id, tool, updated_at,
       (data ? '__example') as marked_example,
       (data ? '__confirmed') as confirmed
from public.doctor_tool_data
where user_id = (select user_id from public.doctors where slug = 'dr-raymond-nichols')
  and tool like 'pl_draft_%';

-- F8. Certificates for this login, with the seminar dates.
-- seminars.timezone exists (20261031120000_seminars_phase1.sql:17).
-- If timezone is null on the Adelaide row, the Step 2 timestamp uses
-- Australia/Adelaide (+09:30), end of 30 May 2026 at 18:00 local.
select c.id, c.issued_at, c.ce_hours, s.title, s.dates, s.ends_at, s.timezone
from public.ce_certificates c
join public.seminars s on s.id = c.seminar_id
where c.user_id = (select user_id from public.doctors where slug = 'dr-raymond-nichols')
order by c.issued_at;

-- Replaces the old comparison of created_at to seminars.dates (dates is text).
-- When ends_at is empty, check the text date by eye.
select c.id, c.issued_at, s.title, s.dates, s.ends_at
from public.ce_certificates c
join public.seminars s on s.id = c.seminar_id
where c.user_id = (select user_id from public.doctors where slug = 'dr-raymond-nichols')
  and s.ends_at is not null
  and c.issued_at < s.ends_at;

-- =============================================================================
-- Step 2. One block at a time. Replace the nil uuids with ids from Step 1.
-- =============================================================================

-- F1.2 Hey Ray.
-- Removes that conversation, its messages, reports, mutes, email log,
-- and notifications that point at it.
-- Does not touch the Raymond Nichols profile, the doctor row, or any other thread.
begin;
delete from public.message_reports
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.messages
where id in ('00000000-0000-0000-0000-000000000000')
  and deleted_at is null;
delete from public.message_email_log
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.conversation_mutes
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.notifications
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.conversations
where id in ('00000000-0000-0000-0000-000000000000');
select id from public.conversations
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- F1.3 Testimonial. Removes that patient_stories row only.
-- If Step 1 found it in seminar_reviews instead, use the commented statement
-- and leave the patient_stories delete on the nil uuid.
begin;
delete from public.patient_stories
where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.seminar_reviews
-- where id in ('00000000-0000-0000-0000-000000000000');
select id, left(story_text, 40) as preview
from public.patient_stories
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- F1.4 Raymond Nichols lead from 2026-09-27.
-- Deletes follow-up children first, then the contact request, then the lead.
-- Does not touch other leads. Brooke is a separate block.
begin;
delete from public.lead_notifications
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.contact_request_escalations
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.escalation_run_log
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.contact_requests
where id in ('00000000-0000-0000-0000-000000000000');
delete from public.leads
where id in ('00000000-0000-0000-0000-000000000000');
select id from public.contact_requests
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- F1.5 Associate Job Test.
-- Use the status update when anyone has applied.
-- The delete is commented. Uncomment it only when both application counts are 0.
-- Children that cascade: job_applications, applications, job_post_views.
begin;
update public.job_postings
set status = 'Closed'
where id in ('00000000-0000-0000-0000-000000000000')
  and status is distinct from 'Closed';
-- delete from public.job_postings
-- where id in ('00000000-0000-0000-0000-000000000000');
select id, title, status from public.job_postings
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- F2. Seeded notifications on this login.
-- Expected titles: Badge earned: Top 10, Megan Hernandez, Jason Roberts,
-- Sarah Thompson, family of 4, and a student job application.
-- Removes only the ids you paste. Does not touch other doctors.
begin;
delete from public.notifications
where id in ('00000000-0000-0000-0000-000000000000');
select id, title from public.notifications
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- F8. Adelaide certificate. Event is May 29–30, 2026.
-- Timezone column is seminars.timezone. If the preview timezone is null,
-- this uses 18:00 Australia/Adelaide (+09:30) on 30 May 2026.
-- Running it again changes 0 rows once issued_at is on or after 29 May 2026.
begin;
update public.ce_certificates
set issued_at = timestamptz '2026-05-30 18:00:00+09:30'
where id in ('00000000-0000-0000-0000-000000000000')
  and issued_at < timestamptz '2026-05-29 00:00:00+09:30';
select id, issued_at from public.ce_certificates
where id in ('00000000-0000-0000-0000-000000000000');
commit;

-- =============================================================================
-- ASK FIRST. Commented until you decide.
-- =============================================================================

-- F1.1 ASK FIRST. Dr. John Caruso thread.
-- (a) Delete the messages, then the conversation. This removes it for him too.
-- begin;
-- delete from public.message_reports where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.messages where id in ('00000000-0000-0000-0000-000000000000') and deleted_at is null;
-- delete from public.message_email_log where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.conversation_mutes where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.notifications where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.conversations where id in ('00000000-0000-0000-0000-000000000000');
-- select id from public.conversations where id in ('00000000-0000-0000-0000-000000000000');
-- commit;
-- (b) Soft-delete only the Test messages. The inbox hides the thread after
-- the archived flag is set, once supabase/migrations/20261107000000_inbox_hide_archived.sql is applied.
-- begin;
-- update public.messages set deleted_at = now()
-- where id in ('00000000-0000-0000-0000-000000000000') and deleted_at is null and body ilike 'Test%';
-- update public.conversations set archived_at = now()
-- where id in ('00000000-0000-0000-0000-000000000000') and archived_at is null;
-- select id, archived_at from public.conversations where id in ('00000000-0000-0000-0000-000000000000');
-- commit;

-- F1.4 ASK FIRST. Brooke.
-- begin;
-- delete from public.lead_notifications where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.contact_request_escalations where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.escalation_run_log where id in ('00000000-0000-0000-0000-000000000000');
-- delete from public.contact_requests where id in ('00000000-0000-0000-0000-000000000000');
-- select id, name from public.contact_requests where id in ('00000000-0000-0000-0000-000000000000');
-- commit;

-- F1.6 ASK FIRST. 2017 New Beginnings seminar.
-- (a) Archive. Leaves registrations, reviews, and certificates in place.
-- begin;
-- update public.seminars set is_past = true
-- where id in ('00000000-0000-0000-0000-000000000000') and is_past is distinct from true;
-- select id, title, dates, is_past from public.seminars where id in ('00000000-0000-0000-0000-000000000000');
-- commit;
-- (b) Delete only when the registration count is 0.
-- Ticket types, outbound clicks, and email jobs block this delete until removed.
-- Registrations, reviews, and certificates would cascade.
-- begin;
-- delete from public.seminars where id in ('00000000-0000-0000-0000-000000000000');
-- select id from public.seminars where id in ('00000000-0000-0000-0000-000000000000');
-- commit;

-- F2 ASK FIRST. The same seeded titles on other doctors.
-- begin;
-- delete from public.notifications where id in ('00000000-0000-0000-0000-000000000000');
-- select id, title from public.notifications where id in ('00000000-0000-0000-0000-000000000000');
-- commit;

-- F5 ASK FIRST. Example P&L drafts for this login.
-- begin;
-- delete from public.doctor_tool_data
-- where id in ('00000000-0000-0000-0000-000000000000');
-- select id, tool from public.doctor_tool_data where id in ('00000000-0000-0000-0000-000000000000');
-- commit;

-- F13. Optional. Add notifications to the realtime publication so the bell
-- can subscribe. The app already polls every 60 seconds when the channel errors.
-- NOT RUN — Raymond reviews and runs.
-- alter publication supabase_realtime add table public.notifications;
