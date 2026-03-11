-- Audit Logs Schema for NeuroChiro Admin Command Center

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    category text NOT NULL, -- SECURITY, AUTOMATION, SYSTEM, DATA, GENERAL
    event text NOT NULL,    -- e.g., 'Admin Login Succeeded'
    user_name text,         -- Display name of user who performed action
    user_id uuid,           -- ID of user (if logged in)
    target text,            -- e.g., 'Auth_Gateway', 'Profile_ID_902'
    status text NOT NULL,   -- Success, Warning, Failed, Info
    severity text NOT NULL, -- Low, Medium, High, Critical
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/founders can view logs
CREATE POLICY "Admins can view audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'founder', 'super_admin')));

-- Function to record log (Server-side/Trigger use)
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_category text,
    p_event text,
    p_user_name text,
    p_user_id uuid,
    p_target text,
    p_status text,
    p_severity text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (category, event, user_name, user_id, target, status, severity, metadata)
    VALUES (p_category, p_event, p_user_name, p_user_id, p_target, p_status, p_severity, p_metadata);
END;
$$;
