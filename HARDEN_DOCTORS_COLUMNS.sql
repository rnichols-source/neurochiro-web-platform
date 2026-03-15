-- Security Hardening: Column-Level Security for Doctors Table
-- Strictly limits the columns accessible to the 'anon' (public) role.

-- 1. Revoke default select access for public/anon
REVOKE SELECT ON TABLE public.doctors FROM anon;
REVOKE SELECT ON TABLE public.doctors FROM authenticated;

-- 2. Grant SELECT only on "Essential" public directory columns
-- This ensures private_email, internal_notes, or raw user_ids are never exposed to the API.
GRANT SELECT (
  id, 
  slug, 
  first_name, 
  last_name, 
  clinic_name, 
  bio, 
  specialties, 
  city, 
  state, 
  country, 
  region_code,
  latitude, 
  longitude, 
  rating, 
  review_count, 
  photo_url,
  membership_tier,
  verification_status,
  is_hiring,
  is_mentoring,
  website_url,
  instagram_url,
  facebook_url
) ON public.doctors TO anon;

-- 3. Authenticated users (logged in doctors/students) get the same public columns
-- (They can still access their own private data via the RLS 'Doctors can see their own record' policy)
GRANT SELECT (
  id, 
  slug, 
  first_name, 
  last_name, 
  clinic_name, 
  bio, 
  specialties, 
  city, 
  state, 
  country, 
  region_code,
  latitude, 
  longitude, 
  rating, 
  review_count, 
  photo_url,
  membership_tier,
  verification_status,
  is_hiring,
  is_mentoring,
  website_url,
  instagram_url,
  facebook_url
) ON public.doctors TO authenticated;

-- 4. Ensure RLS still applies (GRANTs and RLS are additive)
-- The existing RLS policy "Public can only see verified doctors" will still filter the ROWS.
-- These GRANTs will filter the COLUMNS.

-- 5. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
