-- NOT RUN — Raymond reviews and runs

-- Depends on 20261101120000_admin_member_search.sql and 20261101180000_admin_member_search_tokens.sql.
-- Production already has the corrected v1 function. This file does not replace it.
-- doctors has no updated_at. Doctor last_activity and member_created_at are created_at.
-- doctors.zip_code is missing in production until the ALTER below runs.
-- Run that ALTER before the commented zip counts if the column is missing.
-- Do not index unaccent(lower(...)).

-- CHECK FIRST. Counts only. No personal data.
-- Raymond: run `alter table public.doctors add column if not exists zip_code text;`
-- before these counts when zip_code is not already there.
-- select count(*) total,
--        count(*) filter (where nullif(btrim(zip_code),'') is not null) with_zip,
--        count(*) filter (where nullif(btrim(address),'') is not null) with_address,
--        count(*) filter (where nullif(btrim(country),'') is null) no_country
--   from doctors;
-- select country, count(*) from doctors group by 1 order by 2 desc;
-- select length(state) len, count(*) from doctors group by 1 order by 1;
-- select state, count(*) from doctors where length(state) > 3 group by 1 order by 2 desc;
-- select count(*) from zip_codes; select country, count(*) from zip_codes group by 1;

alter table public.doctors add column if not exists zip_code text;

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create index if not exists doctors_zip_code_trgm_idx
  on public.doctors using gin ((lower(zip_code)) gin_trgm_ops);

create index if not exists doctors_country_trgm_idx
  on public.doctors using gin ((lower(country)) gin_trgm_ops);

create index if not exists doctors_address_trgm_idx
  on public.doctors using gin ((lower(address)) gin_trgm_ops);

create index if not exists doctors_zip_code_compact_idx
  on public.doctors ((upper(replace(zip_code, ' ', ''))));

