-- NeuroChiro Seminars phase 1
-- NOT YET RUN — awaiting Raymond's approval.
-- Additive only. No DROP TABLE, no RENAME, no destructive data updates.
-- Does NOT write starts_at or ends_at. Review scripts/backfill-seminar-dates.ts first.
-- Old RLS policies are left in place. New policies are OR'd with them.

begin;

-- ---------------------------------------------------------------------------
-- seminars: new columns
-- Grant decision is listed on each column. service_role bypasses grants.
-- ---------------------------------------------------------------------------

alter table public.seminars add column if not exists slug text;                 -- GRANT select
alter table public.seminars add column if not exists starts_at timestamptz;     -- GRANT select
alter table public.seminars add column if not exists ends_at timestamptz;       -- GRANT select
alter table public.seminars add column if not exists timezone text;             -- GRANT select
alter table public.seminars add column if not exists format text default 'in_person'; -- GRANT select
alter table public.seminars add column if not exists virtual_url text;          -- WITHHELD (not granted)
alter table public.seminars add column if not exists topics text[] default '{}'; -- GRANT select
alter table public.seminars add column if not exists currency text default 'usd'; -- GRANT select
alter table public.seminars add column if not exists price_from numeric;        -- GRANT select
alter table public.seminars add column if not exists price_note text;           -- GRANT select
alter table public.seminars add column if not exists registration_mode text default 'external'; -- GRANT select
alter table public.seminars add column if not exists status text default 'submitted'; -- GRANT select
alter table public.seminars add column if not exists is_featured boolean default false; -- GRANT select
alter table public.seminars add column if not exists featured_until timestamptz; -- GRANT select
alter table public.seminars add column if not exists capacity integer;          -- GRANT select
alter table public.seminars add column if not exists seats_sold integer default 0; -- GRANT select
alter table public.seminars add column if not exists country_code text;         -- GRANT select
alter table public.seminars add column if not exists state text;                -- GRANT select
alter table public.seminars add column if not exists latitude numeric;          -- GRANT select
alter table public.seminars add column if not exists longitude numeric;         -- GRANT select
alter table public.seminars add column if not exists tagline text;              -- GRANT select
alter table public.seminars add column if not exists outcomes text[];           -- GRANT select
alter table public.seminars add column if not exists hosts jsonb;               -- GRANT select
alter table public.seminars add column if not exists sponsors jsonb;            -- GRANT select
alter table public.seminars add column if not exists whats_included text[];     -- GRANT select
alter table public.seminars add column if not exists refund_policy text;        -- GRANT select
alter table public.seminars add column if not exists transfer_policy text;      -- GRANT select
alter table public.seminars add column if not exists travel_info jsonb;         -- GRANT select
alter table public.seminars add column if not exists ce_approving_body text;    -- GRANT select
alter table public.seminars add column if not exists ce_states text[];          -- GRANT select
alter table public.seminars add column if not exists ce_notes text;             -- GRANT select
alter table public.seminars add column if not exists audiences jsonb;           -- GRANT select

-- Fill NEW columns only. Approved rows become published. is_past approved rows
-- become completed. Unapproved rows stay submitted. Re-running does not move
-- a published row backwards.
update public.seminars
set status = case
  when is_approved is true and is_past is true then 'completed'
  when is_approved is true then 'published'
  else 'submitted'
end
where status is null or status = 'submitted';

-- Slugs match src/lib/seminars/slug.ts for the rows that existed on 2026-10-30.
-- Only fills slug when it is still null.
update public.seminars set slug = 'neurochiro-live-adelaide-2026' where id = '5f5fc4ef-a85a-4e8a-986b-1a3bf487efe8' and slug is null;
update public.seminars set slug = 'the-in8-summit-2026-perth' where id = '46052c0a-6053-44e9-ad3c-8d0d91594838' and slug is null;
update public.seminars set slug = 'new-beginnings-35th-anniversary-year-asbury-park-2026' where id = 'decf2147-adf5-4788-9f6b-e73e0c535cd6' and slug is null;
update public.seminars set slug = 'the-brave-practice-event-fort-lauderdale-2026' where id = 'c60f0061-e73c-45a6-ab5e-90c2f80dfdcd' and slug is null;
update public.seminars set slug = 'dynamic-essentials-summer-2026-atlanta' where id = 'b2d20438-54c3-47ab-91fb-f4fd49b01aaa' and slug is null;
update public.seminars set slug = 'ce-2026-uca-autumn-conference-birmingham' where id = '1bda6fec-470d-489d-b302-df848400e92f' and slug is null;
update public.seminars set slug = 'mls-one-catalyst-atlanta-ga-2026' where id = '9e184508-bf3f-459b-bbb5-07f497b037d9' and slug is null;
update public.seminars set slug = 'mls-one-catalyst-oakland-ca-2026' where id = '383e1030-9a4d-4e1f-a411-18774be7cf91' and slug is null;
update public.seminars set slug = 'mls-one-catalyst-davenport-ia-2026' where id = '5c70a659-4f58-4644-80ff-c7117c08f53c' and slug is null;

