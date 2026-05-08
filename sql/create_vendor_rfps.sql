-- Vendor RFP (Request for Proposal) tables
CREATE TABLE IF NOT EXISTS vendor_rfps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_user_id uuid NOT NULL REFERENCES auth.users(id),
  category text NOT NULL,
  description text NOT NULL,
  budget text, -- e.g., "Under $5K", "$5K-$15K", "$15K-$50K", "$50K+"
  timeline text, -- e.g., "ASAP", "1-3 months", "3-6 months", "Flexible"
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'fulfilled')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_rfp_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfp_id uuid NOT NULL REFERENCES vendor_rfps(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  price text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(rfp_id, vendor_id)
);

CREATE INDEX idx_vendor_rfps_category ON vendor_rfps (category, status, created_at DESC);
CREATE INDEX idx_vendor_rfp_responses_rfp ON vendor_rfp_responses (rfp_id);

ALTER TABLE vendor_rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rfp_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own RFPs" ON vendor_rfps
  FOR SELECT USING (auth.uid() = doctor_user_id);

CREATE POLICY "Doctors can create RFPs" ON vendor_rfps
  FOR INSERT WITH CHECK (auth.uid() = doctor_user_id);

CREATE POLICY "Service role full access to RFPs" ON vendor_rfps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Vendors can view responses to open RFPs" ON vendor_rfp_responses
  FOR SELECT USING (true);

CREATE POLICY "Vendors can respond to RFPs" ON vendor_rfp_responses
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT id FROM vendors WHERE id = vendor_id)
  );

CREATE POLICY "Service role full access to responses" ON vendor_rfp_responses
  FOR ALL USING (auth.role() = 'service_role');
