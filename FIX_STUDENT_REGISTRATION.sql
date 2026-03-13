-- FIX STUDENT REGISTRATION AND AUTOMATIONS (ROBUST VERSION)

-- 1. Profiles Table (Cleanup and Safety)
-- We ensure the core profiles table only has the columns it was designed for
-- If you added chiropracticSchool or gradYear to profiles by mistake, they can stay, 
-- but our code will now ignore them to prevent schema cache errors.

-- 2. Ensure Students Table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school text,
    graduation_year integer,
    location_city text,
    interests text[],
    is_looking_for_mentorship boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure columns exist in case table was already there
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='location_city') THEN
        ALTER TABLE public.students ADD COLUMN "location_city" text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='graduation_year') THEN
        ALTER TABLE public.students ADD COLUMN "graduation_year" integer;
    END IF;
END $$;

-- 3. Update Automation Queue to support scheduling
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='automation_queue' AND column_name='scheduled_at') THEN
        ALTER TABLE public.automation_queue ADD COLUMN "scheduled_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';
