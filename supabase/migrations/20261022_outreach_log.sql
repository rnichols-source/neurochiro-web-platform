-- Cold DM outreach log table
-- Tracks individual cold DM sends with demand snapshots for conversion analysis.
-- The broader outreach_logs table already exists and is used by the outreach station.
-- This migration ensures the outreach_logs table has the columns needed for cold DM tracking.

-- Add intent column if not exists (used to distinguish cold_dm from other outreach)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outreach_logs' AND column_name = 'intent'
  ) THEN
    ALTER TABLE outreach_logs ADD COLUMN intent text;
  END IF;
END $$;

-- Add demand_snapshot column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outreach_logs' AND column_name = 'demand_snapshot'
  ) THEN
    ALTER TABLE outreach_logs ADD COLUMN demand_snapshot jsonb;
  END IF;
END $$;

-- Index for querying cold DM stats
CREATE INDEX IF NOT EXISTS idx_outreach_logs_intent
  ON outreach_logs (intent)
  WHERE intent = 'cold_dm';

-- Index for dedup lookups by prospect handle
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_handle
  ON outreach_prospects (instagram_handle);

-- Index for cold DM source filter
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_source
  ON outreach_prospects (source)
  WHERE source = 'cold_dm';
