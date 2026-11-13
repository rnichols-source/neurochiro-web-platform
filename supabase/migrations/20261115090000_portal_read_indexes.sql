-- Portal read paths: community member home, doctor shell counts, founder alerts.
-- Idempotent. No data changes.
-- RLS initplan wrap is behavior-identical: auth.uid() -> (select auth.uid()).

create index if not exists portal_perf_notifications_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists portal_perf_visits_doctor_status_idx
  on public.community_visit_requests (doctor_id, status);

create index if not exists portal_perf_assignments_profile_status_idx
  on public.community_exercise_assignments (profile_id, status);

create index if not exists portal_perf_assignments_doctor_status_idx
  on public.community_exercise_assignments (doctor_id, status);

create index if not exists portal_perf_contact_unacked_idx
  on public.contact_requests (created_at)
  where acknowledged_at is null;

create index if not exists portal_perf_demand_distance_idx
  on public.demand_mentions (nearest_distance_mi)
  where nearest_distance_mi is not null;

create index if not exists portal_perf_doctors_founding_idx
  on public.doctors (id)
  where is_founding_member = true and is_test = false;

create index if not exists portal_perf_week_checkins_idx
  on public.community_week_checkins (profile_id, week_start);

create index if not exists portal_perf_passport_trips_idx
  on public.community_passport_trips (profile_id, status, starts_on);

create index if not exists portal_perf_work_interest_idx
  on public.community_work_interest (profile_id, created_at desc);


-- zip = ANY(...) / .in('zip') cannot use the (country, zip) primary key.
create index if not exists portal_perf_zip_codes_zip_idx
  on public.zip_codes (zip);

-- ILIKE on lower(city). doctors already has doctors_city_trgm_idx on lower(city).
-- zip_codes city search did not. A second gin on doctors.city matches city ILIKE
-- predicates that are not wrapped in lower().
create extension if not exists pg_trgm;
create index if not exists portal_perf_zip_codes_city_lower_trgm
  on public.zip_codes using gin (lower(city) gin_trgm_ops);
create index if not exists portal_perf_doctors_city_ilike_trgm
  on public.doctors using gin (city gin_trgm_ops);

-- One round trip for the founder roster. Service role only. No row data is rewritten.
create or replace function public.founder_roster_bundle()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'doctors', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, user_id, first_name, last_name, clinic_name, email, phone, city, state, country,
             latitude, longitude, verification_status, membership_tier, is_founding_member, is_test,
             created_at, profile_views, slug, photo_url, first_visit_price, sms_alerts_enabled, lead_alert_phones
      from public.doctors
    ) t), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, doctor_id, subscriber_id, name, email, phone, status, created_at, acknowledged_at,
             contact_outcome, source, patient_checkin_sent_at, patient_checkin_response, sms_consent, sms_phone,
             office_visit_response, office_visit_sent_at
      from public.contact_requests
    ) t), '[]'::jsonb),
    'profiles', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, full_name, email, role, is_test, last_sign_in_at, created_at
      from public.profiles
    ) t), '[]'::jsonb),
    'applications', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, user_id, status, city, state, country, created_at, step_reached, plan, price_label
      from public.doctor_applications
    ) t), '[]'::jsonb),
    'subscribers', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, email, status, state, country, latitude, longitude, sms_consent, sms_phone
      from public.subscribers
    ) t), '[]'::jsonb),
    'mentions', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select city, state, country, lat, lng, source, post_ref, nearest_distance_mi, repeat_count
      from public.demand_mentions
    ) t), '[]'::jsonb),
    'searches', (select count(*) from public.site_activity where event_type = 'search'),
    'profileViews', (select count(*) from public.site_activity where event_type = 'profile_view'),
    'bookTaps', (select count(*) from public.conversion_events where event_type = 'book'),
    'callTaps', (select count(*) from public.conversion_events where event_type = 'call'),
    'communityVisits', (select count(*) from public.community_visit_requests),
    'mentionCount', (select count(*) from public.demand_mentions),
    'officeReady', true
  );
$$;

revoke all on function public.founder_roster_bundle() from public, anon, authenticated;
grant execute on function public.founder_roster_bundle() to service_role;

-- Exact case-insensitive city match / prefix. Predicate is lower(city) ILIKE so the gin index applies.
create or replace function public.zip_codes_city_ilike(needle text, country_code text default null)
returns setof public.zip_codes
language sql
stable
security invoker
set search_path = public
as $$
  select z.*
  from public.zip_codes z
  where lower(z.city) ilike lower(needle)
    and (country_code is null or country_code = '' or z.country = country_code);
$$;

grant execute on function public.zip_codes_city_ilike(text, text) to anon, authenticated, service_role;

-- Rewrite public policies that call auth.uid(), auth.role(), auth.jwt(), or current_setting() per row.
-- Each call is wrapped as (select ...) once. Already-wrapped calls are left alone, so this is safe to re-run.
do $$
declare
  rec record;
  next_using text;
  next_check text;
  stmt text;
begin
  for rec in
    select c.relname as tbl,
           p.polname as name,
           pg_get_expr(p.polqual, p.polrelid) as qual,
           pg_get_expr(p.polwithcheck, p.polrelid) as chk
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
  loop
    next_using := rec.qual;
    next_check := rec.chk;
    if next_using is not null then
      if next_using !~* 'select[[:space:]]+auth\.uid\(\)' then
        next_using := replace(next_using, 'auth.uid()', '(select auth.uid())');
      end if;
      if next_using !~* 'select[[:space:]]+auth\.role\(\)' then
        next_using := replace(next_using, 'auth.role()', '(select auth.role())');
      end if;
      if next_using !~* 'select[[:space:]]+auth\.jwt\(\)' then
        next_using := replace(next_using, 'auth.jwt()', '(select auth.jwt())');
      end if;
      if next_using !~* 'select[[:space:]]+current_setting[[:space:]]*\(' then
        next_using := regexp_replace(next_using, 'current_setting[[:space:]]*\(((?:[^()]|\([^()]*\))*)\)', '(select current_setting(\1))', 'gi');
      end if;
    end if;
    if next_check is not null then
      if next_check !~* 'select[[:space:]]+auth\.uid\(\)' then
        next_check := replace(next_check, 'auth.uid()', '(select auth.uid())');
      end if;
      if next_check !~* 'select[[:space:]]+auth\.role\(\)' then
        next_check := replace(next_check, 'auth.role()', '(select auth.role())');
      end if;
      if next_check !~* 'select[[:space:]]+auth\.jwt\(\)' then
        next_check := replace(next_check, 'auth.jwt()', '(select auth.jwt())');
      end if;
      if next_check !~* 'select[[:space:]]+current_setting[[:space:]]*\(' then
        next_check := regexp_replace(next_check, 'current_setting[[:space:]]*\(((?:[^()]|\([^()]*\))*)\)', '(select current_setting(\1))', 'gi');
      end if;
    end if;
    if next_using is not distinct from rec.qual and next_check is not distinct from rec.chk then
      continue;
    end if;
    stmt := format('alter policy %I on public.%I', rec.name, rec.tbl);
    if rec.qual is not null then
      stmt := stmt || ' using (' || next_using || ')';
    end if;
    if rec.chk is not null then
      stmt := stmt || ' with check (' || next_check || ')';
    end if;
    execute stmt;
  end loop;
end $$;
