-- Seminar Marketplace Schema Upgrade

-- 1. Add marketplace columns to the seminars table
ALTER TABLE public.seminars 
ADD COLUMN IF NOT EXISTS listing_tier text DEFAULT 'basic', -- 'basic', 'featured', 'premium'
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending', -- 'pending', 'paid', 'exempt'
ADD COLUMN IF NOT EXISTS target_audience text[], -- e.g., ['Students', 'New Graduates', 'Practising Doctors']
ADD COLUMN IF NOT EXISTS page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0;

-- 2. Add RPC for atomic analytics tracking (Views & Clicks)
CREATE OR REPLACE FUNCTION public.increment_seminar_stats(seminar_id uuid, stat_column text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow specific columns to be incremented for security
    IF stat_column IN ('page_views', 'clicks') THEN
        EXECUTE format('UPDATE public.seminars SET %I = %I + 1 WHERE id = %L', stat_column, stat_column, seminar_id);
    END IF;
END;
$$;
