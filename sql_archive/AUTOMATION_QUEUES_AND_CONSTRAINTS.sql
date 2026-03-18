-- 1. FIX RACE CONDITIONS: Add Unique Constraints
-- Prevent duplicate job applications
ALTER TABLE public.job_applications 
ADD CONSTRAINT unique_student_job_application UNIQUE (student_id, job_id);

-- Prevent duplicate daily logs for the same day
ALTER TABLE public.daily_logs 
ADD CONSTRAINT unique_user_daily_log_date UNIQUE (user_id, date);


-- 2. FIX LACK OF MESSAGE QUEUING: Automation Queue Table
CREATE TABLE public.automation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  retry_count integer DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Service Role only)
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

-- 3. Webhook Idempotency (From Previous Recommendation)
CREATE TABLE public.processed_webhooks (
  id text PRIMARY KEY, -- Stripe Event ID
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
