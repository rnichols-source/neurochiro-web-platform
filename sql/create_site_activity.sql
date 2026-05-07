-- Site Activity table for live ticker
-- Tracks anonymous page views, searches, and profile views
CREATE TABLE IF NOT EXISTS site_activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'search', 'profile_view')),
  page_path text,
  search_query text,
  doctor_id uuid REFERENCES doctors(id),
  city text,
  state text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast recent-activity queries
CREATE INDEX idx_site_activity_created_at ON site_activity (created_at DESC);
CREATE INDEX idx_site_activity_event_type ON site_activity (event_type, created_at DESC);

-- Auto-delete rows older than 7 days to keep table small
-- Run this as a cron job or pg_cron:
-- SELECT cron.schedule('cleanup_site_activity', '0 * * * *', $$DELETE FROM site_activity WHERE created_at < now() - interval '7 days'$$);

-- RLS: allow anonymous inserts, no reads from client
ALTER TABLE site_activity ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous tracking)
CREATE POLICY "Anyone can insert activity" ON site_activity
  FOR INSERT WITH CHECK (true);

-- Only service role can read
CREATE POLICY "Service role can read activity" ON site_activity
  FOR SELECT USING (auth.role() = 'service_role');
