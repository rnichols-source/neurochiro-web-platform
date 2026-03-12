-- Seminar Marketplace Schema Upgrade

-- 1. Add marketplace columns to the seminars table
ALTER TABLE public.seminars 
ADD COLUMN IF NOT EXISTS listing_tier text DEFAULT 'basic', -- 'basic', 'featured', 'premium'
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending', -- 'pending', 'paid', 'exempt'
ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT '{"Doctors", "Students"}',
ADD COLUMN IF NOT EXISTS page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS latitude decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS longitude decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS featured_image_url text,
ADD COLUMN IF NOT EXISTS host_type_at_submission text;

-- 2. Create Host Profiles table
CREATE TABLE IF NOT EXISTS public.host_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name text,
    host_bio text,
    website_url text,
    logo_url text,
    instagram_url text,
    linkedin_url text,
    twitter_url text,
    host_type text DEFAULT 'external', -- 'doctor', 'external', 'organization'
    is_verified boolean DEFAULT false,
    rating decimal DEFAULT 5.0,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view host profiles') THEN
        CREATE POLICY "Anyone can view host profiles" ON public.host_profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hosts can update their own profile') THEN
        CREATE POLICY "Hosts can update their own profile" ON public.host_profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. RPC for atomic analytics tracking (Views & Clicks)
CREATE OR REPLACE FUNCTION public.increment_seminar_stats(seminar_id uuid, stat_column text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow specific columns to be incremented for security
    IF stat_column IN ('page_views', 'clicks') THEN
        EXECUTE format('UPDATE public.seminars SET %I = %I + 1 WHERE id = %L', stat_column, stat_column, seminar_id);
    END IF;
END;
$$;

-- 5. Search Indexes
CREATE INDEX IF NOT EXISTS idx_seminars_is_approved ON public.seminars(is_approved);
CREATE INDEX IF NOT EXISTS idx_seminars_listing_tier ON public.seminars(listing_tier);
