-- Google Reviews URL field
-- Run in Supabase SQL Editor
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_reviews_url TEXT;