create or replace function public.admin_search_members_v2(
  q_tokens text[] default null,
  postal_compact text default null,
  postal_prefix boolean default false,
  city_name text default null,
  state_values text[] default null,
  country_values text[] default null,
  include_null_country boolean default false,
  role_filter text default null,
  status_filter text default null,
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
  zip_code text,
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
      nullif(btrim(coalesce(postal_compact, '')), '') as postal_norm,
      coalesce(postal_prefix, false) as postal_prefix_norm,
      nullif(btrim(coalesce(city_name, '')), '') as city_norm,
      state_values as state_vals,
      country_values as country_vals,
      coalesce(include_null_country, false) as include_null,
      nullif(lower(btrim(coalesce(role_filter, ''))), '') as role_norm,
      nullif(lower(btrim(coalesce(status_filter, ''))), '') as status_norm,
      case
        when lower(btrim(coalesce(sort, ''))) = 'recent' then 'recent'
        when lower(btrim(coalesce(sort, ''))) = 'newest' then 'newest'
        else 'name'
      end as sort_norm,
      least(greatest(coalesce(page_size, 25), 1), 25) as size,
      (greatest(coalesce(page, 1), 1) - 1) * least(greatest(coalesce(page_size, 25), 1), 25) as off,
      (
        nullif(btrim(coalesce(postal_compact, '')), '') is not null
        or nullif(btrim(coalesce(city_name, '')), '') is not null
        or coalesce(cardinality(state_values), 0) > 0
        or coalesce(cardinality(country_values), 0) > 0
        or coalesce(include_null_country, false)
      ) as location_on
  ),
  tokens as (
    select pat
    from (
      select
        replace(
          replace(
            replace(unaccent(lower(btrim(token))), chr(92), chr(92) || chr(92)),
            '%',
            chr(92) || '%'
          ),
          '_',
          chr(92) || '_'
        ) as pat,
        ord
      from unnest(coalesce(q_tokens, array[]::text[])) with ordinality as split(token, ord)
    ) raw
    where pat <> ''
    order by ord
    limit 4
  ),
  matched as (
    select
      d.id,
      'doctor'::text as member_role,
      btrim(coalesce(d.first_name, '') || ' ' || coalesce(d.last_name, '')) as full_name,
      d.email,
      d.clinic_name as practice,
      d.city,
      d.state as member_state,
      d.country as member_country,
      d.zip_code,
      d.verification_status::text as verification_status,
      d.created_at as last_activity,
      d.slug,
      d.user_id,
      pr.stripe_customer_id,
      pr.tier::text as profile_tier,
      d.membership_tier::text as membership_tier,
      d.is_founding_member,
      d.neuros_tier,
      d.created_at as member_created_at,
      d.onboarding_call_status,
      d.is_approved,
      d.last_name as sort_last,
      d.first_name as sort_first
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
      coalesce(cardinality((select state_vals from params)), 0) = 0
      or upper(d.state) in (
        select upper(btrim(v))
        from unnest((select state_vals from params)) as v
        where btrim(coalesce(v, '')) <> ''
      )
    )
    and (
      (
        coalesce(cardinality((select country_vals from params)), 0) = 0
        and (select include_null from params) is not true
      )
      or upper(d.country) in (
        select upper(btrim(v))
        from unnest(coalesce((select country_vals from params), array[]::text[])) as v
        where btrim(coalesce(v, '')) <> ''
      )
      or ((select include_null from params) is true and d.country is null)
    )
    and (
      (select city_norm from params) is null
      or unaccent(lower(coalesce(d.city, ''))) = unaccent(lower((select city_norm from params)))
    )
    and (
      (select postal_norm from params) is null
      or upper(replace(coalesce(d.zip_code, ''), ' ', '')) like (
        replace(
          replace(
            replace(upper(replace((select postal_norm from params), ' ', '')), chr(92), chr(92) || chr(92)),
            '%',
            chr(92) || '%'
          ),
          '_',
          chr(92) || '_'
        ) || '%'
      ) escape chr(92)
      or (
        (select postal_prefix_norm from params) is true
        and lower(coalesce(d.address, '')) like (
          '% ' || replace(
            replace(
              replace(lower((select postal_norm from params)), chr(92), chr(92) || chr(92)),
              '%',
              chr(92) || '%'
            ),
            '_',
            chr(92) || '_'
          ) || '%'
        ) escape chr(92)
      )
      or (
        (select postal_prefix_norm from params) is not true
        and lower(coalesce(d.address, '')) like (
          '%' || replace(
            replace(
              replace(lower((select postal_norm from params)), chr(92), chr(92) || chr(92)),
              '%',
              chr(92) || '%'
            ),
            '_',
            chr(92) || '_'
          ) || '%'
        ) escape chr(92)
      )
    )
    and not exists (
      select 1
      from tokens
      where not (
        unaccent(lower(coalesce(d.first_name, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.last_name, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.clinic_name, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.email, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.city, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.state, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.zip_code, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.country, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(d.slug, ''))) like ('%' || tokens.pat || '%') escape chr(92)
      )
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
      null::text as zip_code,
      null::text as verification_status,
      coalesce(p.updated_at, p.created_at) as last_activity,
      null::text as slug,
      p.id as user_id,
      p.stripe_customer_id,
      p.tier::text as profile_tier,
      null::text as membership_tier,
      null::boolean as is_founding_member,
      null::text as neuros_tier,
      p.created_at as member_created_at,
      null::text as onboarding_call_status,
      null::boolean as is_approved,
      coalesce(nullif(btrim(p.full_name), ''), p.email) as sort_last,
      ''::text as sort_first
    from public.profiles p
    where p.role in ('student', 'vendor')
    and (select location_on from params) is not true
    and (
      (select role_norm from params) is null
      or p.role = (select role_norm from params)
    )
    and (select status_norm from params) is null
    and not exists (
      select 1
      from tokens
      where not (
        unaccent(lower(coalesce(p.full_name, ''))) like ('%' || tokens.pat || '%') escape chr(92)
        or unaccent(lower(coalesce(p.email, ''))) like ('%' || tokens.pat || '%') escape chr(92)
      )
    )
  ),
  paged as (
    select
      id,
      member_role,
      full_name,
      email,
      practice,
      city,
      member_state,
      member_country,
      zip_code,
      verification_status,
      last_activity,
      slug,
      user_id,
      stripe_customer_id,
      profile_tier,
      membership_tier,
      is_founding_member,
      neuros_tier,
      member_created_at,
      onboarding_call_status,
      is_approved,
      total_count
    from (
      select
        matched.*,
        count(*) over () as total_count
      from matched
    ) counted
    order by
      case when (select sort_norm from params) = 'recent' then last_activity end desc nulls last,
      case when (select sort_norm from params) = 'newest' then member_created_at end desc nulls last,
      lower(coalesce(sort_last, '')) asc,
      lower(coalesce(sort_first, '')) asc,
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
    (select count(*) from matched)
  where not exists (select 1 from paged);
$func$;

revoke all on function public.admin_search_members_v2(text[], text, boolean, text, text[], text[], boolean, text, text, integer, integer, text) from public;
revoke execute on function public.admin_search_members_v2(text[], text, boolean, text, text[], text[], boolean, text, text, integer, integer, text) from anon, authenticated;
grant execute on function public.admin_search_members_v2(text[], text, boolean, text, text[], text[], boolean, text, text, integer, integer, text) to service_role;
