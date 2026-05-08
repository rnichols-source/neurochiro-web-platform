-- ============================================
-- Doctor Portal Redesign — Command Center
-- ============================================

-- Extend leads table for pipeline stages
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'scheduled', 'converted'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

-- Migrate existing leads
UPDATE leads SET stage = 'converted' WHERE confirmed_at IS NOT NULL AND (stage IS NULL OR stage = 'new');

-- Doctor Badges (gamification)
CREATE TABLE IF NOT EXISTS doctor_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_doctor_badges_user ON doctor_badges (user_id);

ALTER TABLE doctor_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges" ON doctor_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages badges" ON doctor_badges
  FOR ALL USING (auth.role() = 'service_role');
