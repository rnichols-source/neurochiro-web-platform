-- Lead follow-up. Additive only. Do not run until Ray says "run it".
-- Written 2026-10-30 from a read-only look at the live database.
-- Nothing in this file was executed.
--
-- platform_settings.key is the primary key and value is jsonb,
-- so ON CONFLICT (key) DO NOTHING is valid.
-- contact_requests.id is uuid, so the new foreign key is valid.
-- lead_notifications did not exist.
-- doctors.timezone already exists (text, default America/New_York).
-- This file does not add a timezone column and does not add SMS columns.
-- The channel text column can store "sms" later.
--
-- Live platform_settings row key = contact_escalation (left untouched):
--   enabled: false
--   quiet_hours: start 21, end 8
--   fallback_timezone: America/New_York
--   steps: 1 email at 0h, 2 email at 4h, 3 sms at 24h, 4 admin_alert at 48h
--
-- Live contact_requests counts (57 rows):
--   status new,          contact_outcome null:                         35
--   status acknowledged, contact_outcome patient_contacted_confirmed:  18
--   status new,          contact_outcome will_call_today:               4
--
-- Verified doctors: 138. Verified doctors with a blank email: 3.
--
-- No backfill of email / preferred_time from note.
-- Appointment notes and Instagram notes are mixed formats, so a parse
-- could write the wrong value onto a real lead.
--
-- =============================================================================
-- Live columns at the time this file was written (public schema)
-- =============================================================================
--
-- contact_requests
--   id                         uuid          required  default gen_random_uuid()  PK
--   subscriber_id              uuid          nullable
--   doctor_id                  uuid          required
--   name                       text          required
--   phone                      text          required
--   note                       text          nullable
--   consent_text               text          required
--   consented_at               timestamptz   required  default now()
--   ip                         text          nullable
--   status                     text          required  default 'new'
--   created_at                 timestamptz   nullable  default now()
--   withdrawn_at               timestamptz   nullable
--   withdrawal_token           text          nullable
--   source                     text          nullable  default 'doctor_joined'
--   acknowledged_at            timestamptz   nullable
--   acknowledged_by            text          nullable
--   acknowledged_via           text          nullable
--   acknowledge_token          text          nullable
--   acknowledge_token_expires  timestamptz   nullable
--   admin_note                 text          nullable
--   contact_outcome            text          nullable
--   will_call_deadline         timestamptz   nullable
--
-- contact_request_escalations
--   id                   uuid         required  default gen_random_uuid()  PK
--   contact_request_id   uuid         required  FK contact_requests.id
--   step                 integer      required
--   channel              text         required
--   sent_at              timestamptz  required  default now()
--   scheduled_for        timestamptz  nullable
--   delivered            boolean      nullable
--   error                text         nullable
--   skipped              boolean      nullable  default false
--   skip_reason          text         nullable
--
-- escalation_run_log
--   id                   uuid         required  default gen_random_uuid()  PK
--   run_at               timestamptz  required  default now()
--   contact_request_id   uuid         required
--   step                 integer      required
--   action               text         required
--   reason               text         nullable
--   doctor_timezone      text         nullable
--   doctor_local_hour    integer      nullable
--   dry_run              boolean      nullable  default false
--
-- platform_settings
--   key          text         required  PK
--   value        jsonb        required
--   updated_at   timestamptz  required  default now()
--
-- doctors (existing columns; lead_notification_emails is added below)
--   id, first_name, last_name, clinic_name, slug, city, state,
--   country default 'United States', verification_status default 'verified',
--   membership_tier default 'starter', address, latitude, longitude,
--   website_url, instagram_url, facebook_url, bio, specialties, region_code,
--   email, user_id FK profiles.id, phone, referral_code, referred_by,
--   photo_url, seo_keywords, video_url, profile_views, is_founding_member,
--   is_boosted, boost_expires_at, banner_url, highlights, conditions_treated,
--   education, languages, hours, accepted_payment, faq, gallery_images,
--   patient_leads, booking_url, first_visit_info, parking_info, amenities,
--   offers_telehealth, accepts_walkins, accepting_new_patients,
--   years_in_practice, insurance_networks, team_members, certifications,
--   created_at, trial_ends_at, price_locked_at, is_approved, neuros_tier,
--   onboarding_call_status, spotlight_status, spotlight_date,
--   spotlight_youtube_url, live_feature_status, live_feature_date,
--   content_created, last_featured_date, times_featured, first_visit_price,
--   payment_model, files_insurance, payment_plans, free_consultation,
--   has_evening_hours, has_weekend_hours, short_intro, philosophy,
--   chiropractic_school, degree, graduation_year, post_doctoral_training,
--   google_reviews_url, needs_review, review_notes, verified_at,
--   is_test default false, is_mentoring, is_hiring, rating, review_count,
--   profile_style, instagram_handle_normalized, source, stripe_session_id,
--   tiktok_url, accepts_student_messages, onboarding_status, paid_at,
--   agreement_signed_at, profile_built_at, onboarding_call_booked_at,
--   onboarding_call_done_at, entry_path, nudge_agreement_sent_at,
--   nudge_call_sent_at, onboarding_completed_at,
--   last_onboarding_email_sent_at, last_onboarding_email_type,
--   timezone text default 'America/New_York'
--
-- notifications
--   id          uuid         required  default gen_random_uuid()  PK
--   user_id     uuid         required
--   title       text         required
--   body        text         nullable
--   type        text         nullable  default 'general'
--   priority    text         nullable  default 'normal'
--   link        text         nullable
--   is_read     boolean      nullable  default false
--   created_at  timestamptz  nullable  default now()
--   read_at     timestamptz  nullable
--
-- =============================================================================

