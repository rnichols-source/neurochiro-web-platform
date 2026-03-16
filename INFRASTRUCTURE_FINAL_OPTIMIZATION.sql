-- FINAL INFRASTRUCTURE & SCALE OPTIMIZATIONS
-- Purpose: Final database indexing and performance tuning for 5,000+ users.

-- 1. DOCTORS TABLE: PROFILE LOOKUP OPTIMIZATION
-- Ensure unique slug lookup is O(1) instead of O(N)
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON public.doctors (slug);

-- 2. DIRECTORY SEARCH OPTIMIZATION
-- Confirm composite index for the directory filters (Region + Verification)
-- This speeds up the 'search_doctors' RPC call significantly.
CREATE INDEX IF NOT EXISTS idx_doctors_verification_region ON public.doctors (verification_status, region_code);

-- 3. SCALE-READY CONNECTION SETTINGS
-- (Documentation Only: Ensure Vercel environment uses Transaction Pooled URL if using direct DB access)
-- Note: Current @supabase/ssr implementation uses PostgREST which is already pooled.

-- 4. CLEANUP: REMOVE ANY REMNANT DEBUG SCRIPTS
-- (Optional: In a real environment, you'd ensure production builds strip console.logs)

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
