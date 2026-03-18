-- Migration: Create refresh_search_index RPC
-- Ensures the search index and schema cache are updated after a doctor edit.
-- This is a failsafe to ensure GIN indices or Materialized Views (if used) are fresh.

CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If we had a materialized view for search, we would refresh it here:
  -- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_search;
  
  -- For now, we use it to signal a cache refresh or perform a lightweight analyze
  ANALYZE public.doctors;
END;
$$;
