-- Profile Boost for doctor directory ranking
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz;
