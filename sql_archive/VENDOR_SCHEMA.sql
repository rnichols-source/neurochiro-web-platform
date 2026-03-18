-- Vendor Marketplace Schema

CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Basic Info
    slug text UNIQUE,
    name text NOT NULL,
    logo_url text,
    website_url text,
    demo_url text,
    
    -- Status & Tier
    tier text DEFAULT 'basic', -- 'basic', 'professional', 'featured_partner'
    is_active boolean DEFAULT false,
    is_partner boolean DEFAULT false,
    
    -- Content
    categories text[], -- Array of VendorCategory
    short_description text,
    full_description text,
    benefits text[],
    gallery_images text[],
    
    -- Offer
    discount_code text,
    discount_description text,
    
    -- ROI Tracking (Aggregated)
    profile_views integer DEFAULT 0,
    website_clicks integer DEFAULT 0,
    discount_clicks integer DEFAULT 0,
    demo_requests integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Public can view active vendors
CREATE POLICY "Public can view active vendors" 
    ON public.vendors FOR SELECT 
    USING (is_active = true);

-- Vendors can update their own profile
CREATE POLICY "Vendors can update their own profile" 
    ON public.vendors FOR UPDATE 
    USING (auth.uid() = id);

-- RPC for atomic click tracking
CREATE OR REPLACE FUNCTION public.increment_vendor_stats(vendor_id uuid, stat_column text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow specific columns to be incremented for security
    IF stat_column IN ('profile_views', 'website_clicks', 'discount_clicks', 'demo_requests') THEN
        EXECUTE format('UPDATE public.vendors SET %I = %I + 1 WHERE id = %L', stat_column, stat_column, vendor_id);
    END IF;
END;
$$;
