-- NOT RUN — Raymond reviews the audit output first, then runs this in a transaction.
-- Draft only. Idempotent. Does not change leads or contact_requests.
-- Read sql/rls_audit_readonly.sql first and send the output before running this.

-- ---------------------------------------------------------------------------
-- Helper: enable RLS and add an owner policy when the table exists.
-- owner_expr is a SQL boolean, for example: user_id = auth.uid()
-- ---------------------------------------------------------------------------

-- profiles: the signed-in person can read and update their own row.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- doctors: leave the existing public SELECT of listed/verified rows as it is.
-- Enable RLS only when a SELECT policy already exists, so the directory does
-- not go dark. Adds an owner UPDATE and an owner SELECT for the doctor's own row.
DO $$
BEGIN
  IF to_regclass('public.doctors') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctors' AND cmd IN ('SELECT', 'ALL')
      AND policyname NOT IN ('doctors_owner_select', 'doctors_owner_update')
  ) THEN
    RAISE NOTICE 'doctors: no public SELECT policy found. RLS was not enabled. Review the audit before tightening.';
    RETURN;
  END IF;
  ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctors' AND policyname = 'doctors_owner_select'
  ) THEN
    CREATE POLICY doctors_owner_select ON public.doctors
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctors' AND policyname = 'doctors_owner_update'
  ) THEN
    CREATE POLICY doctors_owner_update ON public.doctors
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- notifications: select and update own rows.
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON public.notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_update_own'
  ) THEN
    CREATE POLICY notifications_update_own ON public.notifications
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Own-row tables. course_purchases is select-only. The rest are select/insert/update/delete
-- for the owner column used by the client. Tables that are not in this database yet are skipped.
DO $$
DECLARE
  spec record;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('notification_preferences', 'user_id', true),
      ('doctor_tool_data', 'user_id', true),
      ('pl_snapshots', 'user_id', true),
      ('financial_plans', 'user_id', true),
      ('contract_drafts', 'user_id', true),
      ('course_progress', 'user_id', true),
      ('course_purchases', 'user_id', false),
      ('technique_quiz_state', 'user_id', true),
      ('interview_prep_state', 'user_id', true),
      ('neuros_practice_config', 'user_id', true),
      ('neuros_care_plans', 'user_id', true)
      -- students (user_id), job_applications (applicant_id) and applications
      -- (candidate_id) are in the client inventory. They are not changed here:
      -- enable RLS only after the audit shows whether anon can already read them.
    ) AS t(table_name, owner_column, allow_write)
  LOOP
    IF to_regclass('public.' || spec.table_name) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', spec.table_name);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = spec.table_name AND policyname = spec.table_name || '_select_own'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (%I = auth.uid())',
        spec.table_name || '_select_own', spec.table_name, spec.owner_column
      );
    END IF;
    IF spec.allow_write AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = spec.table_name AND policyname = spec.table_name || '_write_own'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (%I = auth.uid()) WITH CHECK (%I = auth.uid())',
        spec.table_name || '_write_own', spec.table_name, spec.owner_column, spec.owner_column
      );
    END IF;
  END LOOP;
END $$;

-- automation_queue has no user column in the generated types. The client
-- AnnouncementBuilder writes it. Enabling RLS here with no owner policy would
-- block that write, and a public policy would be wrong. Left unchanged.
-- Service-role writes keep working either way.

-- Messaging. Policies already live in supabase/migrations/20261020_messaging_rls_security.sql:
--   users_read_own_conversations, users_create_own_conversations, users_update_own_conversations,
--   users_read_own_messages, users_insert_own_messages, users_update_received_messages.
-- Created here only when those names are missing. PR D tightens the remaining gaps.
DO $$
BEGIN
  IF to_regclass('public.conversations') IS NOT NULL THEN
    ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'users_read_own_conversations') THEN
      CREATE POLICY users_read_own_conversations ON public.conversations
        FOR SELECT USING (participant_one_id = auth.uid() OR participant_two_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'users_create_own_conversations') THEN
      CREATE POLICY users_create_own_conversations ON public.conversations
        FOR INSERT WITH CHECK (participant_one_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'users_update_own_conversations') THEN
      CREATE POLICY users_update_own_conversations ON public.conversations
        FOR UPDATE USING (participant_one_id = auth.uid() OR participant_two_id = auth.uid());
    END IF;
  END IF;

  IF to_regclass('public.messages') IS NOT NULL THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'users_read_own_messages') THEN
      CREATE POLICY users_read_own_messages ON public.messages
        FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'users_insert_own_messages') THEN
      CREATE POLICY users_insert_own_messages ON public.messages
        FOR INSERT WITH CHECK (sender_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'users_update_received_messages') THEN
      CREATE POLICY users_update_received_messages ON public.messages
        FOR UPDATE USING (recipient_id = auth.uid());
    END IF;
  END IF;
END $$;

-- Announcements. Copied from sql_archive/SUPABASE_NOTIFICATIONS.sql.
-- Production returned 404 for these tables on 2026-10-31, so they may not exist yet.
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  audience_type text NOT NULL DEFAULT 'all',
  audience_filter jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'info',
  delivery_methods text[] DEFAULT '{in-platform}',
  starts_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_select_authenticated'
  ) THEN
    CREATE POLICY announcements_select_authenticated ON public.announcements
      FOR SELECT TO authenticated
      USING (now() >= starts_at AND (expires_at IS NULL OR now() <= expires_at));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcement_dismissals' AND policyname = 'announcement_dismissals_select_own'
  ) THEN
    CREATE POLICY announcement_dismissals_select_own ON public.announcement_dismissals
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcement_dismissals' AND policyname = 'announcement_dismissals_insert_own'
  ) THEN
    CREATE POLICY announcement_dismissals_insert_own ON public.announcement_dismissals
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Realtime: doctors should only receive their own notification inserts.
-- The client filter is user_id=eq.<id>. The publication has to include the table.
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ce_certificates(registration_id) unique index.
-- NOT ENABLED. Duplicates must be cleaned first. See the cleanup SELECT in PR B
-- (sql/portal_test_data_cleanup.sql) before uncommenting.
-- CREATE UNIQUE INDEX IF NOT EXISTS ce_certificates_registration_id_key
--   ON public.ce_certificates (registration_id);