update public.seminars
set country_code = case
  when lower(coalesce(country, '')) in ('au', 'australia') then 'AU'
  when lower(coalesce(country, '')) in ('us', 'usa', 'united states') then 'US'
  when lower(coalesce(country, '')) in ('gb', 'uk', 'united kingdom') then 'GB'
  when lower(coalesce(country, '')) in ('nz', 'new zealand') then 'NZ'
  when lower(coalesce(country, '')) in ('ca', 'canada') then 'CA'
  else country_code
end
where country_code is null and country is not null;

update public.seminars
set currency = case country_code
  when 'AU' then 'AUD'
  when 'GB' then 'GBP'
  when 'NZ' then 'NZD'
  when 'CA' then 'CAD'
  else coalesce(currency, 'usd')
end
where country_code in ('AU', 'GB', 'NZ', 'CA') and (currency is null or currency = 'usd');

update public.seminars
set price_from = price
where price_from is null and price is not null and price > 0;

-- Keep the featured rail after is_featured exists. listing_tier is ignored
-- once is_featured is false rather than null. 120 days covers the grandfathered
-- events until ends_at is filled by the reviewed date script.
update public.seminars
set is_featured = true,
    featured_until = coalesce(featured_until, now() + interval '120 days')
where is_approved is true
  and listing_tier in ('featured', 'premium')
  and is_featured is not true;

