-- "Help me find someone" requests from city pages
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS find_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  zip TEXT NOT NULL,
  note TEXT,
  city_searched TEXT,
  state_searched TEXT,
  status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS find_requests_status_idx ON find_requests (status, created_at);

ALTER TABLE find_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on find_requests"
  ON find_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
