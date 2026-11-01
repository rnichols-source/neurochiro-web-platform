-- NOT RUN — Raymond reviews and runs
-- Synapse marketplace. Idempotent. Creates vendor tables when the sql/ scripts were never applied.
-- Do not drop tables. Run CHECK FIRST, then the body, then CHECK AFTER.

-- ===== CHECK FIRST (read-only) =====
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'vendors','vendor_products','vendor_content','vendor_reviews','vendor_usage',
    'vendor_rfps','vendor_rfp_responses','synapse_seats','vendor_perks','perk_redemptions','synapse_addon_orders'
  )
order by 1;

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'vendors'
order by 1;

select tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('vendors','vendor_rfp_responses','vendor_reviews','vendor_usage')
order by 1, 2;

select t.name as table_name,
  to_regclass('public.' || t.name) is not null as exists,
  case
    when to_regclass('public.' || t.name) is null then null
    else (xpath('//row/c/text()', query_to_xml(format('select count(*)::text as c from public.%I', t.name), false, true, '')))[1]::text::bigint
  end as rows
from (values
  ('vendors'), ('vendor_products'), ('vendor_content'), ('vendor_reviews'),
  ('vendor_usage'), ('vendor_rfps'), ('vendor_rfp_responses')
) as t(name);

-- ===== Vendor tables that may not exist yet =====
create table if not exists public.vendor_products (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text,
  price text,
  image_url text,
  link_url text,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);
create index if not exists idx_vendor_products_vendor on public.vendor_products (vendor_id, sort_order);

create table if not exists public.vendor_content (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz default now() not null,
  is_published boolean default true
);
create index if not exists idx_vendor_content_vendor on public.vendor_content (vendor_id, published_at desc);
alter table public.vendor_content add column if not exists is_sponsored boolean default false;

create table if not exists public.vendor_reviews (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  doctor_user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz default now() not null,
  unique (vendor_id, doctor_user_id)
);
create index if not exists idx_vendor_reviews_vendor on public.vendor_reviews (vendor_id, created_at desc);
alter table public.vendor_reviews alter column review_text drop not null;

create table if not exists public.vendor_usage (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  doctor_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (vendor_id, doctor_user_id)
);
create index if not exists idx_vendor_usage_vendor on public.vendor_usage (vendor_id);

create table if not exists public.vendor_rfps (
  id uuid default gen_random_uuid() primary key,
  doctor_user_id uuid not null references auth.users(id),
  category text not null,
  description text not null,
  budget text,
  timeline text,
  status text default 'open' check (status in ('open', 'closed', 'fulfilled')),
  created_at timestamptz default now() not null
);
create table if not exists public.vendor_rfp_responses (
  id uuid default gen_random_uuid() primary key,
  rfp_id uuid not null references public.vendor_rfps(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  response_text text not null,
  price text,
  created_at timestamptz default now() not null,
  unique (rfp_id, vendor_id)
);

-- ===== vendors columns =====
alter table public.vendors add column if not exists vetting_status text default 'applied';
alter table public.vendors add column if not exists vetting_checklist jsonb default '{}'::jsonb;
alter table public.vendors add column if not exists vetting_notes text;
alter table public.vendors add column if not exists country text default 'US';
alter table public.vendors add column if not exists best_price_pledged_at timestamptz;
alter table public.vendors add column if not exists contact_email text;
alter table public.vendors add column if not exists contact_name text;
alter table public.vendor_rfps add column if not exists category_key text;
alter table public.vendor_rfps add column if not exists country text default 'US';
alter table public.vendor_rfps add column if not exists first_look_until timestamptz;

-- ===== canonical category keys =====
create or replace function public.synapse_category_key(raw text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(raw, '')))
    when 'neuro-scanning' then 'neuro-scanning'
    when 'neuro scanning technology' then 'neuro-scanning'
    when 'imaging & scans' then 'neuro-scanning'
    when 'scanning technology' then 'neuro-scanning'
    when 'tables' then 'tables'
    when 'adjusting tables' then 'tables'
    when 'tables & equipment' then 'tables'
    when 'chiropractic tables & equipment' then 'tables'
    when 'instruments' then 'instruments'
    when 'adjusting instruments' then 'instruments'
    when 'supplements' then 'supplements'
    when 'professional supplements' then 'supplements'
    when 'supplements & nutrition' then 'supplements'
    when 'software' then 'software'
    when 'practice software & ehr' then 'software'
    when 'ehr & software' then 'software'
    when 'practice management software' then 'software'
    when 'patient-engagement' then 'patient-engagement'
    when 'patient engagement' then 'patient-engagement'
    when 'marketing' then 'marketing'
    when 'marketing & branding' then 'marketing'
    when 'education' then 'education'
    when 'education & coaching' then 'education'
    when 'education & training' then 'education'
    when 'billing' then 'billing'
    when 'billing & collections' then 'billing'
    when 'billing & insurance' then 'billing'
    when 'launch-finance' then 'launch-finance'
    when 'practice launch & finance' then 'launch-finance'
    when 'financial services' then 'launch-finance'
    when 'real estate' then 'launch-finance'
    when 'legal-hr' then 'legal-hr'
    when 'legal, compliance & hr' then 'legal-hr'
    when 'legal & compliance' then 'legal-hr'
    when 'staffing & hr' then 'legal-hr'
    when 'orthotics-recovery' then 'orthotics-recovery'
    when 'orthotics, supports & recovery' then 'orthotics-recovery'
    when 'orthotics & supports' then 'orthotics-recovery'
    when 'office-apparel' then 'office-apparel'
    when 'office, design & apparel' then 'office-apparel'
    when 'office supplies & design' then 'office-apparel'
    when 'office supplies & décor' then 'office-apparel'
    when 'office supplies & decor' then 'office-apparel'
    when 'apparel & merchandise' then 'office-apparel'
    else null
  end;
