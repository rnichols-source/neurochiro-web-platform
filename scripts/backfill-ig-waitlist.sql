-- MANUAL BACKFILL. Do not put this file in supabase/migrations.
-- Nothing in the app runs this file.
--
-- Run it by hand in the Supabase SQL editor for project gddapefwrmucimpdhjrz
-- AFTER supabase/migrations/20261115120000_ig_waitlist_mentions.sql.
--
-- Copies Instagram demand_mentions into ig_waitlist when the location is a
-- city or a zip with coordinates. Country-level and state-level places are
-- skipped. Rows are deduped by Instagram handle, or by display name plus
-- city/state/country when there is no handle.
--
-- Safe to run more than once. Does not send comments or DMs.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ig_waitlist'
      and column_name = 'source_mention_id'
  ) then
    raise exception 'Apply supabase/migrations/20261115120000_ig_waitlist_mentions.sql before this backfill.';
  end if;
end $$;

drop table if exists pg_temp.ig_waitlist_backfill_candidates;

create temporary table ig_waitlist_backfill_candidates on commit drop as
with state_names(name, code) as (
  values
    ('alabama', 'AL'),
    ('alaska', 'AK'),
    ('arizona', 'AZ'),
    ('arkansas', 'AR'),
    ('california', 'CA'),
    ('colorado', 'CO'),
    ('connecticut', 'CT'),
    ('delaware', 'DE'),
    ('florida', 'FL'),
    ('georgia', 'GA'),
    ('hawaii', 'HI'),
    ('idaho', 'ID'),
    ('illinois', 'IL'),
    ('indiana', 'IN'),
    ('iowa', 'IA'),
    ('kansas', 'KS'),
    ('kentucky', 'KY'),
    ('louisiana', 'LA'),
    ('maine', 'ME'),
    ('maryland', 'MD'),
    ('massachusetts', 'MA'),
    ('michigan', 'MI'),
    ('minnesota', 'MN'),
    ('mississippi', 'MS'),
    ('missouri', 'MO'),
    ('montana', 'MT'),
    ('nebraska', 'NE'),
    ('nevada', 'NV'),
    ('new hampshire', 'NH'),
    ('new jersey', 'NJ'),
    ('new mexico', 'NM'),
    ('new york', 'NY'),
    ('north carolina', 'NC'),
    ('north dakota', 'ND'),
    ('ohio', 'OH'),
    ('oklahoma', 'OK'),
    ('oregon', 'OR'),
    ('pennsylvania', 'PA'),
    ('rhode island', 'RI'),
    ('south carolina', 'SC'),
    ('south dakota', 'SD'),
    ('tennessee', 'TN'),
    ('texas', 'TX'),
    ('utah', 'UT'),
    ('vermont', 'VT'),
    ('virginia', 'VA'),
    ('washington', 'WA'),
    ('washington', 'DC'),
    ('west virginia', 'WV'),
    ('wisconsin', 'WI'),
    ('wyoming', 'WY'),
    ('district of columbia', 'DC'),
    ('ontario', 'ON'),
    ('quebec', 'QC'),
    ('québec', 'QC'),
    ('british columbia', 'BC'),
    ('alberta', 'AB'),
    ('manitoba', 'MB'),
    ('saskatchewan', 'SK'),
    ('nova scotia', 'NS'),
    ('new brunswick', 'NB'),
    ('newfoundland and labrador', 'NL'),
    ('prince edward island', 'PE'),
    ('england', 'ENG'),
    ('scotland', 'SCT'),
    ('wales', 'WLS'),
    ('northern ireland', 'NIR')
),
country_centroids(lat, lng) as (
  values
    (39.833, -98.583),
    (55.378, -3.436),
    (56.130, -106.347),
    (-25.274, 133.775),
    (-30.559, 22.937),
    (23.424, 53.848),
    (9.082, 8.675),
    (20.594, 78.963),
    (51.166, 10.452),
    (36.204, 138.253),
    (23.635, -102.553),
    (46.818, 8.228),
    (10.692, -61.223),
    (56.264, 9.502),
    (60.128, 18.644),
    (46.228, 2.214),
    (39.400, -8.225),
    (-0.024, 37.907),
    (38.964, 35.243),
    (42.734, 25.486),
    (45.100, 15.200),
    (30.376, 69.345),
    (41.512, 21.745),
    (12.880, 121.774),
    (-13.134, 27.849),
    (1.352, 103.820),
    (23.886, 45.080),
    (-19.015, 29.155),
    (-35.675, -71.543),
    (-40.901, 174.886),
    (31.792, -7.092)
),
mentions as (
  select
    m.id,
    m.city,
    m.state,
    m.country,
    m.lat,
    m.lng,
    m.notes,
    m.post_ref,
    m.mentioned_on,
    m.created_at,
    m.instagram_handle,
    m.commenter_handle,
    nullif(btrim(split_part(coalesce(m.notes, ''), '; ', 3)), '') as place
  from public.demand_mentions m
  where m.source in ('instagram', 'instagram_comment')
    and m.lat is not null
    and m.lng is not null
    and not (m.lat = 0 and m.lng = 0)
    and btrim(m.city) <> ''
),
marked as (
  select
    mentions.*,
    nullif(substring(coalesce(place, '') from '([0-9]{5})(?:-[0-9]{4})?'), '') as us_zip,
    nullif(upper(regexp_replace(substring(coalesce(place, '') from '([A-Za-z][0-9][A-Za-z][ -]?[0-9][A-Za-z][0-9])'), '\s+', '', 'g')), '') as ca_postal,
    lower(regexp_replace(btrim(coalesce(instagram_handle, '')), '^@+', '')) as stored_handle,
    lower(regexp_replace(btrim(coalesce(commenter_handle, '')), '^@+', '')) as commenter_key,
    nullif(btrim(commenter_handle), '') as display_name
  from mentions
),
precise as (
  select
    marked.*,
    case
      when stored_handle ~ '^[a-z0-9._]{1,30}$' then stored_handle
      when commenter_key ~ '^[a-z0-9._]{1,30}$' then commenter_key
      else null
    end as ig_handle
  from marked
  where lower(btrim(city)) not in (
      'usa', 'us', 'united states', 'united states of america', 'america',
      'canada', 'uk', 'u.k.', 'united kingdom', 'great britain', 'britain',
      'australia', 'germany', 'deutschland', 'croatia', 'ireland',
      'france', 'india', 'mexico', 'new zealand',
      'south africa', 'nigeria', 'pakistan', 'philippines', 'japan', 'brazil',
      'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark',
      'switzerland', 'belgium', 'portugal', 'austria', 'poland', 'greece',
      'turkey', 'israel', 'singapore', 'malaysia', 'indonesia', 'worldwide',
      'global', 'europe', 'africa', 'asia'
    )
    and not exists (
      select 1
      from country_centroids centroid
      where round(marked.lat::numeric, 3) = centroid.lat
        and round(marked.lng::numeric, 3) = centroid.lng
    )
    and not (
      exists (
        select 1
        from state_names region
        where lower(btrim(marked.city)) = region.name
          and (
            upper(btrim(marked.state)) = region.code
            or lower(btrim(marked.state)) = region.name
            or lower(btrim(coalesce(marked.state, ''))) like '%' || region.name || '%'
          )
      )
      and marked.us_zip is null
      and marked.ca_postal is null
      and coalesce(marked.place, '') !~ ','
      and not (
        (lower(btrim(marked.city)) = 'washington' and upper(btrim(marked.state)) = 'MO')
        or (lower(btrim(marked.city)) = 'nevada' and upper(btrim(marked.state)) = 'MO')
        or (lower(btrim(marked.city)) = 'ontario' and upper(btrim(marked.state)) = 'CA' and upper(coalesce(marked.country, '')) in ('US', 'USA'))
        or (lower(btrim(marked.city)) = 'wales' and upper(btrim(marked.state)) = 'MA')
      )
      and (
        marked.notes is not null
        or lower(btrim(marked.state)) = lower(btrim(marked.city))
        or lower(btrim(coalesce(marked.state, ''))) like '%' || lower(btrim(marked.city)) || '%'
      )
    )
),
keyed as (
  select
    precise.*,
    case
      when ig_handle is not null then 'h:' || ig_handle
      else 'n:' || lower(btrim(coalesce(display_name, ''))) || '|' || lower(btrim(city)) || '|' || upper(btrim(coalesce(state, ''))) || '|' || upper(btrim(coalesce(country, '')))
    end as dedupe_key,
    case when post_ref like 'http%' then post_ref else null end as comment_url,
    case when post_ref like 'thread:%' then post_ref else null end as dm_thread_url
  from precise
  where ig_handle is not null or nullif(btrim(coalesce(display_name, '')), '') is not null
),
ranked as (
  select
    keyed.*,
    row_number() over (
      partition by dedupe_key
      order by
        (us_zip is not null or ca_postal is not null) desc,
        (comment_url is not null) desc,
        mentioned_on desc nulls last,
        created_at desc nulls last,
        id
    ) as pick
  from keyed
),
winner as (
  select *
  from ranked
  where pick = 1
),
urls as (
  select
    dedupe_key,
    max(comment_url) as comment_url,
    max(dm_thread_url) as dm_thread_url
  from keyed
  group by dedupe_key
)
select
  winner.id as source_mention_id,
  winner.ig_handle,
  coalesce(winner.display_name, winner.ig_handle) as display_name,
  winner.city,
  nullif(btrim(winner.state), '') as state,
  coalesce(winner.us_zip, winner.ca_postal) as zip,
  nullif(btrim(winner.country), '') as country,
  winner.lat as latitude,
  winner.lng as longitude,
  coalesce(winner.place, concat_ws(', ', winner.city, nullif(btrim(winner.state), ''), coalesce(winner.us_zip, winner.ca_postal))) as location_raw,
  coalesce(winner.mentioned_on::timestamptz, winner.created_at) as requested_at,
  urls.comment_url,
  urls.dm_thread_url