-- contact_requests: real columns for what is now stuffed in note, plus follow-up state
alter table public.contact_requests
  add column if not exists email text,
  add column if not exists preferred_time text,
  add column if not exists message text,
  add column if not exists doctor_first_notified_at timestamptz,
  add column if not exists reminder_count int not null default 0,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists escalated_to_admin_at timestamptz,
  add column if not exists needs_admin_attention boolean not null default false,
  add column if not exists attention_reason text,
  add column if not exists patient_checkin_sent_at timestamptz,
  add column if not exists patient_checkin_response text,      -- 'reached' | 'not_yet'
  add column if not exists patient_checkin_responded_at timestamptz,
  add column if not exists patient_checkin_token text,
  add column if not exists outcome_detail text;               -- 'called' | 'voicemail' | 'booked' | 'unreachable'

create index if not exists contact_requests_open_idx
  on public.contact_requests (status, created_at)
  where status = 'new';

create unique index if not exists contact_requests_checkin_token_idx
  on public.contact_requests (patient_checkin_token)
  where patient_checkin_token is not null;

-- doctors: extra recipients
alter table public.doctors
  add column if not exists lead_notification_emails text[] not null default '{}';

-- every send attempt, every channel
create table if not exists public.lead_notifications (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests(id) on delete cascade,
  kind text not null,          -- doctor_initial | doctor_reminder_1 | doctor_reminder_2 | admin_copy | admin_escalation | admin_alert | patient_confirmation | patient_checkin | doctor_withdrawn | doctor_ack
  channel text not null,       -- email | sms | discord | portal
  recipient text,
  status text not null default 'pending', -- pending | sent | failed | skipped | delivered | bounced | complained | opened | clicked
  provider_message_id text,
  attempt int not null default 1,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_notifications_req_idx
  on public.lead_notifications (contact_request_id, kind);

create index if not exists lead_notifications_provider_idx
  on public.lead_notifications (provider_message_id);

alter table public.lead_notifications enable row level security;
-- service role only; no public policies

-- config (do not overwrite an existing row)
insert into public.platform_settings (key, value)
values (
  'lead_followup',
  '{
    "enabled": true,
    "reminder_1_hours": 2,
    "reminder_2_hours": 24,
    "admin_escalation_hours": 48,
    "patient_checkin_hours": 72,
    "quiet_hours": {"start": 20, "end": 8},
    "default_timezone": "America/New_York"
  }'::jsonb
)
on conflict (key) do nothing;
