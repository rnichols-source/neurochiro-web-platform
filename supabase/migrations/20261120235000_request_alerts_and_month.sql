-- Request alerts and the monthly count on Today.
-- Adds columns only when they are missing. Replaces the monthly view so it
-- counts requests and booked visits. No contact info. Do not run this on
-- production from the app. Apply it in the Supabase SQL editor before merge.

begin;

alter table public.doctors
  add column if not exists lead_notification_emails text[] not null default '{}',
  add column if not exists lead_alert_phones text[] not null default '{}',
  add column if not exists sms_alerts_enabled boolean not null default true,
  add column if not exists sms_alerts_consent_at timestamptz,
  add column if not exists sms_alerts_consent_text text,
  add column if not exists lead_alert_channel text not null default 'both';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'doctors_lead_alert_channel_check'
  ) then
    alter table public.doctors
      add constraint doctors_lead_alert_channel_check
      check (lead_alert_channel in ('email', 'text', 'both'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'doctors_lead_alert_phones_max3'
  ) then
    alter table public.doctors
      add constraint doctors_lead_alert_phones_max3
      check (coalesce(cardinality(lead_alert_phones), 0) <= 3);
  end if;
end $$;

drop view if exists public.doctor_pipeline_monthly;
create view public.doctor_pipeline_monthly as
select
  doctor_id,
  date_trunc('month', happened_at) as month_start,
  count(*) filter (where stage = 'requested')::int as request_count,
  count(*) filter (where stage = 'scheduled')::int as scheduled_count,
  count(*) filter (where stage = 'started_care')::int as started_care_count
from public.doctor_request_stage_events
group by 1, 2;

comment on view public.doctor_pipeline_monthly is
  'Requests, booked (scheduled), and started care per doctor per UTC month. No contact info. Read with the service role.';

revoke all on public.doctor_pipeline_monthly from public, anon, authenticated;
grant select on public.doctor_pipeline_monthly to service_role;

-- Visit requests need these tables and columns. Existing databases already have them.
create table if not exists public.community_households (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.community_households(id) on delete cascade,
  first_name text not null,
  relationship text not null,
  invited_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_privacy (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  share_name_with_home_doctor boolean not null default false,
  share_email_with_home_doctor boolean not null default false,
  share_phone_with_home_doctor boolean not null default false,
  share_family_first_names_with_home_doctor boolean not null default false,
  share_home_clinic_with_other_doctors boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.community_visit_requests
  add column if not exists family_member_id uuid,
  add column if not exists shared_family_names text,
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text;

commit;
