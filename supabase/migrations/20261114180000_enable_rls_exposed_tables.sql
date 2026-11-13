-- Enable row level security on the 15 public tables the security advisor
-- reported as unprotected. Service role keeps bypassing RLS, so server
-- code that uses the admin client is unchanged.
--
-- Does not drop data, does not alter other tables, and does not add a
-- policy that is always true.
--
-- public.is_staff() already exists (security lockdown). It reads profiles
-- as security definer and matches the admin roles used by checkAdminAuth.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Same rule as src/lib/directory/visibility.ts isDoctorPubliclyVisible.
-- Arguments only: the function does not read the table, so the doctors
-- policy cannot recurse.
create or replace function public.doctor_row_is_public(
  verification_status text,
  user_id uuid,
  is_approved boolean,
  is_founding_member boolean,
  membership_tier text,
  paid_at timestamptz
) returns boolean
language sql
immutable
set search_path = public
as $$
  select
    lower(btrim(coalesce(verification_status, ''))) in ('verified', 'pending')
    and (
      user_id is null
      or is_approved is true
      or is_founding_member is true
      or lower(btrim(coalesce(membership_tier, ''))) in ('basic', 'growth', 'pro', 'neuros')
      or paid_at is not null
      or lower(btrim(coalesce(verification_status, ''))) = 'verified'
    );
$$;

revoke all on function public.doctor_row_is_public(text, uuid, boolean, boolean, text, timestamptz) from public;
grant execute on function public.doctor_row_is_public(text, uuid, boolean, boolean, text, timestamptz) to anon, authenticated;

-- The directory calls this as the visitor. It stays security invoker so RLS
-- applies. search_path was unset, which the advisor flags.
alter function public.increment_doctor_views(text) set search_path = public;

-- Trigger on doctors. Same advisor finding, no behavior change.
alter function public.normalize_instagram_handle() set search_path = public;

-- Blocks privilege escalation on rows a member is allowed to update.
-- Service role and staff pass through. Visitors may only bump profile_views.
create or replace function public.protect_doctor_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  privileged text[] := array[
    'id', 'user_id', 'verification_status', 'is_approved', 'membership_tier',
    'is_founding_member', 'paid_at', 'stripe_customer_id', 'stripe_subscription_id',
    'stripe_session_id', 'onboarding_call_status', 'onboarding_status',
    'onboarding_call_booked_at', 'onboarding_call_done_at', 'onboarding_completed_at',
    'is_test', 'needs_review', 'review_notes', 'verified_at', 'price_locked_at',
    'trial_ends_at', 'neuros_tier', 'spotlight_status', 'spotlight_date',
    'spotlight_youtube_url', 'live_feature_status', 'live_feature_date',
    'content_created', 'last_featured_date', 'times_featured', 'patient_leads',
    'referral_code', 'referred_by', 'referred_by_doctor_id', 'entry_path',
    'agreement_signed_at', 'profile_built_at', 'nudge_agreement_sent_at',
    'nudge_call_sent_at', 'last_onboarding_email_sent_at', 'last_onboarding_email_type',
    'sms_alerts_consent_at', 'sms_alerts_consent_text', 'lead_notification_emails',
    'lead_alert_phones'
  ];
begin
  if jwt_role = 'service_role'
     or current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if jwt_role = 'anon' then
    -- co_owner_search is generated. An update recomputes it, so ignore it here.
    if (to_jsonb(new) - 'profile_views' - 'co_owner_search')
       is distinct from (to_jsonb(old) - 'profile_views' - 'co_owner_search') then
      raise exception 'Only a profile view count can be updated' using errcode = '42501';
    end if;
    return new;
  end if;

  if public.is_staff() then
    return new;
  end if;

  if old.user_id is not null and old.user_id = auth.uid() and new.user_id = old.user_id then
    if exists (
      select 1
      from unnest(privileged) as privileged_key(key)
      where (to_jsonb(new) -> privileged_key.key) is distinct from (to_jsonb(old) -> privileged_key.key)
    ) then
      raise exception 'Changing listing status, billing, or private account fields is not allowed'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (to_jsonb(new) - 'profile_views' - 'co_owner_search')
     is distinct from (to_jsonb(old) - 'profile_views' - 'co_owner_search') then
    raise exception 'Only a profile view count can be updated' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_doctor_privileged_columns() from public;
grant execute on function public.protect_doctor_privileged_columns() to anon, authenticated;

