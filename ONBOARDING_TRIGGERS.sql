-- Core Onboarding Automation Triggers for NeuroChiro

-- 1. Create automation queue if it doesn't exist (from the constraints file)
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  retry_count integer DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on automation queue
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access to the queue
CREATE POLICY "Service Role can manage automation queue" 
  ON public.automation_queue
  USING (true)
  WITH CHECK (true);

-- 2. Function to handle new user signups and automatically route them to correct tables
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text;
  user_tier text;
  user_full_name text;
  user_phone text;
BEGIN
  -- Extract metadata provided during signup
  user_role := NEW.raw_user_meta_data->>'role';
  user_tier := NEW.raw_user_meta_data->>'tier';
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_phone := NEW.raw_user_meta_data->>'phone';

  -- Default to 'patient' if no role provided
  IF user_role IS NULL THEN
    user_role := 'patient';
  END IF;

  -- 1. Upsert into public.profiles
  -- We cast user_role to user_role enum if applicable, else text. We assume role is a text or enum in profiles.
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (NEW.id, NEW.email, user_full_name, user_role::public.user_role, user_phone)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  -- 2. Role-specific provisioning logic
  IF user_role = 'doctor' THEN
    -- Provision doctor profile (hidden/pending by default)
    INSERT INTO public.doctors (user_id, verification_status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT (user_id) DO NOTHING;
    
  ELSIF user_role = 'student' THEN
    -- Provision student profile for talent pool access
    INSERT INTO public.students (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_role = 'vendor' THEN
    -- Provision vendor profile (assuming vendors table exists, or fail gracefully)
    BEGIN
      INSERT INTO public.vendors (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN undefined_table THEN
      -- Ignore if vendors table doesn't exist yet
    END;
  END IF;

  -- 3. Queue the automated welcome flow
  INSERT INTO public.automation_queue (event_type, payload)
  VALUES (
    'welcome_email',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', user_full_name,
      'role', user_role
    )
  );

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to Auth Users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Set up webhook idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id text PRIMARY KEY, -- Event ID from Stripe
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
