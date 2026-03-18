-- 1. Job Postings Table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text DEFAULT 'Associate' CHECK (type IN ('Associate', 'Staff')),
    salary_min integer,
    salary_max integer,
    benefits text[],
    requirements text[],
    status text DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Closed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
    candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage text DEFAULT 'New' CHECK (stage IN ('New', 'Screening', 'Interview', 'Offer', 'Rejected')),
    resume_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(job_id, candidate_id)
);

-- 3. Market Benchmarks Table
CREATE TABLE IF NOT EXISTS public.market_benchmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_type text NOT NULL,
    region_code text, -- Zip code or city/state
    avg_salary_min integer,
    avg_salary_max integer,
    common_benefits text[],
    last_updated timestamptz DEFAULT now(),
    UNIQUE(role_type, region_code)
);

-- 4. RLS for job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active job postings') THEN
        CREATE POLICY "Anyone can view active job postings" ON public.job_postings 
        FOR SELECT USING (status = 'Active');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors can manage their own job postings') THEN
        CREATE POLICY "Doctors can manage their own job postings" ON public.job_postings 
        FOR ALL USING (auth.uid() = doctor_id);
    END IF;
END $$;

-- 5. RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can view their own applications') THEN
        CREATE POLICY "Candidates can view their own applications" ON public.applications 
        FOR SELECT USING (auth.uid() = candidate_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors can view applications for their jobs') THEN
        CREATE POLICY "Doctors can view applications for their jobs" ON public.applications 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.job_postings 
                WHERE job_postings.id = applications.job_id 
                AND job_postings.doctor_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 6. Insert some sample benchmarks if empty
INSERT INTO public.market_benchmarks (role_type, region_code, avg_salary_min, avg_salary_max)
VALUES 
('Associate', 'DEFAULT', 75000, 120000),
('Staff', 'DEFAULT', 35000, 55000)
ON CONFLICT DO NOTHING;
