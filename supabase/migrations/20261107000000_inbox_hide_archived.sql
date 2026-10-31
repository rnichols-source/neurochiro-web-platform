-- NOT RUN — Raymond reviews and runs
-- Hide archived conversations from the inbox.
-- Body copied from supabase/migrations/20261103000000_messaging_hardening.sql
-- (get_inbox, lines 212–257). The only change is `and c.archived_at is null`.

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
    AND c.archived_at IS NULL
    AND (before IS NULL OR c.last_message_at < before)
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(lim, 30), 50));
$$;
