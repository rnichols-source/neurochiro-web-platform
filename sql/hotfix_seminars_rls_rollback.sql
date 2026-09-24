-- ============================================================
-- ROLLBACK: Revert seminars RLS hotfix
-- Run this if anything breaks after applying hotfix_seminars_rls.sql
-- ============================================================

BEGIN;

-- 1. Drop policies
DROP POLICY IF EXISTS "Anon can read approved seminars" ON public.seminars;
DROP POLICY IF EXISTS "Authenticated can read approved or own seminars" ON public.seminars;

-- 2. Disable RLS
ALTER TABLE public.seminars DISABLE ROW LEVEL SECURITY;

-- 3. Restore default grants (full access for anon and authenticated)
GRANT ALL ON public.seminars TO anon, authenticated;

-- 4. Drop new function
DROP FUNCTION IF EXISTS public.increment_seminar_page_view(uuid);

COMMIT;
