-- ============================================
-- ChiroMatch — Residency-Style Matching System
-- ============================================

-- Match Cycles (Spring/Fall each year)
CREATE TABLE IF NOT EXISTS match_cycles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  season text NOT NULL CHECK (season IN ('spring', 'fall')),
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ranking_open', 'ranking_closed', 'matching', 'matched', 'completed')),
  ranking_opens_at timestamptz NOT NULL,
  ranking_closes_at timestamptz NOT NULL,
  match_day timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(season, year)
);

CREATE INDEX idx_match_cycles_status ON match_cycles (status);

ALTER TABLE match_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cycles" ON match_cycles FOR SELECT USING (true);
CREATE POLICY "Service role manages cycles" ON match_cycles FOR ALL USING (auth.role() = 'service_role');

-- Match Positions (doctor-created positions per cycle)
CREATE TABLE IF NOT EXISTS match_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid NOT NULL REFERENCES match_cycles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  compensation_type text CHECK (compensation_type IN ('salary', 'production', 'hybrid')),
  salary_min integer,
  salary_max integer,
  benefits text[],
  requirements text[],
  city text,
  state text,
  practice_type text,
  mentorship_offered boolean DEFAULT false,
  max_matches integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('active', 'filled', 'withdrawn')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_match_positions_cycle ON match_positions (cycle_id);
CREATE INDEX idx_match_positions_doctor ON match_positions (doctor_id);

ALTER TABLE match_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active positions" ON match_positions FOR SELECT USING (true);
CREATE POLICY "Doctors can manage own positions" ON match_positions FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Service role manages positions" ON match_positions FOR ALL USING (auth.role() = 'service_role');

-- Student Rankings (preference list)
CREATE TABLE IF NOT EXISTS match_student_rankings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid NOT NULL REFERENCES match_cycles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  position_id uuid NOT NULL REFERENCES match_positions(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 10),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cycle_id, student_id, position_id),
  UNIQUE(cycle_id, student_id, rank)
);

CREATE INDEX idx_match_student_rankings_student ON match_student_rankings (cycle_id, student_id);

ALTER TABLE match_student_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own rankings" ON match_student_rankings FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Service role manages rankings" ON match_student_rankings FOR ALL USING (auth.role() = 'service_role');

-- Doctor Rankings (per position)
CREATE TABLE IF NOT EXISTS match_doctor_rankings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid NOT NULL REFERENCES match_cycles(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES match_positions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  rank integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cycle_id, position_id, student_id),
  UNIQUE(cycle_id, position_id, rank)
);

CREATE INDEX idx_match_doctor_rankings_position ON match_doctor_rankings (cycle_id, position_id);

ALTER TABLE match_doctor_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Position owners can manage rankings" ON match_doctor_rankings FOR ALL USING (
  auth.uid() IN (SELECT doctor_id FROM match_positions WHERE id = position_id)
);
CREATE POLICY "Service role manages rankings" ON match_doctor_rankings FOR ALL USING (auth.role() = 'service_role');

-- Match Results (algorithm output)
CREATE TABLE IF NOT EXISTS match_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid NOT NULL REFERENCES match_cycles(id) ON DELETE CASCADE,
  position_id uuid REFERENCES match_positions(id),
  student_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('matched', 'unmatched')),
  matched_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(cycle_id, student_id)
);

CREATE INDEX idx_match_results_cycle ON match_results (cycle_id);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own results" ON match_results FOR SELECT USING (
  auth.uid() = student_id OR
  auth.uid() IN (SELECT doctor_id FROM match_positions WHERE id = position_id)
);
CREATE POLICY "Service role manages results" ON match_results FOR ALL USING (auth.role() = 'service_role');
