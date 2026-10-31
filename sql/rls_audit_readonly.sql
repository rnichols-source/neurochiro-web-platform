-- READ-ONLY. Safe to run in Supabase SQL editor.
-- Lists row security, policies, and anon grants for the tables the browser touches.
-- Does not change anything.

WITH tables(name) AS (
  VALUES
    ('profiles'),
    ('doctors'),
    ('course_purchases'),
    ('notifications'),
    ('announcements'),
    ('announcement_dismissals'),
    ('messages'),
    ('conversations'),
    ('students'),
    ('technique_quiz_state'),
    ('pl_snapshots'),
    ('notification_preferences'),
    ('neuros_practice_config'),
    ('neuros_care_plans'),
    ('job_applications'),
    ('interview_prep_state'),
    ('financial_plans'),
    ('doctor_tool_data'),
    ('course_progress'),
    ('contract_drafts'),
    ('automation_queue'),
    ('applications'),
    ('leads'),
    ('contact_requests'),
    ('seminars'),
    ('seminar_registrations'),
    ('ce_certificates'),
    ('match_cycles'),
    ('match_positions'),
    ('job_postings'),
    ('reply_logs'),
    ('link_clicks'),
    ('analytics_events')
)
SELECT
  t.name AS table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
FROM tables t
LEFT JOIN pg_class c ON c.relname = t.name
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
ORDER BY t.name;

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'doctors', 'course_purchases', 'notifications', 'announcements',
    'announcement_dismissals', 'messages', 'conversations', 'students',
    'technique_quiz_state', 'pl_snapshots', 'notification_preferences',
    'neuros_practice_config', 'neuros_care_plans', 'job_applications',
    'interview_prep_state', 'financial_plans', 'doctor_tool_data',
    'course_progress', 'contract_drafts', 'automation_queue', 'applications',
    'leads', 'contact_requests', 'seminars', 'seminar_registrations',
    'ce_certificates', 'match_cycles', 'match_positions', 'job_postings',
    'reply_logs', 'link_clicks', 'analytics_events'
  )
ORDER BY tablename, policyname;

SELECT
  table_name,
  privilege_type,
  grantee
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name IN (
    'profiles', 'doctors', 'course_purchases', 'notifications', 'announcements',
    'announcement_dismissals', 'messages', 'conversations', 'students',
    'technique_quiz_state', 'pl_snapshots', 'notification_preferences',
    'neuros_practice_config', 'neuros_care_plans', 'job_applications',
    'interview_prep_state', 'financial_plans', 'doctor_tool_data',
    'course_progress', 'contract_drafts', 'automation_queue', 'applications',
    'leads', 'contact_requests', 'seminars', 'seminar_registrations',
    'ce_certificates', 'match_cycles', 'match_positions', 'job_postings',
    'reply_logs', 'link_clicks', 'analytics_events'
  )
ORDER BY table_name, privilege_type;
