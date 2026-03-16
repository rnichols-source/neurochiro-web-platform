-- ROI ANALYTICS ENHANCEMENT SCHEMA
-- Purpose: Support high-precision ROI tracking and patient verification.

-- 1. ENHANCE LEADS TABLE
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
-- Ensure status enum/text supports 'confirmed'
-- (Existing status is 'new', 'contacted', 'converted', 'closed'. We'll use 'converted' as 'confirmed')

-- 2. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    doctor_id uuid REFERENCES public.profiles(id) NOT NULL,
    event_type text NOT NULL, -- 'profile_view', 'contact_click', 'phone_tap', 'booking_click'
    source text DEFAULT 'directory', -- 'direct', 'directory', 'referral', 'seminar'
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for fast aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_doctor_type ON public.analytics_events(doctor_id, event_type);

-- 3. RLS POLICIES
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own analytics" 
    ON public.analytics_events FOR SELECT 
    USING (auth.uid() = doctor_id);

-- 4. REFRESH PostgREST
NOTIFY pgrst, 'reload schema';
