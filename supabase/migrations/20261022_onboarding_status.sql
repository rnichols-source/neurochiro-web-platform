-- Onboarding status tracking for the member email sequence.
-- Tracks each doctor's progress through the onboarding pipeline.

-- Add onboarding columns to doctors table
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS agreement_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_call_booked_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_call_done_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_built_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_onboarding_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_onboarding_email_type text;

-- Validate onboarding_status values
ALTER TABLE doctors
  DROP CONSTRAINT IF EXISTS doctors_onboarding_status_check;

ALTER TABLE doctors
  ADD CONSTRAINT doctors_onboarding_status_check
  CHECK (onboarding_status IN (
    'not_started',
    'paid',
    'profile_live',
    'call_booked',
    'call_done',
    'complete'
  ));

-- Index for admin queries (filter by non-complete status)
CREATE INDEX IF NOT EXISTS idx_doctors_onboarding_status
  ON doctors (onboarding_status)
  WHERE onboarding_status != 'complete';

-- Set existing paid/verified doctors to 'complete' so they don't pollute the onboarding queue
UPDATE doctors
  SET onboarding_status = 'complete',
      onboarding_completed_at = NOW()
  WHERE membership_tier = 'pro'
    AND onboarding_call_status = 'completed'
    AND onboarding_status = 'not_started';
