-- Phase 3 Database Tables
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Referrals table (doctor-to-doctor patient referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  patient_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can see their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = recipient_id);

CREATE POLICY "Doctors can send referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Recipients can acknowledge referrals" ON public.referrals
  FOR UPDATE USING (auth.uid() = recipient_id);

-- 2. Patient stories table (transformation stories for doctor profiles)
CREATE TABLE IF NOT EXISTS public.patient_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_first_name TEXT NOT NULL,
  condition_before TEXT NOT NULL,
  outcome_after TEXT NOT NULL,
  story_text TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a story" ON public.patient_stories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read approved stories" ON public.patient_stories
  FOR SELECT USING (approved = true);

CREATE POLICY "Admins can manage stories" ON public.patient_stories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder', 'super_admin'))
  );

-- 3. Courses table (student academy)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modules JSONB NOT NULL DEFAULT '[]',
  tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read courses" ON public.courses
  FOR SELECT USING (true);

-- 4. Course progress table (tracks student completion)
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  completed_modules JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress" ON public.course_progress
  FOR ALL USING (auth.uid() = user_id);

-- 5. Daily logs table enhancement (patient health tracking)
-- If daily_logs already exists, this adds missing columns
DO $$ BEGIN
  ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS energy_level INTEGER;
  ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS pain_level INTEGER;
  ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS sleep_quality INTEGER;
  ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS log_date DATE DEFAULT CURRENT_DATE;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE public.daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    notes TEXT,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);
END $$;
