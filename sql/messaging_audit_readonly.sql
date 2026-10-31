-- Read-only. Do not add INSERT, UPDATE, DELETE, or DDL.
-- Run this in the Supabase SQL editor and send the output before the messaging migration.

-- Policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('messages', 'conversations', 'user_blocks', 'message_reports', 'conversation_mutes', 'message_email_log')
ORDER BY tablename, policyname;

-- Triggers on messages
SELECT tgname, tgenabled, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.messages'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- Realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations')
ORDER BY tablename;

-- Foreign keys and their delete action
SELECT
  conrelid::regclass AS table_name,
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('messages', 'conversations', 'user_blocks', 'message_reports', 'conversation_mutes', 'message_email_log', 'notifications')
ORDER BY table_name::text, conname;

-- Duplicate direct pairs, ignoring order
SELECT LEAST(participant_one_id, participant_two_id) AS pair_low,
       GREATEST(participant_one_id, participant_two_id) AS pair_high,
       count(*) AS copies
FROM conversations
WHERE context_type IS NULL OR context_type = 'direct'
GROUP BY 1, 2
HAVING count(*) > 1
ORDER BY copies DESC;

-- Messages whose sender or recipient is not a participant
SELECT count(*) AS mismatched_messages
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE NOT (
  (m.sender_id = c.participant_one_id AND m.recipient_id = c.participant_two_id)
  OR (m.sender_id = c.participant_two_id AND m.recipient_id = c.participant_one_id)
);

-- Non-system bodies that start with the spoofable prefix
SELECT count(*) AS spoofed_prefix
FROM messages
WHERE message_type IS DISTINCT FROM 'system'
  AND body LIKE '[SYSTEM]%';

-- System rows. Review these before deciding who may post them.
SELECT count(*) AS system_messages
FROM messages
WHERE message_type = 'system';

-- Unread message notifications per user
SELECT user_id, count(*) AS unread_message_notifications
FROM notifications
WHERE type = 'message' AND read_at IS NULL
GROUP BY user_id
ORDER BY unread_message_notifications DESC
LIMIT 50;
