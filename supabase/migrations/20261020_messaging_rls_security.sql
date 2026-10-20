-- ============================================
-- SECURITY FIX: Enable RLS on messaging tables
-- ============================================

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only read conversations they participate in
CREATE POLICY "users_read_own_conversations"
  ON conversations FOR SELECT
  USING (
    participant_one_id = auth.uid()
    OR participant_two_id = auth.uid()
  );

-- Users can only insert conversations they participate in
CREATE POLICY "users_create_own_conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    participant_one_id = auth.uid()
  );

-- Users can update conversations they participate in (for last_message_at)
CREATE POLICY "users_update_own_conversations"
  ON conversations FOR UPDATE
  USING (
    participant_one_id = auth.uid()
    OR participant_two_id = auth.uid()
  );

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages they sent or received
CREATE POLICY "users_read_own_messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
  );

-- Users can only insert messages where they are the sender
CREATE POLICY "users_insert_own_messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Users can update messages they received (for read_at)
CREATE POLICY "users_update_received_messages"
  ON messages FOR UPDATE
  USING (
    recipient_id = auth.uid()
  );

-- Add indexes for performance with RLS
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
