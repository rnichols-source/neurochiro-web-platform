-- NOT RUN — Raymond reviews and runs

-- CHECK FIRST
-- select count(*) from doctors;
-- select count(*) from profiles;
-- select extname from pg_extension where extname = 'pg_trgm';
-- select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename in ('doctors', 'profiles');
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'doctors'
--   and column_name in ('is_founding_member', 'neuros_tier', 'onboarding_call_status', 'is_approved', 'updated_at');
-- Stop if any of those doctor columns are missing. The function below reads them.

create extension if not exists pg_trgm;

create index if not exists doctors_first_name_trgm_idx
  on public.doctors using gin ((lower(first_name)) gin_trgm_ops);
create index if not exists doctors_last_name_trgm_idx
  on public.doctors using gin ((lower(last_name)) gin_trgm_ops);
create index if not exists doctors_clinic_name_trgm_idx
  on public.doctors using gin ((lower(clinic_name)) gin_trgm_ops);
create index if not exists doctors_email_trgm_idx
  on public.doctors using gin ((lower(email)) gin_trgm_ops);
create index if not exists doctors_city_trgm_idx
  on public.doctors using gin ((lower(city)) gin_trgm_ops);
create index if not exists doctors_state_trgm_idx
  on public.doctors using gin ((lower(state)) gin_trgm_ops);
create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin ((lower(full_name)) gin_trgm_ops);
create index if not exists profiles_email_trgm_idx
  on public.profiles using gin ((lower(email)) gin_trgm_ops);

