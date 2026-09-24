-- ============================================================
-- HOTFIX: Seminars RLS + Column Grants
--
-- VERIFIED (2026-09-11):
--   RLS OFF, no policies, no increment RPC, all 9 rows clean.
--   No subscription check on seminar creation (fixed in code).
--
-- AFTER THIS:
--   RLS ON. Row-level: anon sees approved only, auth sees
--   approved + own. Column-level: sensitive columns revoked
--   from anon/authenticated. No client INSERT/UPDATE/DELETE.
--   All writes via service-role server actions.
-- ============================================================

BEGIN;

-- 1. Enable RLS
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

-- 2. SELECT-only policies (no INSERT/UPDATE/DELETE for anon or authenticated)
CREATE POLICY "Anon can read approved seminars"
    ON public.seminars
    FOR SELECT
    TO anon
    USING (is_approved = true);

CREATE POLICY "Authenticated can read approved or own seminars"
    ON public.seminars
    FOR SELECT
    TO authenticated
    USING (is_approved = true OR auth.uid() = host_id);

-- 3. Column-level grants: revoke all, grant only public columns
REVOKE ALL ON public.seminars FROM anon, authenticated;

GRANT SELECT (
    id, host_id, title, description, dates, location, city, country,
    venue_name, venue_address, start_time, end_time, event_type,
    instructor_name, instructor_bio, registration_link, price, ce_hours,
    categories, tags, target_audience, image_url, hero_image_url,
    gallery_images, schedule, speakers, faq, listing_tier,
    is_past, is_approved, page_views, clicks, created_at, updated_at
) ON public.seminars TO anon, authenticated;

-- HIDDEN from anon/authenticated:
--   admin_notes, payment_status, host_type_at_submission,
--   featured_image_url (dead), venue (dead)

-- 4. Page view increment function
--    Renamed. Single-purpose. No stat_column parameter.
--    SECURITY DEFINER with locked search_path.
CREATE OR REPLACE FUNCTION public.increment_seminar_page_view(p_seminar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.seminars
    SET page_views = COALESCE(page_views, 0) + 1
    WHERE id = p_seminar_id
      AND is_approved = true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_seminar_page_view(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_seminar_page_view(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_seminar_page_view(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_seminar_page_view(uuid) TO service_role;

-- Drop the old function signature if it somehow exists
DROP FUNCTION IF EXISTS public.increment_seminar_stats(uuid, text);

COMMIT;
