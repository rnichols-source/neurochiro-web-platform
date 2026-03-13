-- FIX STUDENT REGISTRATION AND AUTOMATIONS

-- 1. Audit and Update Profiles Table
DO $$ 
BEGIN 
    -- Add chiropracticSchool if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='chiropracticSchool') THEN
        ALTER TABLE public.profiles ADD COLUMN "chiropracticSchool" text;
    END IF;

    -- Add gradYear if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gradYear') THEN
        ALTER TABLE public.profiles ADD COLUMN "gradYear" text;
    END IF;

    -- Add country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='country') THEN
        ALTER TABLE public.profiles ADD COLUMN "country" text;
    END IF;

    -- Add city if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
        ALTER TABLE public.profiles ADD COLUMN "city" text;
    END IF;
END $$;

-- 2. Update Automation Queue to support scheduling
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='automation_queue' AND column_name='scheduled_at') THEN
        ALTER TABLE public.automation_queue ADD COLUMN "scheduled_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 3. Refresh schema cache (Supabase specific, though not directly executable via SQL here, 
-- it informs the system that schema has changed).
NOTIFY pgrst, 'reload schema';
