-- Nearest doctors for a referral search. Ordered by distance in SQL so a wide
-- box cannot crowd out someone a few miles away. Service role only.

create or replace function public.referral_doctors_near(
  origin_lat double precision,
  origin_lng double precision,
  radius_miles double precision,
  row_cap integer,
  exclude_id uuid,
  country_iso text default 'ALL'
)
returns table (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  clinic_name text,
  city text,
  state text,
  country text,
  slug text,
  photo_url text,
  specialties text[],
  latitude double precision,
  longitude double precision,
  accepting_new_patients boolean,
  membership_tier text,
  is_founding_member boolean,
  neuros_tier text,
  created_at timestamptz,
  verification_status text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id,
    d.user_id,
    d.first_name,
    d.last_name,
    d.clinic_name,
    d.city,
    d.state,
    d.country,
    d.slug,
    d.photo_url,
    d.specialties,
    d.latitude::double precision,
    d.longitude::double precision,
    d.accepting_new_patients,
    d.membership_tier::text,
    d.is_founding_member,
    d.neuros_tier::text,
    d.created_at,
    d.verification_status::text
  from public.doctors d
  where d.id is distinct from exclude_id
    and d.latitude is not null
    and d.longitude is not null
    and d.latitude between origin_lat - (radius_miles / 69.0) and origin_lat + (radius_miles / 69.0)
    and d.longitude between
      origin_lng - (radius_miles / (69.0 * greatest(cos(radians(origin_lat)), 0.01)))
      and origin_lng + (radius_miles / (69.0 * greatest(cos(radians(origin_lat)), 0.01)))
    and (
      3959 * acos(least(1.0, greatest(-1.0,
        cos(radians(origin_lat)) * cos(radians(d.latitude::double precision))
        * cos(radians(d.longitude::double precision) - radians(origin_lng))
        + sin(radians(origin_lat)) * sin(radians(d.latitude::double precision))
      )))
    ) <= radius_miles
    and (
      country_iso is null
      or country_iso = 'ALL'
      or (
        country_iso = 'US'
        and (d.country is null or upper(d.country) in ('US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'))
      )
      or (
        country_iso = 'GB'
        and upper(coalesce(d.country, '')) in ('GB', 'UK', 'UNITED KINGDOM', 'GREAT BRITAIN')
      )
      or (
        country_iso = 'AU'
        and upper(coalesce(d.country, '')) in ('AU', 'AUS', 'AUSTRALIA')
      )
      or (
        country_iso = 'CA'
        and upper(coalesce(d.country, '')) in ('CA', 'CANADA')
      )
      or upper(coalesce(d.country, '')) = upper(country_iso)
    )
  order by (
    3959 * acos(least(1.0, greatest(-1.0,
      cos(radians(origin_lat)) * cos(radians(d.latitude::double precision))
      * cos(radians(d.longitude::double precision) - radians(origin_lng))
      + sin(radians(origin_lat)) * sin(radians(d.latitude::double precision))
    )))
  )
  limit greatest(coalesce(row_cap, 200), 200);
$$;

revoke all on function public.referral_doctors_near(double precision, double precision, double precision, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.referral_doctors_near(double precision, double precision, double precision, integer, uuid, text) to service_role;