create or replace function public.protect_vendor_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  privileged text[] := array[
    'id', 'is_active', 'tier', 'vetting_status', 'vetting_checklist', 'vetting_notes',
    'is_founding_vendor', 'discount_code', 'best_price_pledged_at',
    'profile_views', 'website_clicks', 'discount_clicks', 'user_count'
  ];
begin
  if jwt_role = 'service_role'
     or current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if public.is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.id is distinct from auth.uid()
       or new.is_active is true
       or coalesce(new.tier, 'basic') is distinct from 'basic' then
      raise exception 'A vendor application cannot publish itself' using errcode = '42501';
    end if;
    return new;
  end if;

  if exists (
    select 1
    from unnest(privileged) as privileged_key(key)
    where (to_jsonb(new) -> privileged_key.key) is distinct from (to_jsonb(old) -> privileged_key.key)
  ) then
    raise exception 'Changing vendor listing status or billing fields is not allowed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_vendor_privileged_columns() from public;
grant execute on function public.protect_vendor_privileged_columns() to authenticated;

create or replace function public.protect_application_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  privileged text[] := array[
    'id', 'status', 'score', 'admin_notes', 'rating', 'doctor_notes',
    'stage_history', 'rejection_reason', 'created_at'
  ];
begin
  if jwt_role = 'service_role'
     or current_user in ('service_role', 'postgres', 'supabase_admin')
     or public.is_staff() then
    return new;
  end if;
  if exists (
    select 1
    from unnest(privileged) as privileged_key(key)
    where (to_jsonb(new) -> privileged_key.key) is distinct from (to_jsonb(old) -> privileged_key.key)
  ) then
    raise exception 'Changing application review fields is not allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_application_privileged_columns() from public;
grant execute on function public.protect_application_privileged_columns() to authenticated;

create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if jwt_role = 'service_role'
     or current_user in ('service_role', 'postgres', 'supabase_admin')
     or public.is_staff() then
    return new;
  end if;
  if (to_jsonb(new) - 'read_at' - 'is_read') is distinct from (to_jsonb(old) - 'read_at' - 'is_read') then
    raise exception 'A notification can only be marked read' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_notification_columns() from public;
grant execute on function public.protect_notification_columns() to authenticated;

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------

alter table public.doctors enable row level security;

drop policy if exists "Allow public read access" on public.doctors;
drop policy if exists "Allow service role full access" on public.doctors;
drop policy if exists "Doctors can update own record" on public.doctors;
drop policy if exists doctors_public_select on public.doctors;
drop policy if exists doctors_owner_select on public.doctors;
drop policy if exists doctors_staff_all on public.doctors;
drop policy if exists doctors_owner_update on public.doctors;
drop policy if exists doctors_public_view_update on public.doctors;

create policy doctors_public_select on public.doctors
  for select to anon, authenticated
  using (
    public.doctor_row_is_public(
      verification_status, user_id, is_approved, is_founding_member, membership_tier, paid_at
    )
  );

create policy doctors_owner_select on public.doctors
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy doctors_staff_all on public.doctors
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy doctors_owner_update on public.doctors
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Directory view counter. The column grant below limits anon to profile_views,
-- and the trigger limits everyone else who is not the owner or staff.
create policy doctors_public_view_update on public.doctors
  for update to anon, authenticated
  using (
    public.doctor_row_is_public(
      verification_status, user_id, is_approved, is_founding_member, membership_tier, paid_at
    )
  )
  with check (
    public.doctor_row_is_public(
      verification_status, user_id, is_approved, is_founding_member, membership_tier, paid_at
    )
  );

drop trigger if exists protect_doctor_privileged_columns on public.doctors;
create trigger protect_doctor_privileged_columns
  before update on public.doctors
  for each row execute function public.protect_doctor_privileged_columns();

revoke all on table public.doctors from public, anon, authenticated;
grant select on table public.doctors to anon, authenticated;
grant update (profile_views) on table public.doctors to anon;
grant update on table public.doctors to authenticated;

-- ---------------------------------------------------------------------------
-- seminars
-- Public pages filter is_approved. The unused policies filtered status.
-- Both are accepted so neither the live pages nor those policies go dark.
-- Hosts read their own rows, including ones that are not approved yet.
-- Host edits go through the service role (doctor seminar actions). There is
-- no authenticated update policy, so a host cannot approve their own row.
-- ---------------------------------------------------------------------------

alter table public.seminars enable row level security;

drop policy if exists "Anon can read published seminars" on public.seminars;
drop policy if exists "Authenticated can read published seminars" on public.seminars;
drop policy if exists seminars_public_select on public.seminars;
drop policy if exists seminars_host_select on public.seminars;
drop policy if exists seminars_staff_all on public.seminars;

