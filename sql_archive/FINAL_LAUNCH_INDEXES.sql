-- FINAL LAUNCH PERFORMANCE INDEXES
-- Purpose: Ensure zero-latency dashboard experience for 5,000+ users.

-- 1. LEADS TABLE OPTIMIZATION
-- Speeds up the ROI Verification Queue and dashboard counts
CREATE INDEX IF NOT EXISTS idx_leads_doctor_id ON public.leads (doctor_id);
CREATE INDEX IF NOT EXISTS idx_leads_doctor_confirmed ON public.leads (doctor_id, confirmed_at);

-- 2. ANALYTICS EVENTS OPTIMIZATION
-- Composite index for fast source attribution and conversion rates
CREATE INDEX IF NOT EXISTS idx_analytics_doctor_source ON public.analytics_events (doctor_id, source);

-- 3. DOCTORS TABLE SLUG SEARCH
-- (Reinforcing) Ensure O(1) profile lookups
CREATE INDEX IF NOT EXISTS idx_doctors_slug_lookup ON public.doctors (slug);

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
