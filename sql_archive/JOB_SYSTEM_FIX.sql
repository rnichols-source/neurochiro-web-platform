-- ============================================================
-- JOB POSTING SYSTEM FIX
-- Run this in Supabase SQL Editor to fix all missing columns/tables
-- ============================================================

-- 1. Add missing columns to job_postings table
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS apply_method text DEFAULT 'neurochiro';
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS apply_url text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS apply_email text;

-- Allow NULL doctor_id for guest-posted paid listings
ALTER TABLE public.job_postings ALTER COLUMN doctor_id DROP NOT NULL;

-- 2. Add missing columns to applications table (ATS pipeline)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS doctor_notes text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS stage_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS phone text;

-- 3. Create job_applications table (for guest/public applications)
CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id uuid,
    applicant_name text NOT NULL,
    applicant_email text NOT NULL,
    applicant_phone text,
    message text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(job_id, applicant_email)
);

-- 4. Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public application form)
CREATE POLICY "Anyone can submit a job application"
    ON public.job_applications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Doctors can read applications for their own jobs
CREATE POLICY "Doctors can view applications for their jobs"
    ON public.job_applications
    FOR SELECT
    TO authenticated
    USING (
        job_id IN (
            SELECT id FROM public.job_postings
            WHERE doctor_id::text = auth.uid()::text
        )
        OR applicant_id::text = auth.uid()::text
    );

-- 5. Allow public read access to active job_postings
-- (may already exist, using IF NOT EXISTS via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'job_postings' AND policyname = 'Public can view active jobs'
    ) THEN
        CREATE POLICY "Public can view active jobs"
            ON public.job_postings
            FOR SELECT
            TO anon, authenticated
            USING (status IN ('Active', 'open'));
    END IF;
END
$$;

-- 6. Allow authenticated users to insert job_postings (for paid listings via webhook)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'job_postings' AND policyname = 'Service role can insert job postings'
    ) THEN
        CREATE POLICY "Service role can insert job postings"
            ON public.job_postings
            FOR INSERT
            TO authenticated
            WITH CHECK (doctor_id::text = auth.uid()::text);
    END IF;
END
$$;

-- Done! Verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'job_postings' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'applications' ORDER BY ordinal_position;
-- SELECT * FROM information_schema.tables WHERE table_name = 'job_applications';
