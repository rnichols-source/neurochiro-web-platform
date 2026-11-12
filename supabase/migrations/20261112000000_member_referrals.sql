-- Member referral program.
-- A doctor's public profile slug is their invite code.
-- One reward row per referred doctor. Safe to run more than once.
-- Does not change Stripe prices.

begin;

alter table public.doctor_applications
  add column if not exists referred_by_doctor_id uuid references public.doctors(id),
  add column if not exists referrer_name text;

alter table public.doctors
  add column if not exists referred_by_doctor_id uuid references public.doctors(id),
  add column if not exists member_referral_banner_dismissed_at timestamptz;

alter table public.profiles
  add column if not exists referred_by_doctor_id uuid;

create index if not exists doctor_applications_referred_by_idx
  on public.doctor_applications (referred_by_doctor_id)
  where referred_by_doctor_id is not null;

create index if not exists doctors_referred_by_doctor_idx
  on public.doctors (referred_by_doctor_id)
  where referred_by_doctor_id is not null;

create table if not exists public.member_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_doctor_id uuid not null references public.doctors(id),
  referred_doctor_id uuid not null references public.doctors(id),
  application_id uuid references public.doctor_applications(id),
  status text not null default 'pending',
  skip_reason text,
  stripe_action text,
  amount_cents integer,
  currency text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_reference text,
  period_end_before timestamptz,
  period_end_after timestamptz,
  error text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  granted_at timestamptz,
  constraint member_referral_rewards_status_check check (
    status in ('pending', 'granted', 'failed', 'skipped')
  )
);

create unique index if not exists member_referral_rewards_referred_key
  on public.member_referral_rewards (referred_doctor_id);

create unique index if not exists member_referral_rewards_idempotency_key
  on public.member_referral_rewards (idempotency_key);

create index if not exists member_referral_rewards_referrer_idx
  on public.member_referral_rewards (referrer_doctor_id, status);

alter table public.member_referral_rewards enable row level security;

revoke all on table public.member_referral_rewards from public, anon, authenticated;

drop policy if exists member_referral_rewards_select_own on public.member_referral_rewards;
create policy member_referral_rewards_select_own
  on public.member_referral_rewards
  for select
  to authenticated
  using (
    referrer_doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

grant select on table public.member_referral_rewards to authenticated;

-- Keep a signed-in user from writing their own referrer. The service role bypasses this.
create or replace function public.protect_profile_privileged_columns() returns trigger
language plpgsql security definer set search_path = public as $$
declare jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if jwt_role in ('anon','authenticated') and not public.is_staff() then
    if new.role is distinct from old.role
       or new.tier is distinct from old.tier
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.referred_by_doctor_id is distinct from old.referred_by_doctor_id then
      raise exception 'Changing role, tier or billing fields is not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

commit;
