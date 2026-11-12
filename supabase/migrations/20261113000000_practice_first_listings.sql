-- Practice-first directory listings.
-- listing_format 'lead' (default) keeps today's page: the doctor name is the title.
-- listing_format 'practice' makes the practice name the title and renders co_owners
-- with equal billing. This does not change existing rows and does not enable RLS.
-- profile_style = 'practice' is a different, older layout and is left alone.
--
-- After this migration is applied, mark an office with
-- scripts/rise-wellness-practice-listing.sql. That script is not run here.

begin;

alter table public.doctors
  add column if not exists listing_format text not null default 'lead';

alter table public.doctors
  drop constraint if exists doctors_listing_format_check;

alter table public.doctors
  add constraint doctors_listing_format_check
  check (listing_format in ('lead', 'practice'));

alter table public.doctors
  add column if not exists co_owners jsonb not null default '[]'::jsonb;

alter table public.doctors
  add column if not exists co_owner_search text
  generated always as (co_owners::text) stored;

commit;
