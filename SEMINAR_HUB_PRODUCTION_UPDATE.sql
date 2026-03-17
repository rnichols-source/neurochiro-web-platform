-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Update seminars table
ALTER TABLE public.seminars 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS location_name text,
ADD COLUMN IF NOT EXISTS coordinates geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz,
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('draft', 'published', 'completed')) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS max_capacity integer;

-- Migrating existing data if necessary (mapping date to start_date)
UPDATE public.seminars SET start_date = date WHERE start_date IS NULL AND date IS NOT EXISTS;
-- (In some cases 'date' might be used differently, but let's assume it's the start date)

-- Ensure host_id references public.profiles
-- The existing table might already have this, but let's be sure.
-- If we need to change references, we might need to drop and recreate the constraint.

-- 2. Create seminar_registrations table
CREATE TABLE IF NOT EXISTS public.seminar_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seminar_id uuid REFERENCES public.seminars(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_status text DEFAULT 'pending',
    amount_paid decimal DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(seminar_id, profile_id)
);

-- 3. RLS for seminar_registrations
ALTER TABLE public.seminar_registrations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view their own registrations') THEN
        CREATE POLICY "Anyone can view their own registrations" ON public.seminar_registrations 
        FOR SELECT USING (auth.uid() = profile_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hosts can view registrations for their seminars') THEN
        CREATE POLICY "Hosts can view registrations for their seminars" ON public.seminar_registrations 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.seminars 
                WHERE seminars.id = seminar_registrations.seminar_id 
                AND seminars.host_id = auth.uid()
            )
        );
    END IF;
END $$;
