-- Structured profile fields for Phase 4: bio and education
-- Run in Supabase SQL Editor

-- Structured bio fields (replace free-text bio)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS short_intro TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS philosophy TEXT;

-- Structured education fields (replace free-text education array)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS chiropractic_school TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS degree TEXT DEFAULT 'Doctor of Chiropractic (DC)';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS post_doctoral_training TEXT[];
