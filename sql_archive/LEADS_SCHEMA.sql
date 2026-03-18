-- ManyChat Lead Capture Schema

CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Lead Details
    first_name text,
    last_name text,
    email text,
    phone text,
    location text,
    role text, -- 'doctor', 'student', 'patient'
    
    -- ManyChat specific
    manychat_id text UNIQUE,
    source text DEFAULT 'instagram',
    status text DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only admins can see/manage leads
CREATE POLICY "Admins have full access to leads" 
    ON public.leads FOR ALL 
    USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'founder', 'super_admin')));

-- Service role can do anything (for webhooks)
CREATE POLICY "Service role full access" 
    ON public.leads FOR ALL 
    USING (auth.role() = 'service_role');