create policy seminars_public_select on public.seminars
  for select to anon, authenticated
  using (
    is_approved is true
    or status in ('published', 'completed')
  );

create policy seminars_host_select on public.seminars
  for select to authenticated
  using (host_id = (select auth.uid()));

create policy seminars_staff_all on public.seminars
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

revoke all on table public.seminars from public, anon, authenticated;
-- Table-level select would keep the private columns visible. Grant the public
-- columns only. admin_notes, payment_status, host_type_at_submission and
-- virtual_url stay with the service role.
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'seminars'
    and column_name not in ('admin_notes', 'payment_status', 'host_type_at_submission', 'virtual_url');
  execute format('grant select (%s) on table public.seminars to anon, authenticated', cols);
end $$;

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------

alter table public.vendors enable row level security;

drop policy if exists vendors_public_select on public.vendors;
drop policy if exists vendors_owner_select on public.vendors;
drop policy if exists vendors_owner_insert on public.vendors;
drop policy if exists vendors_owner_update on public.vendors;
drop policy if exists vendors_staff_all on public.vendors;

create policy vendors_public_select on public.vendors
  for select to anon, authenticated
  using (is_active is true);

create policy vendors_owner_select on public.vendors
  for select to authenticated
  using (id = (select auth.uid()));

create policy vendors_owner_insert on public.vendors
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and is_active is not true
    and coalesce(tier, 'basic') = 'basic'
  );

create policy vendors_owner_update on public.vendors
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy vendors_staff_all on public.vendors
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop trigger if exists protect_vendor_privileged_columns on public.vendors;
create trigger protect_vendor_privileged_columns
  before insert or update on public.vendors
  for each row execute function public.protect_vendor_privileged_columns();

revoke all on table public.vendors from public, anon, authenticated;
grant select on table public.vendors to anon, authenticated;
grant insert, update, delete on table public.vendors to authenticated;

-- ---------------------------------------------------------------------------
-- notifications
-- Members read and mark their own. Inserts for someone else use the service
-- role (sendNotification, job alerts, lead mail). Staff can still insert
-- from an admin session.
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_staff_all on public.notifications;

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()))
  with check (user_id = (select auth.uid()) or (select public.is_staff()));

create policy notifications_staff_all on public.notifications
  for insert to authenticated
  with check ((select public.is_staff()));

drop trigger if exists protect_notification_columns on public.notifications;
create trigger protect_notification_columns
  before update on public.notifications
  for each row execute function public.protect_notification_columns();

revoke all on table public.notifications from public, anon, authenticated;
grant select, update, insert on table public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- analytics_events
-- The old policy compared auth.uid() to doctor_id. Those ids are different,
-- so it never matched. Reads in the app use the service role. Owners can
-- read events for their own doctor row. Inserts stay on the service role
-- (the /api/track route and the profile view recorder).
-- ---------------------------------------------------------------------------

alter table public.analytics_events enable row level security;

drop policy if exists "Doctors can view their own analytics" on public.analytics_events;
drop policy if exists analytics_events_owner_select on public.analytics_events;
drop policy if exists analytics_events_staff_select on public.analytics_events;

create policy analytics_events_owner_select on public.analytics_events
  for select to authenticated
  using (
    doctor_id in (
      select d.id from public.doctors d where d.user_id = (select auth.uid())
    )
  );

create policy analytics_events_staff_select on public.analytics_events
  for select to authenticated
  using ((select public.is_staff()));

revoke all on table public.analytics_events from public, anon, authenticated;
grant select on table public.analytics_events to authenticated;

-- ---------------------------------------------------------------------------
-- applications
-- This table is the legacy application store (email, status, notes). It has
-- no user id. Current doctor signup writes doctor_applications with the
-- service role. Job pipeline code reads job_applications; its fallback
-- selects columns that are not on this table.
-- A signed-in person can read and update the row whose email matches the
-- auth email claim. Review fields stay locked. There is no anonymous insert.
-- ---------------------------------------------------------------------------

alter table public.applications enable row level security;

drop policy if exists applications_owner_select on public.applications;
drop policy if exists applications_owner_update on public.applications;
drop policy if exists applications_staff_all on public.applications;

create policy applications_owner_select on public.applications
  for select to authenticated
  using (
    coalesce((select auth.jwt()) ->> 'email', '') <> ''
    and lower(email) = lower((select auth.jwt()) ->> 'email')
  );

