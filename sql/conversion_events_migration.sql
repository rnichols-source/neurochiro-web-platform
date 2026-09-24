-- Conversion events tracking for directory
-- No IP, no user agent, no patient identifiers.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('book', 'call', 'inquiry', 'profile_view', 'directions')),
  source_page TEXT NOT NULL,
  had_location BOOLEAN DEFAULT false,
  search_distance_miles NUMERIC,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversion_events_doctor_idx ON conversion_events (doctor_id);
CREATE INDEX IF NOT EXISTS conversion_events_type_idx ON conversion_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS conversion_events_created_idx ON conversion_events (created_at);

-- Dedup index: prevent rapid double-clicks from same session
CREATE UNIQUE INDEX IF NOT EXISTS conversion_events_dedup_idx
  ON conversion_events (doctor_id, event_type, session_id, (created_at::date));

-- RLS: service role only
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on conversion_events"
  ON conversion_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
