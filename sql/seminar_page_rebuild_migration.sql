-- ============================================================
-- Seminar Page Rebuild — Phase 1 Migration
-- Additive only. All columns nullable. Nothing destructive.
-- ============================================================

-- ── Event Branding ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS brand_logo text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS brand_primary_color text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS brand_accent_color text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS hero_overlay_strength integer DEFAULT 50;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS tagline text;

-- ── Promo & Pricing ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS promo_discount_amount numeric;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS promo_discount_type text; -- 'flat' or 'percent'
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS register_url_with_code text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS student_price numeric;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS promo_description text;

-- ── NeuroChiro Endorsement ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS endorsement_text text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS raymond_attending boolean DEFAULT false;

-- ── CE Credits (ce_hours already exists) ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS ce_approving_body text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS ce_states text[];
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS ce_notes text;

-- ── Hosts (multiple host bios, not just instructor_name/bio) ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS hosts jsonb; -- [{name, title, bio, photo_url}]

-- ── Sponsors ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS sponsors jsonb; -- [{name, logo, website_url, tier, schedule_day, schedule_item}]

-- ── Content Blocks ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS whats_included text[]; -- ["Friday lunch", "Poolside Q&A", ...]
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS outcomes text[]; -- ["Walk away with...", ...]
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS refund_policy text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS transfer_policy text;

-- ── Travel & Venue (replace hardcoded travel info) ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS travel_info jsonb;
-- {
--   fly_into: "Fort Lauderdale-Hollywood International Airport (FLL)",
--   stay_at: "The Westin Fort Lauderdale Beach Resort",
--   weather: "Mid-70s and sunny in November",
--   hotel_booking_url: "https://...",
--   hotel_group_rate_cutoff: "2026-10-15",
--   parking: "Valet $45/day, self-park $30/day",
--   notes: "Ask for The Brave Practice group rate"
-- }

-- ── Spotlight / Video (referenced in code but never existed as columns) ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS spotlight_video_url text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS spotlight_quote text;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS spotlight_host_name text;

-- ── Missing columns referenced in code ──
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS max_capacity integer;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS inclusions jsonb; -- ["Session access", "Lunch both days", ...]
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS audiences jsonb; -- [{label, description}]
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS hotel_booking_url text;

-- ── Click Tracking Table ──
CREATE TABLE IF NOT EXISTS public.seminar_clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seminar_id uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
    placement text NOT NULL CHECK (placement IN ('hero', 'sticky', 'details', 'final_cta', 'index_card', 'sidebar', 'code_copy')),
    created_at timestamptz DEFAULT now()
);

-- RLS: anonymous insert only, no public read
ALTER TABLE public.seminar_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert seminar clicks"
    ON public.seminar_clicks
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Only service role can read seminar clicks"
    ON public.seminar_clicks
    FOR SELECT
    TO service_role
    USING (true);

-- Index for fast aggregation
CREATE INDEX IF NOT EXISTS idx_seminar_clicks_seminar_id ON public.seminar_clicks(seminar_id);
CREATE INDEX IF NOT EXISTS idx_seminar_clicks_created_at ON public.seminar_clicks(created_at);
