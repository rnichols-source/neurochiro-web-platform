-- NOT RUN — Raymond reviews and runs
-- Read-only inventory of public tables, grants, policies, definer functions, views, and storage buckets.
-- Paste the result back. Do not run the lockdown migration from this file.

-- CHECK FIRST: every public table, RLS on and forced.
select n.nspname as schema, c.relname as table, c.relkind, c.relrowsecurity as rls_on, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p')
order by 2;

-- CHECK FIRST: every policy.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by 2, 3;

-- CHECK FIRST: table grants for anon and authenticated.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
group by 1, 2
order by 1, 2;

-- CHECK FIRST: column grants for anon and authenticated.
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon','authenticated')
order by 1, 2, 3, 4;

-- CHECK FIRST: security definer functions and whether anon can execute them.
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- CHECK FIRST: views and security_invoker.
select c.relname as view_name,
       coalesce((c.reloptions::text like '%security_invoker=true%'), false) as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by 1;

-- CHECK FIRST: storage buckets. public = true means the object URL works without a signature.
select id, public from storage.buckets order by 1;