from winner
join urls on urls.dedupe_key = winner.dedupe_key;

update public.ig_waitlist as waitlist
set
  display_name = coalesce(waitlist.display_name, candidate.display_name),
  name = coalesce(waitlist.name, candidate.display_name),
  comment_url = coalesce(waitlist.comment_url, candidate.comment_url),
  dm_thread_url = coalesce(waitlist.dm_thread_url, candidate.dm_thread_url),
  source_mention_id = coalesce(waitlist.source_mention_id, candidate.source_mention_id),
  city = coalesce(waitlist.city, candidate.city),
  state = coalesce(waitlist.state, candidate.state),
  zip = coalesce(waitlist.zip, candidate.zip),
  country = coalesce(waitlist.country, candidate.country),
  latitude = coalesce(waitlist.latitude, candidate.latitude),
  longitude = coalesce(waitlist.longitude, candidate.longitude),
  location_raw = coalesce(waitlist.location_raw, candidate.location_raw)
from ig_waitlist_backfill_candidates as candidate
where waitlist.ig_handle is not null
  and candidate.ig_handle is not null
  and lower(waitlist.ig_handle) = candidate.ig_handle
  and not exists (
    select 1
    from public.ig_waitlist as other
    where other.source_mention_id = candidate.source_mention_id
      and other.id <> waitlist.id
  );

