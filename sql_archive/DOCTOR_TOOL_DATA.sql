-- Doctor Tool Data Storage
-- Replaces localStorage for Care Plan, KPI Tracker, and other doctor tools
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS doctor_tool_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL, -- 'care_plan', 'kpi_tracker', 'kpi_goals'
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_doctor_tool_user ON doctor_tool_data(user_id, tool);

-- RLS
ALTER TABLE doctor_tool_data ENABLE ROW LEVEL SECURITY;

-- Doctors can only read/write their own data
CREATE POLICY "Users can manage their own tool data"
  ON doctor_tool_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