$$;
revoke all on function public.synapse_category_key(text) from public, anon, authenticated;

update public.vendors v
set categories = (
  select coalesce(array_agg(distinct public.synapse_category_key(item)), '{}')
  from unnest(coalesce(v.categories, '{}'::text[])) as item
  where public.synapse_category_key(item) is not null
)
where v.categories is not null;

update public.vendor_rfps
set category_key = public.synapse_category_key(category)
where category_key is null;

-- ===== synapse tables =====
create table if not exists public.synapse_seats (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_key text not null,
  country text not null default 'US',
  tier text not null check (tier in ('anchor', 'ally')),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'at_risk', 'review', 'lapsed', 'revoked')),
  is_founding boolean not null default false,
  term_start timestamptz,
  term_end timestamptz,
  member_count_snapshot integer,
  fee_cents integer,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  reserved_until timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists synapse_seats_one_anchor
  on public.synapse_seats (category_key, country)
  where tier = 'anchor' and status in ('pending_payment', 'active', 'at_risk', 'review');

create table if not exists public.vendor_perks (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  seat_id uuid references public.synapse_seats(id) on delete set null,
  title text not null,
  description text,
  code text,
  redeem_url text,
  est_value_cents integer,
  country text default 'US',
  audience text not null default 'doctor' check (audience in ('doctor', 'student', 'both')),
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.vendor_perks (vendor_id, title, description, code, country, active)
select v.id,
  coalesce(nullif(split_part(v.discount_description, ' - ', 1), ''), 'Member perk'),
  v.discount_description,
  v.discount_code,
  coalesce(v.country, 'US'),
  coalesce(v.is_active, false)
from public.vendors v
where v.discount_code is not null and btrim(v.discount_code) <> ''
  and not exists (
    select 1 from public.vendor_perks p
    where p.vendor_id = v.id and p.code = v.discount_code
  );

create table if not exists public.perk_redemptions (
  id uuid primary key default gen_random_uuid(),
  perk_id uuid not null references public.vendor_perks(id) on delete cascade,
  doctor_user_id uuid not null references auth.users(id) on delete cascade,
  amount_saved_cents integer not null default 0 check (amount_saved_cents >= 0),
  source text not null default 'doctor' check (source in ('doctor', 'vendor')),
  created_at timestamptz not null default now()
);

create table if not exists public.synapse_addon_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  addon_key text not null,
  stripe_checkout_session_id text not null unique,
  amount_cents integer,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  scheduled_for timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ===== RLS =====
alter table public.vendor_products enable row level security;
alter table public.vendor_content enable row level security;
alter table public.vendor_reviews enable row level security;
alter table public.vendor_usage enable row level security;
alter table public.vendor_rfps enable row level security;
alter table public.vendor_rfp_responses enable row level security;
alter table public.synapse_seats enable row level security;
alter table public.vendor_perks enable row level security;
alter table public.perk_redemptions enable row level security;
alter table public.synapse_addon_orders enable row level security;

drop policy if exists "Vendors can view responses to open RFPs" on public.vendor_rfp_responses;
drop policy if exists synapse_rfp_responses_doctor on public.vendor_rfp_responses;
create policy synapse_rfp_responses_doctor on public.vendor_rfp_responses
  for select to authenticated
  using (exists (
    select 1 from public.vendor_rfps r
    where r.id = rfp_id and r.doctor_user_id = auth.uid()
  ));
drop policy if exists synapse_rfp_responses_vendor on public.vendor_rfp_responses;
create policy synapse_rfp_responses_vendor on public.vendor_rfp_responses
  for select to authenticated
  using (vendor_id = auth.uid());

drop policy if exists synapse_reviews_own_insert on public.vendor_reviews;
create policy synapse_reviews_own_insert on public.vendor_reviews
  for insert to authenticated
  with check (doctor_user_id = auth.uid());
drop policy if exists synapse_reviews_own_update on public.vendor_reviews;
create policy synapse_reviews_own_update on public.vendor_reviews
  for update to authenticated
  using (doctor_user_id = auth.uid())
  with check (doctor_user_id = auth.uid());
drop policy if exists synapse_reviews_read on public.vendor_reviews;
create policy synapse_reviews_read on public.vendor_reviews
  for select to anon, authenticated
  using (true);

drop policy if exists synapse_redemptions_own on public.perk_redemptions;
create policy synapse_redemptions_own on public.perk_redemptions
  for select to authenticated
  using (doctor_user_id = auth.uid());
drop policy if exists synapse_redemptions_insert on public.perk_redemptions;
create policy synapse_redemptions_insert on public.perk_redemptions
  for insert to authenticated
  with check (doctor_user_id = auth.uid());

drop policy if exists synapse_seats_public on public.synapse_seats;
create policy synapse_seats_public on public.synapse_seats
  for select to anon, authenticated
  using (status = 'active');
drop policy if exists synapse_seats_vendor on public.synapse_seats;
create policy synapse_seats_vendor on public.synapse_seats
  for select to authenticated
  using (vendor_id = auth.uid());

-- Perk codes are not granted. Titles are. Reveal goes through a server action.
revoke all on public.vendor_perks from anon, authenticated;
grant select (
  id, vendor_id, seat_id, title, description, redeem_url, est_value_cents,
  country, audience, active, starts_at, ends_at, created_at
) on public.vendor_perks to anon, authenticated;
drop policy if exists synapse_perks_public on public.vendor_perks;
create policy synapse_perks_public on public.vendor_perks
  for select to anon, authenticated
  using (active = true);
drop policy if exists synapse_perks_vendor on public.vendor_perks;
create policy synapse_perks_vendor on public.vendor_perks
  for select to authenticated
  using (vendor_id = auth.uid());

drop policy if exists synapse_addons_vendor on public.synapse_addon_orders;
create policy synapse_addons_vendor on public.synapse_addon_orders
  for select to authenticated
  using (vendor_id = auth.uid());

drop policy if exists synapse_usage_own on public.vendor_usage;
create policy synapse_usage_own on public.vendor_usage
  for insert to authenticated
  with check (doctor_user_id = auth.uid());

-- Seat status, fees, and vetting stay on the service role. No authenticated update policy.

-- ===== CHECK AFTER (read-only) =====
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'vendors'
  and column_name in ('vetting_status','vetting_checklist','vetting_notes','country','best_price_pledged_at','contact_email','contact_name')
order by 1;

select indexname from pg_indexes where schemaname = 'public' and indexname = 'synapse_seats_one_anchor';

select policyname from pg_policies
where schemaname = 'public' and tablename = 'vendor_rfp_responses' and policyname like 'synapse_%'
order by 1;

select grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'vendor_perks' and column_name = 'code'
  and grantee in ('anon', 'authenticated');
-- Expect no rows above. A code grant means the public can read perk codes.
