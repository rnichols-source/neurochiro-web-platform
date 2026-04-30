-- Add founding_member flag to doctors table
-- Run this in Supabase SQL Editor

-- 1. Add the column (defaults to false, won't affect existing data)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE;

-- 2. Mark ALL current verified doctors as founding members
-- These are the doctors who believed early and are already on the platform
UPDATE doctors
SET is_founding_member = TRUE
WHERE verification_status = 'verified';
