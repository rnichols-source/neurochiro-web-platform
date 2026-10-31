-- NOT RUN — Raymond reviews and runs
-- Messaging hardening. Safe to re-run. Code works before this file runs.
-- Read sql/messaging_audit_readonly.sql first.
-- Service-role check below uses BOTH current_user and auth.jwt() ->> 'role'.
-- Confirm which one the new sb_secret_ key sets on the preview before relying on system messages.

-- 1. Pre-check. Leave these commented. If the audit shows duplicate direct pairs,
-- run the merge into the oldest conversation, then create the unique index.
-- SELECT LEAST(participant_one_id, participant_two_id) AS pair_low,
--        GREATEST(participant_one_id, participant_two_id) AS pair_high,
--        array_agg(id ORDER BY created_at) AS ids
-- FROM conversations
-- WHERE context_type IS NULL OR context_type = 'direct'
-- GROUP BY 1, 2
-- HAVING count(*) > 1;
--
-- WITH ranked AS (
--   SELECT id,
--          LEAST(participant_one_id, participant_two_id) AS pair_low,
--          GREATEST(participant_one_id, participant_two_id) AS pair_high,
--          row_number() OVER (
--            PARTITION BY LEAST(participant_one_id, participant_two_id), GREATEST(participant_one_id, participant_two_id)
--            ORDER BY created_at, id
--          ) AS n
--   FROM conversations
--   WHERE context_type IS NULL OR context_type = 'direct'
-- ), keeper AS (
--   SELECT pair_low, pair_high, id AS keep_id FROM ranked WHERE n = 1
-- )
-- UPDATE messages m
-- SET conversation_id = k.keep_id
-- FROM ranked r
-- JOIN keeper k ON k.pair_low = r.pair_low AND k.pair_high = r.pair_high
-- WHERE m.conversation_id = r.id AND r.n > 1;
-- DELETE FROM conversations c
-- USING ranked r
-- WHERE c.id = r.id AND r.n > 1;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pair_low uuid GENERATED ALWAYS AS (LEAST(participant_one_id, participant_two_id)) STORED;
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pair_high uuid GENERATED ALWAYS AS (GREATEST(participant_one_id, participant_two_id)) STORED;

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_pair_uidx
    ON conversations (pair_low, pair_high)
    WHERE (context_type IS NULL OR context_type = 'direct');
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'conversations_direct_pair_uidx skipped. Run the commented merge after the audit.';
END $$;

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS conversations_context_uidx
    ON conversations (context_type, context_id)
    WHERE context_id IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'conversations_context_uidx skipped. Two rows share a context id.';
END $$;

-- Do not drop the old order-sensitive unique index here.
-- A unique (participant_one_id, participant_two_id) with no context predicate
-- would reject a referral thread between two people who already have a direct thread.
-- A unique index that includes context_type does not block context threads.
-- Drop the order-sensitive one only after the audit names it and shows it blocks context rows.
-- DROP INDEX IF EXISTS conversations_participants_key;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_message_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_id_uidx
  ON messages (sender_id, client_message_id)
  WHERE client_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_unread_recipient_idx
  ON messages (recipient_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_thread_order_idx
  ON messages (conversation_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.messages_enforce_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  p1 uuid;
  p2 uuid;
  jwt_role text;
BEGIN
  SELECT participant_one_id, participant_two_id INTO p1, p2
  FROM conversations WHERE id = NEW.conversation_id;
  IF p1 IS NULL OR p2 IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;
  IF NEW.sender_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'sender and recipient must differ';
  END IF;
  IF NOT (
    (NEW.sender_id = p1 AND NEW.recipient_id = p2)
    OR (NEW.sender_id = p2 AND NEW.recipient_id = p1)
  ) THEN
    RAISE EXCEPTION 'sender and recipient must be the conversation participants';
  END IF;
  IF char_length(COALESCE(NEW.body, '')) < 1 OR char_length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'body length must be between 1 and 2000';
  END IF;
  IF NEW.message_type = 'system' THEN
    jwt_role := COALESCE(auth.jwt() ->> 'role', '');
    IF NOT (current_user = 'service_role' OR jwt_role = 'service_role') THEN
      RAISE EXCEPTION 'system messages require the service role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_enforce_integrity ON messages;
CREATE TRIGGER messages_enforce_integrity
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.messages_enforce_integrity();

REVOKE UPDATE ON messages FROM authenticated, anon;
GRANT UPDATE (read_at) ON messages TO authenticated;

DROP POLICY IF EXISTS "users_update_received_messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages to mark as read" ON messages;
DROP POLICY IF EXISTS "users_mark_read" ON messages;
CREATE POLICY "users_mark_read" ON messages
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "users_insert_own_messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          (c.participant_one_id = auth.uid() AND c.participant_two_id = recipient_id)
          OR (c.participant_two_id = auth.uid() AND c.participant_one_id = recipient_id)
        )
    )
  );

