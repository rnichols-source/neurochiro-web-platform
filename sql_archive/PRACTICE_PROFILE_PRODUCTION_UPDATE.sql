-- 1. Add notification_preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "email_referrals": true,
  "sms_applications": true,
  "system_roi_milestones": true
}'::jsonb;

-- 2. Add verification_status to doctors
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- 3. Ensure doctors table has user_id correctly linked if not already (it usually is)
-- Some implementations use 'id' as the primary key which references profiles.id
-- Based on actions.ts, it uses 'user_id'. Let's check/ensure it exists.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='user_id') THEN
        ALTER TABLE public.doctors ADD COLUMN user_id uuid REFERENCES public.profiles(id);
        -- If id was the link, we might need to populate user_id
        UPDATE public.doctors SET user_id = id WHERE user_id IS NULL;
    END IF;
END $$;

-- 4. Storage Bucket (Note: This usually needs to be done via Supabase Dashboard or API, 
-- but we can add instructions or try to ensure policies are set if the bucket exists)
-- This SQL only handles the DB side. 
-- For policies:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-photos', 'clinic-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-photos');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clinic-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (bucket_id = 'clinic-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'clinic-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
