-- Screening Command Center — Event Tracking Upgrade
-- Run this in Supabase SQL Editor AFTER the initial tables are created

-- Add new columns to screening_events for the full conversion funnel
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS estimated_attendance integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS booked_paid integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS showed_for_visit integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS signed_care integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS referrals_from_event integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS investment integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS network_contacts_met integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS new_events_discovered integer DEFAULT 0;
ALTER TABLE screening_events ADD COLUMN IF NOT EXISTS patients_data jsonb DEFAULT '[]'::jsonb;

-- Rename signed_up to keep backward compat (it's the same as booked_paid conceptually)
-- Don't drop signed_up — keep it for backward compatibility, just use booked_paid going forward
