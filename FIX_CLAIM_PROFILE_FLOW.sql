-- 1. Ensure doctors table has email column for linking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='email') THEN
        ALTER TABLE public.doctors ADD COLUMN "email" text;
    END IF;
END $$;

-- 2. Update the handle_new_user function to properly link profiles by email
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
  existing_doctor_id uuid;
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
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, user_role)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  -- 2. Role-specific provisioning logic
  IF user_role = 'doctor' THEN
    -- SMART CLAIM LOGIC:
    -- Check if a doctor already exists with this email but no user_id
    SELECT id INTO existing_doctor_id 
    FROM public.doctors 
    WHERE email = NEW.email AND user_id IS NULL 
    LIMIT 1;

    IF existing_doctor_id IS NOT NULL THEN
      -- CLAIM: Link the existing row to the new user
      UPDATE public.doctors 
      SET user_id = NEW.id,
          verification_status = 'verified', -- Auto-verify on claim if they were already in the directory
          updated_at = now()
      WHERE id = existing_doctor_id;
    ELSE
      -- PROVISION: Create a new row if no existing profile found
      INSERT INTO public.doctors (
        user_id, 
        verification_status, 
        email, 
        first_name, 
        last_name, 
        slug,
        clinic_name,
        membership_tier
      )
      VALUES (
        NEW.id, 
        'pending', 
        NEW.email, 
        COALESCE(split_part(user_full_name, ' ', 1), 'Doctor'), 
        COALESCE(split_part(user_full_name, ' ', 2), 'Member'),
        lower(replace(user_full_name, ' ', '-')) || '-' || substr(NEW.id::text, 1, 8),
        'Private Practice',
        COALESCE(user_tier, 'starter')
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
  ELSIF user_role = 'student' THEN
    INSERT INTO public.students (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_role = 'vendor' THEN
    BEGIN
      INSERT INTO public.vendors (id, name) VALUES (NEW.id, COALESCE(user_full_name, 'New Vendor')) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
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
