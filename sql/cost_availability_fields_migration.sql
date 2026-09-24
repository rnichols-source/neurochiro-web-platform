-- Cost and availability fields for doctor profiles
-- Run in Supabase SQL Editor

-- Cost fields (new)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS first_visit_price TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS payment_model TEXT CHECK (payment_model IN ('cash', 'insurance', 'both'));
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS files_insurance BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS payment_plans BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS free_consultation BOOLEAN DEFAULT false;

-- Availability fields (evening/weekend flags are new)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS has_evening_hours BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS has_weekend_hours BOOLEAN DEFAULT false;
