-- NOT RUN — Raymond reviews and runs
-- billing-geo-fixes: allow NULL coordinates, drop the 0 default, clear 0,0 pins, add profiles.payment_issue_since.
-- Safe to run more than once.

-- ===================== CHECK FIRST =====================
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'doctors'  and column_name in ('latitude','longitude','subscription_status'))
    or (table_name = 'profiles' and column_name in ('subscription_status','student_past_due_since','payment_issue_since')));

select count(*) as doctors_at_0_0      from public.doctors where latitude = 0 and longitude = 0;
select count(*) as doctors_null_coords from public.doctors where latitude is null or longitude is null;
select verification_status, count(*)   from public.doctors where latitude = 0 and longitude = 0 group by 1;
-- Note the two counts above. After running, null_coords should equal old null_coords + old 0,0 count.

-- ===================== CHANGE =====================
begin;
-- No-ops if the columns are already nullable or have no default:
alter table public.doctors alter column latitude  drop not null;
alter table public.doctors alter column longitude drop not null;
alter table public.doctors alter column latitude  drop default;
alter table public.doctors alter column longitude drop default;

update public.doctors
   set latitude = null, longitude = null
 where latitude = 0 and longitude = 0;

alter table public.profiles add column if not exists payment_issue_since timestamptz;
commit;

-- Optional, after the app fix is deployed: block future 0,0 writes.
-- do $$ begin
--   if not exists (select 1 from pg_constraint where conname = 'doctors_no_zero_coords') then
--     alter table public.doctors add constraint doctors_no_zero_coords
--       check (not (latitude = 0 and longitude = 0)) not valid;
--   end if;
-- end $$;

-- ===================== CHECK AFTER =====================
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'doctors' and column_name in ('latitude','longitude');
-- expect is_nullable = YES, column_default = NULL

select count(*) as doctors_at_0_0_after from public.doctors where latitude = 0 and longitude = 0;  -- expect 0
select count(*) as doctors_null_coords_after from public.doctors where latitude is null or longitude is null;
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'payment_issue_since';  -- expect 1 row
