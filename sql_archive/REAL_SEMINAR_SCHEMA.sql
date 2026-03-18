-- Professional Seminar Schema Update

ALTER TABLE public.seminars 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS start_time text,
ADD COLUMN IF NOT EXISTS end_time text,
ADD COLUMN IF NOT EXISTS instructor_name text,
ADD COLUMN IF NOT EXISTS instructor_bio text,
ADD COLUMN IF NOT EXISTS registration_link text,
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'Seminar',
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS is_past boolean DEFAULT false;

-- Indexing for discovery features
CREATE INDEX IF NOT EXISTS idx_seminars_country ON public.seminars(country);
CREATE INDEX IF NOT EXISTS idx_seminars_city ON public.seminars(city);
CREATE INDEX IF NOT EXISTS idx_seminars_is_past ON public.seminars(is_past);
