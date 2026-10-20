-- ============================================
-- MESSAGING REBUILD — Schema changes
-- ============================================

-- 1. Extend conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS context_type text CHECK (context_type IN ('referral', 'job_application', 'chiromatch', 'direct', 'broadcast')),
  ADD COLUMN IF NOT EXISTS context_id uuid,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Extend messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system')),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_blocks"
  ON user_blocks FOR ALL
  USING (blocker_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- 4. Create message_reports table
CREATE TABLE IF NOT EXISTS message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reason text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_create_own_reports"
  ON message_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "users_read_own_reports"
  ON message_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- 5. Create conversation_mutes table (separate table, not muted_by array)
-- Justification: an array column on conversations would require UPDATE
-- permission for muting, mixing with other updates. A separate table
-- lets each user manage their own mute state independently via RLS.
CREATE TABLE IF NOT EXISTS conversation_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

ALTER TABLE conversation_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_mutes"
  ON conversation_mutes FOR ALL
  USING (user_id = auth.uid());

-- 6. Add accepts_student_messages to doctors (default FALSE)
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS accepts_student_messages boolean NOT NULL DEFAULT false;

-- 7. Add message_email_last_sent tracking to prevent email spam
-- Tracks per-conversation when we last emailed about unread messages
CREATE TABLE IF NOT EXISTS message_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- 8. Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_conversations_context ON conversations(context_type, context_id) WHERE context_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type) WHERE message_type = 'system';