create policy applications_owner_update on public.applications
  for update to authenticated
  using (
    coalesce((select auth.jwt()) ->> 'email', '') <> ''
    and lower(email) = lower((select auth.jwt()) ->> 'email')
  )
  with check (
    coalesce((select auth.jwt()) ->> 'email', '') <> ''
    and lower(email) = lower((select auth.jwt()) ->> 'email')
  );

create policy applications_staff_all on public.applications
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop trigger if exists protect_application_privileged_columns on public.applications;
create trigger protect_application_privileged_columns
  before update on public.applications
  for each row execute function public.protect_application_privileged_columns();

revoke all on table public.applications from public, anon, authenticated;
grant select, update on table public.applications to authenticated;
grant insert, delete on table public.applications to authenticated;

-- ---------------------------------------------------------------------------
-- weeks and modules
-- Academy screens render seed content, not these tables. Nothing in the app
-- queries them. Published rows are readable by signed-in students, doctors,
-- and staff. Anonymous visitors and community members cannot read them.
-- Writes stay on the service role.
-- ---------------------------------------------------------------------------

alter table public.weeks enable row level security;
alter table public.modules enable row level security;

drop policy if exists weeks_member_select on public.weeks;
drop policy if exists modules_member_select on public.modules;

create policy weeks_member_select on public.weeks
  for select to authenticated
  using (
    is_published is true
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (
          lower(p.role::text) in ('student', 'doctor', 'admin', 'super_admin', 'founder', 'regional_admin')
          or lower(p.role::text) like 'doctor%'
          or lower(p.role::text) like 'student%'
        )
    )
  );

create policy modules_member_select on public.modules
  for select to authenticated
  using (
    is_published is true
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (
          lower(p.role::text) in ('student', 'doctor', 'admin', 'super_admin', 'founder', 'regional_admin')
          or lower(p.role::text) like 'doctor%'
          or lower(p.role::text) like 'student%'
        )
    )
  );

revoke all on table public.weeks from public, anon, authenticated;
revoke all on table public.modules from public, anon, authenticated;
grant select on table public.weeks to authenticated;
grant select on table public.modules to authenticated;

-- ---------------------------------------------------------------------------
-- Admin-only tables. No anonymous or member policy. Staff sessions can
-- read and write. Cron jobs and server actions use the service role.
-- ---------------------------------------------------------------------------

alter table public.outreach_logs enable row level security;
alter table public.outreach_templates enable row level security;
alter table public.contact_request_escalations enable row level security;
alter table public.escalation_run_log enable row level security;
alter table public.reply_template_variants enable row level security;

drop policy if exists outreach_logs_staff_all on public.outreach_logs;
drop policy if exists outreach_templates_staff_all on public.outreach_templates;
drop policy if exists contact_request_escalations_staff_all on public.contact_request_escalations;
drop policy if exists escalation_run_log_staff_all on public.escalation_run_log;
drop policy if exists reply_template_variants_staff_all on public.reply_template_variants;

create policy outreach_logs_staff_all on public.outreach_logs
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy outreach_templates_staff_all on public.outreach_templates
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy contact_request_escalations_staff_all on public.contact_request_escalations
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy escalation_run_log_staff_all on public.escalation_run_log
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy reply_template_variants_staff_all on public.reply_template_variants
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

revoke all on table public.outreach_logs from public, anon, authenticated;
revoke all on table public.outreach_templates from public, anon, authenticated;
revoke all on table public.contact_request_escalations from public, anon, authenticated;
revoke all on table public.escalation_run_log from public, anon, authenticated;
revoke all on table public.reply_template_variants from public, anon, authenticated;

grant select, insert, update, delete on table public.outreach_logs to authenticated;
grant select, insert, update, delete on table public.outreach_templates to authenticated;
grant select, insert, update, delete on table public.contact_request_escalations to authenticated;
grant select, insert, update, delete on table public.escalation_run_log to authenticated;
grant select, insert, update, delete on table public.reply_template_variants to authenticated;

-- ---------------------------------------------------------------------------
-- Backups. RLS on, no policies, no grants for the API roles.
-- The advisor will report "RLS enabled, no policy". That is the locked state.
-- Do not drop these tables.
-- ---------------------------------------------------------------------------

alter table public.demand_mentions_backup_oct1 enable row level security;
alter table public.demand_mentions_backup_oct9 enable row level security;

revoke all on table public.demand_mentions_backup_oct1 from public, anon, authenticated;
revoke all on table public.demand_mentions_backup_oct9 from public, anon, authenticated;
