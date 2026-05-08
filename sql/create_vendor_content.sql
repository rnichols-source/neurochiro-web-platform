-- Vendor Content table (articles/posts from Growth & Partner vendors)
CREATE TABLE IF NOT EXISTS vendor_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz DEFAULT now() NOT NULL,
  is_published boolean DEFAULT true
);

CREATE INDEX idx_vendor_content_vendor ON vendor_content (vendor_id, published_at DESC);

ALTER TABLE vendor_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published content" ON vendor_content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Vendors can manage their own content" ON vendor_content
  FOR ALL USING (
    auth.uid() = (SELECT id FROM vendors WHERE id = vendor_id)
  );
