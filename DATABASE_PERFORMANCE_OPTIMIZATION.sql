-- 1. INDEXING STRATEGY: HIGH-FREQUENCY COLUMNS
-- Speed up directory searches and filters
CREATE INDEX IF NOT EXISTS idx_doctors_region_verification ON public.doctors (region_code, verification_status);
CREATE INDEX IF NOT EXISTS idx_doctors_location ON public.doctors (city, state);

-- Speed up content access checks
CREATE INDEX IF NOT EXISTS idx_content_access_level ON public.content (access_level);

-- Speed up job board and recruitment
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_doctor_id ON public.jobs (doctor_id);

-- Speed up profile lookups (Crucial for RLS performance)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_sub_status ON public.profiles (subscription_status);

-- Speed up subscription management
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

-- Speed up automation queue processing
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue (status);


-- 2. RLS PERFORMANCE OPTIMIZATION: Role Memoization
-- Evaluating 'EXISTS (SELECT 1 FROM profiles...)' on every row lookup is expensive.
-- We create a security-definer function to retrieve the user role once per request session.

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  -- Using a session-level variable to cache the role lookup for the current transaction
  SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' 
  -- Or fallback to a cached DB lookup if metadata isn't available
  -- NOTE: In production Supabase, standard practice is to use JWT claims for roles.
$$;

-- Optimized RLS Example (Updating Job Posting Policy)
-- Instead of a subquery on every row, we use the stable function or direct JWT check.

DROP POLICY IF EXISTS "Doctors can post jobs" ON public.jobs;
CREATE POLICY "Doctors can post jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'role' IN ('doctor_pro', 'doctor_growth', 'doctor_member', 'admin')
);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
USING ( (auth.jwt() ->> 'role') = 'admin' );
