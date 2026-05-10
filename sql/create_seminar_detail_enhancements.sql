-- Seminar detail page enhancements
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS schedule jsonb;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS speakers jsonb;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS venue_name text;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS venue_address text;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS faq jsonb;
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS gallery_images text[];
ALTER TABLE seminars ADD COLUMN IF NOT EXISTS hero_image_url text;
