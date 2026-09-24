-- Add country column to zip_codes for international postal codes.
-- The "zip" column now holds postal codes from any supported country.
-- Primary key changes to (country, zip) to avoid collisions.
--
-- Run in Supabase SQL Editor, then run scripts/import-international-postal.ts

-- Add country column with US default (existing rows are all US)
ALTER TABLE zip_codes ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US';

-- Drop old primary key and create composite
ALTER TABLE zip_codes DROP CONSTRAINT IF EXISTS zip_codes_pkey;
ALTER TABLE zip_codes ADD PRIMARY KEY (country, zip);

-- Index for postal code lookups by country
CREATE INDEX IF NOT EXISTS zip_codes_country_idx ON zip_codes (country);

-- IMPORTANT: The "zip" column holds postal codes from all countries:
--   US: 5-digit ZIP (29651)
--   CA: Forward sortation area (T0A, V5K)
--   GB: UK outward code (SW1A, M9, BN91)
--   NZ: 4-digit postcode (0600, 6011)
-- Always filter by country when looking up postal codes.

-- Add a comment to the table for documentation
COMMENT ON TABLE zip_codes IS 'Postal code coordinates for US, CA, GB, NZ. Column "zip" holds postal codes from all countries. Always filter by country. Source: GeoNames CC BY 4.0.';
COMMENT ON COLUMN zip_codes.zip IS 'Postal code (US ZIP, CA FSA, GB outward code, NZ postcode). NOT renamed to avoid breaking existing queries.';
COMMENT ON COLUMN zip_codes.country IS 'ISO 3166-1 alpha-2 country code (US, CA, GB, NZ)';
