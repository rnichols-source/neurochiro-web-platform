-- ZIP code coordinates table (GeoNames US postal codes, CC BY 4.0)
-- Run in Supabase SQL Editor, then run scripts/import-zip-codes.ts to populate

CREATE TABLE IF NOT EXISTS zip_codes (
  zip TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS zip_codes_state_idx ON zip_codes (state);

-- RLS: allow anon reads for search, service role for writes
ALTER TABLE zip_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read zip_codes"
  ON zip_codes FOR SELECT
  USING (true);

CREATE POLICY "Service role can write zip_codes"
  ON zip_codes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
