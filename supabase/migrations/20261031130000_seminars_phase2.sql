-- NeuroChiro Seminars phase 2
-- NOT YET RUN — awaiting Raymond's approval. Run after phase 1.
-- Additive only. Does not copy or alter host_profiles.
-- host_profiles already exists (organization_name, host_type, logo_url, website_url, user_id).
-- seminar_hosts is the new application record. No rows are copied until you say so.

begin;

create table if not exists public.seminar_hosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  display_name text,
  org_name text,
  doctor_id uuid,
  bio text,
  website text,
  instagram text,
  logo_url text,
  topics text[] default '{}',
  status text not null default 'applied',
  application jsonb,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seminar_hosts_status_check') then
    alter table public.seminar_hosts
      add constraint seminar_hosts_status_check
      check (status in ('applied', 'approved', 'rejected', 'suspended'));
  end if;
end $$;

alter table public.seminar_hosts enable row level security;

grant select (
  id, user_id, display_name, org_name, doctor_id, bio, website, instagram, logo_url, topics, status, created_at
) on public.seminar_hosts to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminar_hosts' and policyname = 'Hosts read own application') then
    create policy "Hosts read own application"
      on public.seminar_hosts
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

create table if not exists public.host_packages (
  id uuid primary key default gen_random_uuid(),
  host_id uuid,
  user_id uuid,
  package_id text not null,
  stripe_checkout_session_id text unique,
  stripe_subscription_id text,
  seminars_total integer not null default 0,
  seminars_used integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.host_packages enable row level security;

grant select (
  id, host_id, user_id, package_id, seminars_total, seminars_used, starts_at, expires_at, status, created_at
) on public.host_packages to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'host_packages' and policyname = 'Hosts read own packages') then
    create policy "Hosts read own packages"
      on public.host_packages
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- stripe_checkout_session_id WITHHELD
create table if not exists public.seminar_featured_purchases (
  id uuid primary key default gen_random_uuid(),
  seminar_id uuid not null references public.seminars (id),
  host_id uuid,
  user_id uuid,
  stripe_checkout_session_id text unique,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.seminar_featured_purchases enable row level security;

grant select (id, seminar_id, host_id, user_id, starts_at, ends_at, created_at)
  on public.seminar_featured_purchases to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminar_featured_purchases' and policyname = 'Hosts read own featured purchases') then
    create policy "Hosts read own featured purchases"
      on public.seminar_featured_purchases
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

create table if not exists public.seminar_audit_log (
  id uuid primary key default gen_random_uuid(),
  seminar_id uuid,
  actor_id uuid,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.seminar_audit_log enable row level security;

alter table public.seminars add column if not exists host_ref uuid; -- WITHHELD until a host dashboard reads it via service role
-- host_ref is not granted to anon or authenticated.

commit;
