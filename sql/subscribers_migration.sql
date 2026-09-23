-- NeuroChiro Patient Email List — Schema
-- Run this in Supabase SQL Editor

-- 1. Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  zip TEXT NOT NULL CHECK (zip ~ '^\d{5}$'),
  state TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token_hash TEXT,
  token_expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website',
  ip TEXT,
  user_agent TEXT,
  resend_contact_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on lowercased email
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique ON subscribers (LOWER(email));

-- Index for token lookup during confirmation
CREATE INDEX IF NOT EXISTS subscribers_token_hash_idx ON subscribers (token_hash) WHERE token_hash IS NOT NULL;

-- Index for sequence job queries
CREATE INDEX IF NOT EXISTS subscribers_status_confirmed_idx ON subscribers (status, confirmed_at) WHERE status = 'confirmed';

-- Index for geographic queries (state + zip prefix)
CREATE INDEX IF NOT EXISTS subscribers_state_zip_idx ON subscribers (state, zip);

-- 2. Sequence state table (welcome drip)
CREATE TABLE IF NOT EXISTS sequence_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, step)
);

-- 3. Auto-update updated_at on subscribers
CREATE OR REPLACE FUNCTION update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscribers_updated_at ON subscribers;
CREATE TRIGGER subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscribers_updated_at();

-- 4. RLS policies
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_state ENABLE ROW LEVEL SECURITY;

-- Service role only — no direct client access
CREATE POLICY "Service role full access on subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on sequence_state"
  ON sequence_state FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
