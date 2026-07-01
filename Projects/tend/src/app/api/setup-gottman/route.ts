import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'run in Supabase SQL Editor',
    sql: `
-- Love Map rounds (Principle 1)
CREATE TABLE IF NOT EXISTS love_map_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  partner_id uuid REFERENCES partners NOT NULL,
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  round_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE love_map_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY lm_read ON love_map_rounds FOR SELECT USING (true);
CREATE POLICY lm_insert ON love_map_rounds FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY lm_delete ON love_map_rounds FOR DELETE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Repair attempts (Principle 5)
CREATE TABLE IF NOT EXISTS repair_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  partner_id uuid REFERENCES partners NOT NULL,
  phrase text NOT NULL,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE repair_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ra_read ON repair_attempts FOR SELECT USING (true);
CREATE POLICY ra_insert ON repair_attempts FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Fight debriefs (Principle 5)
CREATE TABLE IF NOT EXISTS fight_debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  partner_id uuid REFERENCES partners NOT NULL,
  emotions text[] NOT NULL DEFAULT '{}',
  triggers text[] NOT NULL DEFAULT '{}',
  deeper_meaning text,
  need_next_time text,
  partner_did_right text,
  debrief_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fight_debriefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY fd_read ON fight_debriefs FOR SELECT USING (true);
CREATE POLICY fd_insert ON fight_debriefs FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Decisions (Principle 4)
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  created_by uuid REFERENCES partners NOT NULL,
  topic text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dec_read ON decisions FOR SELECT USING (true);
CREATE POLICY dec_insert ON decisions FOR INSERT WITH CHECK (created_by IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY dec_update ON decisions FOR UPDATE USING (true);

-- Decision responses (Principle 4)
CREATE TABLE IF NOT EXISTS decision_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES decisions NOT NULL,
  partner_id uuid REFERENCES partners NOT NULL,
  importance int NOT NULL CHECK (importance BETWEEN 1 AND 10),
  flexibility int NOT NULL CHECK (flexibility BETWEEN 1 AND 10),
  perspective text NOT NULL,
  core_need text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (decision_id, partner_id)
);
ALTER TABLE decision_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY dr_read ON decision_responses FOR SELECT USING (true);
CREATE POLICY dr_insert ON decision_responses FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Gridlock issues (Principle 6)
CREATE TABLE IF NOT EXISTS gridlock_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  created_by uuid REFERENCES partners NOT NULL,
  topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gridlock_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY gi_read ON gridlock_issues FOR SELECT USING (true);
CREATE POLICY gi_insert ON gridlock_issues FOR INSERT WITH CHECK (created_by IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Gridlock positions (Principle 6)
CREATE TABLE IF NOT EXISTS gridlock_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES gridlock_issues NOT NULL,
  partner_id uuid REFERENCES partners NOT NULL,
  position text NOT NULL,
  dream_behind text NOT NULL,
  flexible_on text,
  pain_level int NOT NULL CHECK (pain_level BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, partner_id)
);
ALTER TABLE gridlock_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY gp_read ON gridlock_positions FOR SELECT USING (true);
CREATE POLICY gp_insert ON gridlock_positions FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY gp_update ON gridlock_positions FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Rituals of connection (Principle 7)
CREATE TABLE IF NOT EXISTS rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  frequency text,
  rating int CHECK (rating BETWEEN 1 AND 5),
  improvement_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
CREATE POLICY rit_read ON rituals FOR SELECT USING (true);
CREATE POLICY rit_insert ON rituals FOR INSERT WITH CHECK (true);
CREATE POLICY rit_update ON rituals FOR UPDATE USING (true);
CREATE POLICY rit_delete ON rituals FOR DELETE USING (true);

-- Shared goals (Principle 7)
CREATE TABLE IF NOT EXISTS shared_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples NOT NULL,
  goal text NOT NULL,
  action_steps text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shared_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY sg_read ON shared_goals FOR SELECT USING (true);
CREATE POLICY sg_insert ON shared_goals FOR INSERT WITH CHECK (true);
CREATE POLICY sg_update ON shared_goals FOR UPDATE USING (true);
CREATE POLICY sg_delete ON shared_goals FOR DELETE USING (true);
`
  })
}
