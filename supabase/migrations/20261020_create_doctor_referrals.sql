-- Create doctor_referrals table
CREATE TABLE IF NOT EXISTS doctor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  receiving_doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_first_name text NOT NULL,
  patient_last_initial text NOT NULL,
  patient_phone text,
  patient_email text,
  patient_city text,
  patient_zip text,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent')),
  consent_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  notified_at timestamptz,
  reminder_sent_at timestamptz
);

-- Indexes
CREATE INDEX idx_doctor_referrals_receiving_status ON doctor_referrals(receiving_doctor_id, status);
CREATE INDEX idx_doctor_referrals_referring ON doctor_referrals(referring_doctor_id);
CREATE INDEX idx_doctor_referrals_expires ON doctor_referrals(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE doctor_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: doctors can see referrals where they are the referrer
-- (referrer always sees full data including patient contact info)
CREATE POLICY "referrer_can_read_own"
  ON doctor_referrals FOR SELECT
  USING (
    referring_doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: doctors can see referrals where they are the recipient
-- BUT patient_phone and patient_email are handled by the view below
CREATE POLICY "recipient_can_read_own"
  ON doctor_referrals FOR SELECT
  USING (
    receiving_doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: doctors can insert referrals where they are the referrer
CREATE POLICY "referrer_can_insert"
  ON doctor_referrals FOR INSERT
  WITH CHECK (
    referring_doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND consent_confirmed = true
  );

-- RLS Policy: recipient can update status (accept/decline)
CREATE POLICY "recipient_can_update_status"
  ON doctor_referrals FOR UPDATE
  USING (
    receiving_doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    receiving_doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- View that conditionally nulls patient contact info for recipients
-- Recipients only see phone/email when status = 'accepted'
CREATE OR REPLACE VIEW doctor_referrals_safe AS
SELECT
  dr.id,
  dr.referring_doctor_id,
  dr.receiving_doctor_id,
  dr.patient_first_name,
  dr.patient_last_initial,
  -- PHI gating: recipient only sees contact info after acceptance
  CASE
    WHEN dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_phone
    WHEN dr.status = 'accepted'
      AND dr.receiving_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_phone
    ELSE NULL
  END AS patient_phone,
  CASE
    WHEN dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_email
    WHEN dr.status = 'accepted'
      AND dr.receiving_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_email
    ELSE NULL
  END AS patient_email,
  dr.patient_city,
  dr.patient_zip,
  dr.reason,
  dr.urgency,
  dr.consent_confirmed,
  dr.status,
  dr.decline_reason,
  dr.created_at,
  dr.responded_at,
  dr.expires_at,
  dr.notified_at,
  dr.reminder_sent_at
FROM doctor_referrals dr
WHERE
  dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  OR dr.receiving_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid());
