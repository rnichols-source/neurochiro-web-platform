-- Name and clinic search uses ILIKE. A trigram index keeps those lookups off a full scan.
-- The coordinate index serves the nearby box. No new tables, so no new policies.

create extension if not exists pg_trgm;

create index if not exists doctors_referral_first_name_trgm
  on public.doctors using gin (first_name gin_trgm_ops);

create index if not exists doctors_referral_last_name_trgm
  on public.doctors using gin (last_name gin_trgm_ops);

create index if not exists doctors_referral_clinic_name_trgm
  on public.doctors using gin (clinic_name gin_trgm_ops);

create index if not exists doctors_referral_lat_lng
  on public.doctors (latitude, longitude);