insert into public.ig_waitlist (
  ig_handle,
  name,
  display_name,
  city,
  state,
  zip,
  country,
  latitude,
  longitude,
  location_raw,
  requested_at,
  status,
  comment_url,
  dm_thread_url,
  source_mention_id,
  flagged_business
)
select
  candidate.ig_handle,
  candidate.display_name,
  candidate.display_name,
  candidate.city,
  candidate.state,
  candidate.zip,
  candidate.country,
  candidate.latitude,
  candidate.longitude,
  candidate.location_raw,
  candidate.requested_at,
  'waiting',
  candidate.comment_url,
  candidate.dm_thread_url,
  candidate.source_mention_id,
  false
from ig_waitlist_backfill_candidates as candidate
where not exists (
  select 1
  from public.ig_waitlist as waitlist
  where waitlist.source_mention_id = candidate.source_mention_id
    or (
      candidate.ig_handle is not null
      and waitlist.ig_handle is not null
      and lower(waitlist.ig_handle) = candidate.ig_handle
    )
    or (
      candidate.ig_handle is null
      and lower(btrim(coalesce(waitlist.display_name, waitlist.name, ''))) = lower(btrim(coalesce(candidate.display_name, '')))
      and lower(btrim(coalesce(waitlist.city, ''))) = lower(btrim(coalesce(candidate.city, '')))
      and upper(btrim(coalesce(waitlist.state, ''))) = upper(btrim(coalesce(candidate.state, '')))
      and upper(btrim(coalesce(waitlist.country, ''))) = upper(btrim(coalesce(candidate.country, '')))
    )
);

commit;
