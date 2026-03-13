-- Migration for Dashboard Live Data Integration

-- 1. Enhance Doctors Table for Analytics
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS patient_leads integer DEFAULT 0;

-- 2. Link Leads to Doctors
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create Contracts Table for Student Lab
CREATE TABLE IF NOT EXISTS public.contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'reviewed', 'signed'
    file_url text,
    analysis_results jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on Contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts" 
    ON public.contracts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts" 
    ON public.contracts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. RPC for incrementing doctor views
CREATE OR REPLACE FUNCTION public.increment_doctor_views(doctor_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.doctors SET profile_views = profile_views + 1 WHERE slug = doctor_slug;
END;
$$;

-- 5. Refresh schema
NOTIFY pgrst, 'reload schema';
