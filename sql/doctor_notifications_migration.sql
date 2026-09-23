-- Doctor-joined notification dedup table
-- Tracks which subscribers have been notified about which doctors.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS doctor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS doctor_notifications_doctor_idx ON doctor_notifications (doctor_id);
CREATE INDEX IF NOT EXISTS doctor_notifications_subscriber_idx ON doctor_notifications (subscriber_id);

-- RLS: service role only
ALTER TABLE doctor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on doctor_notifications"
  ON doctor_notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
