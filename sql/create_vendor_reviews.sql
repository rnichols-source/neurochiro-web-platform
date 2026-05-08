-- Vendor Reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doctor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(vendor_id, doctor_user_id) -- one review per doctor per vendor
);

CREATE INDEX idx_vendor_reviews_vendor ON vendor_reviews (vendor_id, created_at DESC);

ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read vendor reviews" ON vendor_reviews
  FOR SELECT USING (true);

-- Only authenticated users can insert their own review
CREATE POLICY "Doctors can insert their own review" ON vendor_reviews
  FOR INSERT WITH CHECK (auth.uid() = doctor_user_id);

-- Vendor Usage table (social proof)
CREATE TABLE IF NOT EXISTS vendor_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doctor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(vendor_id, doctor_user_id)
);

CREATE INDEX idx_vendor_usage_vendor ON vendor_usage (vendor_id);

ALTER TABLE vendor_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vendor usage" ON vendor_usage
  FOR SELECT USING (true);

CREATE POLICY "Doctors can insert their own usage" ON vendor_usage
  FOR INSERT WITH CHECK (auth.uid() = doctor_user_id);

CREATE POLICY "Doctors can delete their own usage" ON vendor_usage
  FOR DELETE USING (auth.uid() = doctor_user_id);
