-- Screening Command Center Tables
-- Run this in Supabase SQL Editor

-- 1. Screening Events
CREATE TABLE IF NOT EXISTS screening_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date,
  venue text,
  type text DEFAULT 'other',
  status text DEFAULT 'planned',
  screened integer DEFAULT 0,
  signed_up integer DEFAULT 0,
  showed integer DEFAULT 0,
  revenue integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Screening Contacts (Network)
CREATE TABLE IF NOT EXISTS screening_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  business text,
  phone text,
  email text,
  type text DEFAULT 'other',
  status text DEFAULT 'new',
  follow_up_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Screening Vendors
CREATE TABLE IF NOT EXISTS screening_vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text NOT NULL,
  contact text,
  phone text,
  email text,
  service text,
  referrals_sent integer DEFAULT 0,
  referrals_received integer DEFAULT 0,
  status text DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Screening Outreach
CREATE TABLE IF NOT EXISTS screening_outreach (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'other',
  date date,
  status text DEFAULT 'to-contact',
  contact_info text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies (users can only see/edit their own data)
ALTER TABLE screening_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own events" ON screening_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own contacts" ON screening_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own vendors" ON screening_vendors
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own outreach" ON screening_outreach
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_screening_events_user ON screening_events(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_contacts_user ON screening_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_vendors_user ON screening_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_outreach_user ON screening_outreach(user_id);
