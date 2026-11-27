-- NOT APPLIED.
-- Backfill nearest_distance_mi for demand mentions that have coordinates
-- but no measured distance. Uses live verified doctors (not hidden, not test).
-- Do not run this against production until it has been reviewed.
-- Mentions with no latitude or longitude stay unmeasured.

update public.demand_mentions as mention
set nearest_distance_mi = round(nearest.miles::numeric, 1)
from (
  select
    ask.id,
    (
      select min(
        3958.8 * acos(least(1::float8, greatest(-1::float8,
          cos(radians(ask.lat)) * cos(radians(doctor.latitude))
          * cos(radians(doctor.longitude) - radians(ask.lng))
          + sin(radians(ask.lat)) * sin(radians(doctor.latitude))
        )))
      )
      from public.doctors as doctor
      where doctor.verification_status = 'verified'
        and coalesce(doctor.is_test, false) = false
        and doctor.latitude is not null
        and doctor.longitude is not null
        and doctor.latitude <> 0
        and doctor.longitude <> 0
    ) as miles
  from public.demand_mentions as ask
  where ask.nearest_distance_mi is null
    and ask.lat is not null
    and ask.lng is not null
    and ask.lat <> 0
    and ask.lng <> 0
) as nearest
where mention.id = nearest.id
  and nearest.miles is not null;
