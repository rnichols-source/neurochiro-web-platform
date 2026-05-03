-- Patient Checkins View
-- Creates a view that maps daily_logs columns to what premium-actions.ts expects
-- This resolves the schema mismatch between track page (daily_logs) and premium features (patient_checkins)
-- Run this in Supabase SQL Editor

-- Create the patient_checkins table if it doesn't exist
-- This matches the schema expected by premium-actions.ts
CREATE TABLE IF NOT EXISTS patient_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  sleep INT NOT NULL DEFAULT 5,
  stress INT NOT NULL DEFAULT 3,
  energy INT NOT NULL DEFAULT 5,
  pain INT NOT NULL DEFAULT 3,
  score INT NOT NULL DEFAULT 50,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_patient_checkins_user ON patient_checkins(user_id, date DESC);

-- RLS
ALTER TABLE patient_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checkins"
  ON patient_checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sync trigger: when daily_logs is inserted, also insert into patient_checkins
-- This ensures Track page data flows to Journey/Exercises
CREATE OR REPLACE FUNCTION sync_daily_log_to_checkin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO patient_checkins (user_id, date, sleep, energy, pain, stress, score, note)
  VALUES (
    NEW.user_id,
    NEW.log_date,
    COALESCE(NEW.sleep_quality, 5),
    COALESCE(NEW.energy_level, 5),
    COALESCE(NEW.pain_level, 3),
    3, -- default stress (not tracked in daily_logs)
    (COALESCE(NEW.sleep_quality, 5) * 5) + (15) + (COALESCE(NEW.energy_level, 5) * 5) + ((6 - COALESCE(NEW.pain_level, 3)) * 5),
    NEW.notes
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    sleep = EXCLUDED.sleep,
    energy = EXCLUDED.energy,
    pain = EXCLUDED.pain,
    score = EXCLUDED.score,
    note = EXCLUDED.note;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_daily_log ON daily_logs;
CREATE TRIGGER sync_daily_log
  AFTER INSERT OR UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION sync_daily_log_to_checkin();
