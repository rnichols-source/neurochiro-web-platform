-- Add founding_member flag to doctors table
-- Run this in Supabase SQL Editor

-- 1. Add the column (defaults to false, won't affect existing data)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE;

-- 2. Mark ALL current doctors with active subscriptions as founding members
UPDATE doctors
SET is_founding_member = TRUE
WHERE user_id IN (
  SELECT id FROM profiles WHERE tier IN ('growth', 'pro', 'premium', 'founder')
);

-- 3. Also mark anyone with verified status as founding member (they paid to be here)
UPDATE doctors
SET is_founding_member = TRUE
WHERE verification_status = 'verified';
