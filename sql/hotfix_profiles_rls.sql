-- ============================================================
-- HOTFIX: Enable RLS on profiles table
--
-- CURRENT STATE (2026-09-11):
--   RLS OFF. No policies. 2 admin profiles (both Dr. Ray).
--   Anyone with the anon key can:
--     - Set role='admin' or tier='admin' on any profile
--     - Pass every checkAdminAuth() gate
--     - Read all user emails, stripe_customer_ids, and PII
--
-- AFTER THIS:
--   RLS ON.
--   Users can read their own profile (all columns).
--   Users can update their own profile (safe columns only).
--   Public can read limited profile info for display.
--   role, tier, stripe_customer_id only writable by service role.
-- ============================================================

BEGIN;

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Users can read their own profile (all columns)
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 3. Public read: limited columns for display (e.g. speaker lookup, host name)
--    Row access: all profiles readable for name/role lookups
--    Column access: restricted via column-level grants below
CREATE POLICY "Anon can read public profile fields"
    ON public.profiles
    FOR SELECT
    TO anon
    USING (true);

-- 4. Users can update their own profile (column restrictions via grants below)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Column-level grants
--    Revoke all first, then grant specific columns per role

-- Anon: read-only, limited columns (for display purposes like seminar host name)
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT (id, full_name, role, avatar_url, created_at) ON public.profiles TO anon;

-- Authenticated: read own profile (all columns via RLS), update safe columns only
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT (
    id, full_name, email, role, tier, avatar_url, stripe_customer_id,
    practice_name, practice_city, practice_state, practice_type,
    chiropractic_school, current_year_in_school, graduation_year,
    areas_of_interest, website, years_in_practice, user_type,
    mastery_score, is_first_login, onboarding_completed_at,
    last_sign_in_at, created_at, updated_at
) ON public.profiles TO authenticated;

-- Authenticated can UPDATE safe columns only
-- NOT updatable: role, tier, stripe_customer_id, mastery_score, id, created_at
GRANT UPDATE (
    full_name, avatar_url,
    practice_name, practice_city, practice_state, practice_type,
    chiropractic_school, current_year_in_school, graduation_year,
    areas_of_interest, website, years_in_practice, user_type,
    is_first_login, onboarding_completed_at, last_sign_in_at,
    updated_at
) ON public.profiles TO authenticated;

-- No INSERT for anon or authenticated (profiles created by auth trigger or service role)
-- No DELETE for anon or authenticated

COMMIT;
