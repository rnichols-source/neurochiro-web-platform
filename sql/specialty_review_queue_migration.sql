-- Specialty review queue: tags that didn't map to the controlled vocabulary
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS specialty_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  original_tag TEXT NOT NULL,
  source_field TEXT NOT NULL DEFAULT 'specialties',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'added_to_vocabulary')),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS specialty_review_queue_status_idx ON specialty_review_queue (status);
CREATE INDEX IF NOT EXISTS specialty_review_queue_doctor_idx ON specialty_review_queue (doctor_id);

ALTER TABLE specialty_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on specialty_review_queue"
  ON specialty_review_queue FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