create unique index if not exists seminars_slug_key on public.seminars (slug) where slug is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seminars_format_check') then
    alter table public.seminars add constraint seminars_format_check check (format in ('in_person', 'virtual', 'hybrid'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'seminars_registration_mode_check') then
    alter table public.seminars add constraint seminars_registration_mode_check check (registration_mode in ('external', 'neurochiro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'seminars_status_check') then
    alter table public.seminars add constraint seminars_status_check check (status in ('draft', 'submitted', 'changes_requested', 'approved', 'published', 'completed', 'cancelled', 'rejected'));
  end if;
end $$;

-- Explicit grants for every new public column. virtual_url stays revoked.
grant select (
  slug, starts_at, ends_at, timezone, format, topics, currency, price_from, price_note,
  registration_mode, status, is_featured, featured_until, capacity, seats_sold,
  country_code, state, latitude, longitude, tagline, outcomes, hosts, sponsors,
  whats_included, refund_policy, transfer_policy, travel_info, ce_approving_body,
  ce_states, ce_notes, audiences
) on public.seminars to anon, authenticated;

-- New policies only. The existing "approved" policies stay.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminars' and policyname = 'Anon can read published seminars') then
    create policy "Anon can read published seminars" on public.seminars for select to anon using (status = 'published');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminars' and policyname = 'Authenticated can read published seminars') then
    create policy "Authenticated can read published seminars" on public.seminars for select to authenticated using (status = 'published' or status = 'completed');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- seminar_ticket_types
-- stripe_price_id is WITHHELD from anon and authenticated.
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_ticket_types (
  id uuid primary key default gen_random_uuid(),
  seminar_id uuid not null references public.seminars (id),
  name text not null,
  description text,
  price numeric not null default 0,
  member_price numeric,
  currency text not null default 'usd',
  early_bird_price numeric,
  early_bird_ends_at timestamptz,
  capacity integer,
  sold integer not null default 0,
  sort integer not null default 0,
  is_active boolean not null default true,
  stripe_price_id text,
  created_at timestamptz not null default now()
);

alter table public.seminar_ticket_types enable row level security;

grant select (
  id, seminar_id, name, description, price, member_price, currency,
  early_bird_price, early_bird_ends_at, capacity, sold, sort, is_active, created_at
) on public.seminar_ticket_types to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminar_ticket_types' and policyname = 'Read active tickets for visible seminars') then
    create policy "Read active tickets for visible seminars"
      on public.seminar_ticket_types
      for select
      to anon, authenticated
      using (
        is_active = true
        and exists (
          select 1 from public.seminars s
          where s.id = seminar_id
            and (s.status = 'published' or s.is_approved = true)
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- seminar_registrations (additive)
-- profile_id becomes nullable for guests. This is not a drop of the column.
-- WITHHELD: hold_expires_at, stripe_checkout_session_id, stripe_payment_intent_id, source, utm
-- GRANTED to authenticated (own rows via RLS): the rest of the new columns, including qr_token
-- ---------------------------------------------------------------------------

alter table public.seminar_registrations add column if not exists ticket_type_id uuid;
alter table public.seminar_registrations add column if not exists attendee_name text;
alter table public.seminar_registrations add column if not exists attendee_email text;
alter table public.seminar_registrations add column if not exists status text;
alter table public.seminar_registrations add column if not exists hold_expires_at timestamptz;
alter table public.seminar_registrations add column if not exists stripe_checkout_session_id text;
alter table public.seminar_registrations add column if not exists stripe_payment_intent_id text;
alter table public.seminar_registrations add column if not exists amount_total integer;
alter table public.seminar_registrations add column if not exists currency text;
alter table public.seminar_registrations add column if not exists member_discount_applied boolean default false;
alter table public.seminar_registrations add column if not exists qr_token text;
alter table public.seminar_registrations add column if not exists source text;
alter table public.seminar_registrations add column if not exists utm jsonb;

alter table public.seminar_registrations alter column profile_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seminar_registrations_status_check') then
    alter table public.seminar_registrations
      add constraint seminar_registrations_status_check
      check (status is null or status in ('pending', 'paid', 'refunded', 'cancelled', 'rsvp'));
  end if;
end $$;

create unique index if not exists seminar_registrations_checkout_session_key
  on public.seminar_registrations (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists seminar_registrations_qr_token_key
  on public.seminar_registrations (qr_token)
  where qr_token is not null;

create unique index if not exists seminar_registrations_email_active
  on public.seminar_registrations (seminar_id, lower(attendee_email))
  where status in ('paid', 'rsvp') and attendee_email is not null;

grant select (
  ticket_type_id, attendee_name, attendee_email, status, amount_total, currency,
  member_discount_applied, qr_token
) on public.seminar_registrations to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seminar_registrations' and policyname = 'Registrants read own seminar rows') then
    create policy "Registrants read own seminar rows"
      on public.seminar_registrations
      for select
      to authenticated
      using (profile_id = auth.uid());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- seminar_outbound_clicks  (seminar_clicks is not in the live API)
-- No grants for anon or authenticated. service_role writes only.
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  seminar_id uuid not null references public.seminars (id),
  profile_id uuid,
  ip_hash text,
  ua text,
  utm jsonb,
  created_at timestamptz not null default now()
);

alter table public.seminar_outbound_clicks enable row level security;

-- ---------------------------------------------------------------------------
-- seminar_email_jobs
-- No grants for anon or authenticated.
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_email_jobs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid,
  seminar_id uuid not null references public.seminars (id),
  kind text not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  error text,
  attempts integer not null default 0,
  unique (registration_id, kind)
);

alter table public.seminar_email_jobs enable row level security;

create index if not exists seminar_email_jobs_due
  on public.seminar_email_jobs (send_at)
  where sent_at is null;

-- ---------------------------------------------------------------------------
-- Seat hold. service_role only.
-- ---------------------------------------------------------------------------

create or replace function public.seminar_reserve_seat(
  p_seminar_id uuid,
  p_ticket_type_id uuid,
  p_name text,
  p_email text,
  p_profile_id uuid,
  p_amount_cents integer,
  p_currency text,
  p_member_discount boolean,
  p_hold_minutes integer,
  p_qr_token text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_sold integer;
  v_seminar_capacity integer;
  v_seminar_sold integer;
  v_holds integer;
  v_id uuid;
  v_active boolean;
begin
  if p_seminar_id is null or p_ticket_type_id is null or p_email is null or length(trim(p_email)) = 0 then
    return null;
  end if;

  select t.capacity, t.sold, t.is_active
    into v_capacity, v_sold, v_active
  from public.seminar_ticket_types t
  where t.id = p_ticket_type_id
    and t.seminar_id = p_seminar_id
  for update;

  if not found or v_active is not true then
    return null;
  end if;

  select s.capacity, s.seats_sold
    into v_seminar_capacity, v_seminar_sold
  from public.seminars s
  where s.id = p_seminar_id
    and s.status = 'published'
  for update;

  if not found then
    return null;
  end if;

  select count(*)::integer into v_holds
  from public.seminar_registrations r
  where r.ticket_type_id = p_ticket_type_id
    and r.status = 'pending'
    and r.hold_expires_at is not null
    and r.hold_expires_at > now();

  if v_capacity is not null and coalesce(v_sold, 0) + v_holds >= v_capacity then
    return null;
  end if;

  if v_seminar_capacity is not null and coalesce(v_seminar_sold, 0) + v_holds >= v_seminar_capacity then
    return null;
  end if;

  insert into public.seminar_registrations (
    seminar_id, ticket_type_id, profile_id, attendee_name, attendee_email,
    status, payment_status, hold_expires_at, amount_total, currency,
    member_discount_applied, qr_token
  ) values (
    p_seminar_id, p_ticket_type_id, p_profile_id, nullif(trim(p_name), ''), lower(trim(p_email)),
    'pending', 'pending', now() + make_interval(mins => greatest(coalesce(p_hold_minutes, 30), 1)),
    p_amount_cents, p_currency, coalesce(p_member_discount, false), p_qr_token
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.seminar_reserve_seat(uuid, uuid, text, text, uuid, integer, text, boolean, integer, text) from public;
revoke all on function public.seminar_reserve_seat(uuid, uuid, text, text, uuid, integer, text, boolean, integer, text) from anon;
revoke all on function public.seminar_reserve_seat(uuid, uuid, text, text, uuid, integer, text, boolean, integer, text) from authenticated;
grant execute on function public.seminar_reserve_seat(uuid, uuid, text, text, uuid, integer, text, boolean, integer, text) to service_role;

commit;
