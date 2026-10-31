-- NOT RUN — Raymond reviews and runs
-- Extends doctor_referrals. Does not replace the table.
-- Code works before this file runs: it looks for viewed_at and falls back to pending/accepted/declined/expired.

-- Statuses. pending is mapped to sent. The check keeps the new set only.
ALTER TABLE doctor_referrals DROP CONSTRAINT IF EXISTS doctor_referrals_status_check;
UPDATE doctor_referrals SET status = 'sent' WHERE status = 'pending';
ALTER TABLE doctor_referrals
  ADD CONSTRAINT doctor_referrals_status_check
  CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'patient_contacted', 'scheduled', 'expired', 'cancelled'));
ALTER TABLE doctor_referrals ALTER COLUMN status SET DEFAULT 'sent';
ALTER TABLE doctor_referrals ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS contacted_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS scheduled_for date;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS thank_you_note text;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS patient_intro_sent_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS receiver_reminder_1_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS receiver_reminder_2_at timestamptz;
ALTER TABLE doctor_referrals ADD COLUMN IF NOT EXISTS referrer_nudge_at timestamptz;

-- Phone and email stay hidden from the receiver until they accept.
CREATE OR REPLACE VIEW doctor_referrals_safe AS
SELECT
  dr.id,
  dr.referring_doctor_id,
  dr.receiving_doctor_id,
  dr.patient_first_name,
  dr.patient_last_initial,
  CASE
    WHEN dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_phone
    WHEN dr.status IN ('accepted', 'patient_contacted', 'scheduled')
      AND dr.receiving_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_phone
    ELSE NULL
  END AS patient_phone,
  CASE
    WHEN dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      THEN dr.patient_email
    WHEN dr.status IN ('accepted', 'patient_contacted', 'scheduled')
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
  dr.reminder_sent_at,
  dr.viewed_at,
  dr.contacted_at,
  dr.scheduled_at,
  dr.scheduled_for,
  dr.cancelled_at,
  dr.thank_you_note,
  dr.patient_intro_sent_at,
  dr.receiver_reminder_1_at,
  dr.receiver_reminder_2_at,
  dr.referrer_nudge_at
FROM doctor_referrals dr
WHERE
  dr.referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  OR dr.receiving_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid());

-- The referrer can cancel their own referral. They cannot rewrite the receiver's status.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctor_referrals' AND policyname = 'referrer_can_cancel'
  ) THEN
    CREATE POLICY referrer_can_cancel ON doctor_referrals
      FOR UPDATE
      USING (
        referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
      )
      WITH CHECK (
        referring_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        AND status = 'cancelled'
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS referral_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES doctor_referrals(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime text,
  size_bytes integer,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE referral_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'referral_attachments' AND policyname = 'referral_attachments_select'
  ) THEN
    CREATE POLICY referral_attachments_select ON referral_attachments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM doctor_referrals dr
          JOIN doctors me ON me.user_id = auth.uid()
          WHERE dr.id = referral_attachments.referral_id
            AND (
              dr.referring_doctor_id = me.id
              OR (
                dr.receiving_doctor_id = me.id
                AND dr.status IN ('accepted', 'patient_contacted', 'scheduled')
              )
            )
        )
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS referral_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES doctor_referrals(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  provider_id text,
  UNIQUE (referral_id, kind)
);
ALTER TABLE referral_emails ENABLE ROW LEVEL SECURITY;
-- No user policy. The server sends mail with the service role and uses the unique key so a kind is sent once.

CREATE TABLE IF NOT EXISTS doctor_favorites (
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  favorite_doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (doctor_id, favorite_doctor_id)
);
ALTER TABLE doctor_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctor_favorites' AND policyname = 'doctor_favorites_owner'
  ) THEN
    CREATE POLICY doctor_favorites_owner ON doctor_favorites
      FOR ALL
      USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
      WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Private bucket. The app mints 10-minute signed URLs after it checks the caller.
-- No anon or authenticated storage policy is added, so objects are not public.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('referral-attachments', 'referral-attachments', false)
  ON CONFLICT (id) DO UPDATE SET public = false;
EXCEPTION WHEN undefined_table OR undefined_column THEN
  RAISE NOTICE 'storage.buckets was not updated. Create a private bucket named referral-attachments.';
END $$;
