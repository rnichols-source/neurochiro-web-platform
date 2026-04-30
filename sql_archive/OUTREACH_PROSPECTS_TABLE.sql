-- NeuroChiro Outreach Prospects Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS outreach_prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instagram_handle TEXT,
  email TEXT,
  website TEXT,
  phone TEXT,
  clinic_name TEXT,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'followed_up', 'responded', 'interested', 'signed_up', 'not_interested')),
  notes TEXT,
  script_used TEXT,
  source TEXT DEFAULT 'manual',
  contacted_at TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,
  follow_up_count INT DEFAULT 0,
  responded_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_outreach_state ON outreach_prospects(state);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_prospects(status);
CREATE INDEX IF NOT EXISTS idx_outreach_follow_up ON outreach_prospects(follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_created ON outreach_prospects(created_at DESC);

-- Enable RLS (admin-only access via service role key)
ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed — we access via admin client (service role) which bypasses RLS
