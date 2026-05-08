-- ============================================
-- Disruptive Seminars — CE Tracking + Reviews
-- ============================================

-- Add CE hours to seminars
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS ce_hours numeric;

-- Add check-in and CE completion tracking to registrations
ALTER TABLE seminar_registrations
  ADD COLUMN IF NOT EXISTS ce_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- Seminar Reviews (verified attendees only)
CREATE TABLE IF NOT EXISTS seminar_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seminar_id uuid NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(seminar_id, reviewer_id)
);

CREATE INDEX idx_seminar_reviews_seminar ON seminar_reviews (seminar_id, created_at DESC);

ALTER TABLE seminar_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seminar reviews" ON seminar_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reviews" ON seminar_reviews
  FOR ALL USING (auth.uid() = reviewer_id);

CREATE POLICY "Service role manages reviews" ON seminar_reviews
  FOR ALL USING (auth.role() = 'service_role');

-- CE Certificates (generated on check-in)
CREATE TABLE IF NOT EXISTS ce_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  seminar_id uuid NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
  registration_id uuid,
  ce_hours numeric NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_ce_certificates_user ON ce_certificates (user_id);
CREATE INDEX idx_ce_certificates_seminar ON ce_certificates (seminar_id);

ALTER TABLE ce_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates" ON ce_certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages certificates" ON ce_certificates
  FOR ALL USING (auth.role() = 'service_role');