DROP POLICY IF EXISTS "users_update_own_conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;

-- Legacy names from sql_archive/MESSAGING_SCHEMA.sql. Admin read-all stays off
-- unless Raymond says otherwise after the audit (step 17). Recommended: reported messages only.
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
-- CREATE POLICY "admins_read_all_messages" ON messages FOR SELECT
--   USING (EXISTS (
--     SELECT 1 FROM profiles
--     WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'founder')
--   ));

-- Check the audit for on_message_inserted before running this. App code now owns
-- the single unread notification and the delayed email. Dropping the trigger
-- stops the duplicate. Do not drop it if the audit shows nothing else sends those.
DROP TRIGGER IF EXISTS on_message_inserted ON messages;

CREATE OR REPLACE FUNCTION public.ensure_direct_conversation(other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  cid uuid;
  low uuid;
  high uuid;
BEGIN
  IF me IS NULL OR other IS NULL OR other = me THEN
    RAISE EXCEPTION 'invalid participant';
  END IF;
  low := LEAST(me, other);
  high := GREATEST(me, other);
  SELECT id INTO cid
  FROM conversations
  WHERE pair_low = low AND pair_high = high
    AND (context_type IS NULL OR context_type = 'direct')
  ORDER BY created_at
  LIMIT 1;
  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;
  INSERT INTO conversations (participant_one_id, participant_two_id, context_type)
  VALUES (me, other, 'direct')
  ON CONFLICT (pair_low, pair_high) WHERE (context_type IS NULL OR context_type = 'direct')
  DO NOTHING
  RETURNING id INTO cid;
  IF cid IS NULL THEN
    SELECT id INTO cid
    FROM conversations
    WHERE pair_low = low AND pair_high = high
      AND (context_type IS NULL OR context_type = 'direct')
    LIMIT 1;
  END IF;
  RETURN cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_inbox(lim int, before timestamptz)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_name text,
  other_role text,
  last_message_at timestamptz,
  last_preview text,
  unread_count int,
  context_type text,
  context_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    CASE WHEN c.participant_one_id = auth.uid() THEN c.participant_two_id ELSE c.participant_one_id END,
    p.full_name,
    p.role,
    c.last_message_at,
    (
      SELECT m.body FROM messages m
      WHERE m.conversation_id = c.id AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ),
    (
      SELECT count(*)::int FROM messages m
      WHERE m.conversation_id = c.id
        AND m.recipient_id = auth.uid()
        AND m.read_at IS NULL
        AND m.deleted_at IS NULL
    ),
    c.context_type,
    c.context_id
  FROM conversations c
  LEFT JOIN profiles p
    ON p.id = CASE WHEN c.participant_one_id = auth.uid() THEN c.participant_two_id ELSE c.participant_one_id END
  WHERE (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    AND (before IS NULL OR c.last_message_at < before)
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(lim, 30), 50));
$$;

CREATE OR REPLACE FUNCTION public.get_unread_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'messages', (
      SELECT count(*) FROM messages
      WHERE recipient_id = auth.uid() AND read_at IS NULL AND deleted_at IS NULL
    ),
    'notifications_excluding_messages', (
      SELECT count(*) FROM notifications
      WHERE user_id = auth.uid()
        AND read_at IS NULL
        AND type IS DISTINCT FROM 'message'
        AND type IS DISTINCT FROM 'portal_login'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.ensure_direct_conversation(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_inbox(int, timestamptz) FROM public;
REVOKE ALL ON FUNCTION public.get_unread_summary() FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inbox(int, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_summary() TO authenticated;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS conversation_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_one_unread_thread
  ON notifications (user_id, conversation_id)
  WHERE type = 'message' AND read_at IS NULL AND conversation_id IS NOT NULL;
