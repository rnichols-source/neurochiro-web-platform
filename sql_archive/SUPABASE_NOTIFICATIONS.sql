-- Notifications Table (Individual)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL, -- 'referral', 'job', 'system', 'reminder', 'announcement'
  priority text DEFAULT 'info', -- 'info', 'important', 'urgent'
  link text, -- Optional URL to redirect to
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Announcements Table (Global/Segmented)
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  audience_type text NOT NULL DEFAULT 'all', -- 'all', 'students', 'doctors', 'vendors', 'mastermind', 'council'
  audience_filter jsonb DEFAULT '{}'::jsonb, -- e.g. { "region": "AU", "tier": "paid" }
  priority text DEFAULT 'info', -- 'info', 'important', 'urgent', 'promo'
  delivery_methods text[] DEFAULT '{in-platform}', -- 'in-platform', 'push', 'email'
  starts_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Announcement Dismissals (Track who saw/dismissed global announcements)
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

-- Push Subscriptions (For Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription jsonb NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Announcements
CREATE POLICY "Everyone can view active announcements" ON public.announcements
  FOR SELECT USING (now() >= starts_at AND (expires_at IS NULL OR now() <= expires_at));

-- Policies for Announcement Dismissals
CREATE POLICY "Users can manage their own dismissals" ON public.announcement_dismissals
  FOR ALL USING (auth.uid() = user_id);

-- Policies for Push Subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Admin Policies (Assuming 'admin' role in profiles or auth.users metadata)
-- Note: This depends on how roles are checked. 
-- In NeuroChiro, roles are in public.profiles.
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage all announcements" ON public.announcements
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
