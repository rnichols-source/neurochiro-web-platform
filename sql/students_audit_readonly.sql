-- NOT RUN — Raymond reviews and runs
-- Read-only. Do not add INSERT, UPDATE, DELETE, or DDL.

select tier, count(*) as students
from public.profiles
where role = 'student'
group by tier
order by students desc;

select id, created_at, tier
from public.profiles
where role = 'student'
  and created_at > now() - interval '90 days'
order by created_at desc
limit 200;

select status, count(*) as posts
from public.job_postings
group by status
order by posts desc;

create or replace function pg_temp.safe_count(tbl text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  if to_regclass(tbl) is null then return null; end if;
  execute format('select count(*) from %s', tbl) into n;
  return n;
end $$;

select
  pg_temp.safe_count('public.job_applications') as job_applications,
  pg_temp.safe_count('public.applications') as applications,
  pg_temp.safe_count('public.match_cycles') as match_cycles,
  pg_temp.safe_count('public.match_rankings') as match_rankings;

select role, count(*) as people, min(created_at) as first_seen, max(created_at) as last_seen
from public.profiles
where role in ('admin','super_admin','founder','regional_admin')
  and created_at > now() - interval '180 days'
group by role
order by role;