create or replace function public.admin_search_members(
  q text default null,
  role_filter text default null,
  status_filter text default null,
  state_code text default null,
  country_code text default null,
  page integer default 1,
  page_size integer default 25,
  sort text default 'name'
)
returns table (
  id uuid,
  member_role text,
  full_name text,
  email text,
  practice text,
  city text,
  member_state text,
  member_country text,
  verification_status text,
  last_activity timestamptz,
  slug text,
  user_id uuid,
  stripe_customer_id text,
  profile_tier text,
  membership_tier text,
  is_founding_member boolean,
  neuros_tier text,
  member_created_at timestamptz,
  onboarding_call_status text,
  is_approved boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $func$
  with params as (
    select
      nullif(btrim(coalesce(q, '')), '') as q_raw,
      (
        '%' || replace(
          replace(
            replace(lower(btrim(coalesce(q, ''))), chr(92), chr(92) || chr(92)),
            '%',
            chr(92) || '%'
          ),
          '_',
          chr(92) || '_'
        ) || '%'
      ) as like_pat,
      nullif(lower(btrim(coalesce(role_filter, ''))), '') as role_norm,
      nullif(lower(btrim(coalesce(status_filter, ''))), '') as status_norm,
      nullif(lower(btrim(coalesce(state_code, ''))), '') as state_norm,
      nullif(lower(btrim(coalesce(country_code, ''))), '') as country_norm,
      case when lower(btrim(coalesce(sort, ''))) = 'recent' then 'recent' else 'name' end as sort_norm,
      least(greatest(coalesce(page_size, 25), 1), 25) as size,
      (greatest(coalesce(page, 1), 1) - 1) * least(greatest(coalesce(page_size, 25), 1), 25) as off
  ),
  filtered as (
    select
      d.id,
      'doctor'::text as member_role,
      btrim(coalesce(d.first_name, '') || ' ' || coalesce(d.last_name, '')) as full_name,
      d.email,
      d.clinic_name as practice,
      d.city,
      d.state as member_state,
      d.country as member_country,
      d.verification_status::text as verification_status,
      coalesce(d.updated_at, d.created_at) as last_activity,
      d.slug,
      d.user_id,
      pr.stripe_customer_id,
      pr.tier as profile_tier,
      d.membership_tier::text as membership_tier,
      d.is_founding_member,
      d.neuros_tier,
      d.created_at as member_created_at,
      d.onboarding_call_status,
      d.is_approved
    from public.doctors d
    left join public.profiles pr on pr.id = d.user_id
    where (
      (select role_norm from params) is null
      or (select role_norm from params) = 'doctor'
    )
    and (
      (select status_norm from params) is null
      or ((select status_norm from params) = 'verified' and d.verification_status::text = 'verified')
      or ((select status_norm from params) = 'pending' and d.verification_status::text = 'pending')
      or ((select status_norm from params) = 'hidden' and d.verification_status::text in ('hidden', 'rejected'))
      or (
        (select status_norm from params) = 'onboarding'
        and d.onboarding_call_status is distinct from 'completed'
        and d.is_approved is not true
        and d.is_founding_member is not true
      )
    )
    and (
      (select state_norm from params) is null
      or lower(d.state) = (select state_norm from params)
    )
    and (
      (select country_norm from params) is null
      or lower(d.country) = (select country_norm from params)
    )
    and (
      (select q_raw from params) is null
      or lower(d.first_name) like (select like_pat from params) escape chr(92)
      or lower(d.last_name) like (select like_pat from params) escape chr(92)
      or lower(d.email) like (select like_pat from params) escape chr(92)
      or lower(d.clinic_name) like (select like_pat from params) escape chr(92)
      or lower(d.city) like (select like_pat from params) escape chr(92)
      or lower(d.state) like (select like_pat from params) escape chr(92)
    )
    union all
    select
      p.id,
      p.role as member_role,
      coalesce(nullif(btrim(p.full_name), ''), p.email) as full_name,
      p.email,
      null::text as practice,
      null::text as city,
      null::text as member_state,
      null::text as member_country,
      null::text as verification_status,
      coalesce(p.updated_at, p.created_at) as last_activity,
      null::text as slug,
      p.id as user_id,
      p.stripe_customer_id,
      p.tier as profile_tier,
      null::text as membership_tier,
      null::boolean as is_founding_member,
      null::text as neuros_tier,
      p.created_at as member_created_at,
      null::text as onboarding_call_status,
      null::boolean as is_approved
    from public.profiles p
    where p.role in ('student', 'vendor')
    and (
      (select role_norm from params) is null
      or p.role = (select role_norm from params)
    )
    and (select status_norm from params) is null
    and (select state_norm from params) is null
    and (select country_norm from params) is null
    and (
      (select q_raw from params) is null
      or lower(p.full_name) like (select like_pat from params) escape chr(92)
      or lower(p.email) like (select like_pat from params) escape chr(92)
    )
  ),
  paged as (
    select
      filtered.*,
      count(*) over () as total_count
    from filtered
    order by
      case when (select sort_norm from params) = 'recent' then last_activity end desc nulls last,
      lower(coalesce(full_name, '')) asc,
      id asc
    limit (select size from params)
    offset (select off from params)
  )
  select * from paged
  union all
  select
    null::uuid,
    null::text,
    null::text,
    null::text,
    null::text,
    null::text,
    null::text,
    null::text,
    null::text,
    null::timestamptz,
    null::text,
    null::uuid,
    null::text,
    null::text,
    null::text,
    null::boolean,
    null::text,
    null::timestamptz,
    null::text,
    null::boolean,
    (select count(*) from filtered)
  where not exists (select 1 from paged);
$func$;

revoke all on function public.admin_search_members(text, text, text, text, text, integer, integer, text) from public;
revoke execute on function public.admin_search_members(text, text, text, text, text, integer, integer, text) from anon, authenticated;
grant execute on function public.admin_search_members(text, text, text, text, text, integer, integer, text) to service_role;

-- CHECK AFTER
-- select indexname from pg_indexes
-- where schemaname = 'public'
--   and indexname in (
--     'doctors_first_name_trgm_idx',
--     'doctors_last_name_trgm_idx',
--     'doctors_clinic_name_trgm_idx',
--     'doctors_email_trgm_idx',
--     'doctors_city_trgm_idx',
--     'doctors_state_trgm_idx',
--     'profiles_full_name_trgm_idx',
--     'profiles_email_trgm_idx'
--   );
-- explain analyze select id from doctors where lower(last_name) like '%smi%';
