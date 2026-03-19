-- Migration: Final Index Alignment
-- Rebuilds the GIN index to include 'address' so ZIP codes are instantly searchable.

DROP INDEX IF EXISTS idx_doctors_search_trgm;

CREATE INDEX idx_doctors_search_trgm ON public.doctors 
USING gin (
  (
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(clinic_name, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(state, '') || ' ' || 
    COALESCE(address, '')
  ) gin_trgm_ops
);

-- Ensure pg_trgm extension is active
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Refresh schema cache
ANALYZE public.doctors;
