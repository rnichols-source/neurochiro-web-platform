-- Migration: Create search_doctors RPC for high-performance directory searching
-- Handles: Text search (ILIKE), Region filtering, and Bounding Box (Map) filtering

CREATE OR REPLACE FUNCTION public.search_doctors(
  p_search_query text DEFAULT NULL,
  p_region_code text DEFAULT NULL,
  p_min_lng float DEFAULT NULL,
  p_min_lat float DEFAULT NULL,
  p_max_lng float DEFAULT NULL,
  p_max_lat float DEFAULT NULL,
  p_page int DEFAULT 1,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  clinic_name text,
  specialties text[],
  slug text,
  bio text,
  rating numeric,
  review_count int,
  latitude float,
  longitude float,
  membership_tier text,
  verification_status text,
  total_count bigint
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset int := (p_page - 1) * p_limit;
BEGIN
  RETURN QUERY
  WITH filtered_doctors AS (
    SELECT 
      d.id, d.first_name, d.last_name, d.clinic_name, d.specialties, d.slug, d.bio, 
      d.rating, d.review_count, d.latitude, d.longitude, d.membership_tier, d.verification_status
    FROM public.doctors d
    WHERE d.verification_status = 'verified'
      AND (p_region_code IS NULL OR d.region_code = p_region_code OR p_region_code = 'US') -- Fallback to show all if US selected or null
      AND (
        p_search_query IS NULL OR 
        d.first_name ILIKE '%' || p_search_query || '%' OR 
        d.last_name ILIKE '%' || p_search_query || '%' OR 
        d.clinic_name ILIKE '%' || p_search_query || '%'
      )
      AND (
        p_min_lng IS NULL OR (
          d.longitude >= p_min_lng AND 
          d.latitude >= p_min_lat AND 
          d.longitude <= p_max_lng AND 
          d.latitude <= p_max_lat
        )
      )
  ),
  total_count_cte AS (
    SELECT count(*) as total FROM filtered_doctors
  )
  SELECT 
    fd.*,
    tc.total as total_count
  FROM filtered_doctors fd, total_count_cte tc
  ORDER BY 
    CASE fd.membership_tier 
      WHEN 'pro' THEN 1 
      WHEN 'growth' THEN 2 
      WHEN 'starter' THEN 3 
      ELSE 4 
    END ASC,
    fd.id ASC
  LIMIT p_limit
  OFFSET v_offset;
END;
$$;
