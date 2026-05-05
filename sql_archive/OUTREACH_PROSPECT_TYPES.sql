-- NeuroChiro Outreach Prospect Types Migration
-- Run this in Supabase SQL Editor
-- Adds prospect_type to support vendor and seminar host outreach alongside doctor prospecting

-- Add prospect_type column
ALTER TABLE outreach_prospects
ADD COLUMN IF NOT EXISTS prospect_type TEXT NOT NULL DEFAULT 'doctor'
CHECK (prospect_type IN ('doctor', 'vendor', 'seminar_host'));

-- Add contact_method column if not exists (some prospects may not have it)
ALTER TABLE outreach_prospects
ADD COLUMN IF NOT EXISTS contact_method TEXT;

-- Add facebook column if not exists
ALTER TABLE outreach_prospects
ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Index for fast type filtering
CREATE INDEX IF NOT EXISTS idx_outreach_prospect_type ON outreach_prospects(prospect_type);

-- Composite index for type + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_outreach_type_status ON outreach_prospects(prospect_type, status);
