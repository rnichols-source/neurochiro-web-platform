-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'doctor'::text,
  full_name text,
  subscription_status text DEFAULT 'free'::text,
  billing_plan_type text DEFAULT 'monthly'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  clinic_name text,
  slug text UNIQUE NOT NULL,
  city text,
  state text,
  country text DEFAULT 'United States'::text,
  address text,
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  website_url text,
  instagram_url text,
  facebook_url text,
  bio text,
  specialties text[],
  verification_status text DEFAULT 'pending'::text, -- pending, verified, hidden
  membership_tier text DEFAULT 'starter'::text,
  is_hiring boolean DEFAULT false,
  is_mentoring boolean DEFAULT true,
  region_code text DEFAULT 'US'::text,
  photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Automation Queue
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending'::text,
  retry_count integer DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Doctors are viewable by everyone" ON public.doctors FOR SELECT USING (true);
