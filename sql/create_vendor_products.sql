-- Vendor Featured Products
CREATE TABLE IF NOT EXISTS vendor_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price text,
  image_url text,
  link_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_vendor_products_vendor ON vendor_products (vendor_id, sort_order);

ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vendor products" ON vendor_products
  FOR SELECT USING (true);

CREATE POLICY "Service role manages products" ON vendor_products
  FOR ALL USING (auth.role() = 'service_role');
