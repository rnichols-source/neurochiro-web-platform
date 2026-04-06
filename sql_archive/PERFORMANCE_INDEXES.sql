-- Performance Indexes
-- Run this in your Supabase SQL Editor

-- Doctors table: frequently queried columns
CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON public.doctors(verification_status);
CREATE INDEX IF NOT EXISTS idx_doctors_membership_tier ON public.doctors(membership_tier);
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON public.doctors(slug);
CREATE INDEX IF NOT EXISTS idx_doctors_region_code ON public.doctors(region_code);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_lat_lng ON public.doctors(latitude, longitude);

-- Composite index for the most common directory query pattern
CREATE INDEX IF NOT EXISTS idx_doctors_verified_tier ON public.doctors(verification_status, membership_tier);

-- Notifications: user lookup + ordering
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Leads: doctor lookup
CREATE INDEX IF NOT EXISTS idx_leads_doctor_id ON public.leads(doctor_id);

-- Job postings: doctor lookup + status filter
CREATE INDEX IF NOT EXISTS idx_job_postings_doctor_status ON public.job_postings(doctor_id, status);

-- Seminars: approval + ordering
CREATE INDEX IF NOT EXISTS idx_seminars_approved ON public.seminars(is_approved, created_at DESC);

-- Referrals: both parties
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_recipient ON public.referrals(recipient_id, created_at DESC);

-- Patient stories: doctor lookup + approval
CREATE INDEX IF NOT EXISTS idx_patient_stories_doctor_approved ON public.patient_stories(doctor_id, approved);

-- Daily logs: user + date
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);

-- Profiles: email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Analytics events: doctor + type
CREATE INDEX IF NOT EXISTS idx_analytics_events_doctor ON public.analytics_events(doctor_id, event_type);
