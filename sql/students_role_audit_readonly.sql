-- NOT RUN — Raymond reviews and runs
-- Read-only list of admin-like profiles so Raymond can check the signup allowlist.

select id, role, created_at
from public.profiles
where role in ('admin', 'super_admin', 'founder', 'regional_admin')
   or role ilike '%admin%'
order by created_at desc;
