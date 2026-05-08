-- ============================================
-- ChiroScore + Salary Transparency Engine
-- ============================================

-- Student Certifications (technique certifications for ChiroScore)
CREATE TABLE IF NOT EXISTS student_certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  technique_name text NOT NULL,
  certification_date date,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(student_id, technique_name)
);

CREATE INDEX idx_student_certs_student ON student_certifications (student_id);

ALTER TABLE student_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own certifications" ON student_certifications
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Anyone can view certifications" ON student_certifications
  FOR SELECT USING (true);

-- Employer Feedback (doctors rate hired students)
CREATE TABLE IF NOT EXISTS employer_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES job_postings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(doctor_id, student_id, job_id)
);

CREATE INDEX idx_employer_feedback_student ON employer_feedback (student_id);
CREATE INDEX idx_employer_feedback_doctor ON employer_feedback (doctor_id);

ALTER TABLE employer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage their own feedback" ON employer_feedback
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Students can view feedback about themselves" ON employer_feedback
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Service role full access to feedback" ON employer_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- Extend market_benchmarks for salary transparency engine
ALTER TABLE market_benchmarks
  ADD COLUMN IF NOT EXISTS median_salary integer,
  ADD COLUMN IF NOT EXISTS sample_size integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS state_code text,
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_market_benchmarks_state ON market_benchmarks (state_code, role_type);
