-- Harden doctor go-live. Additive and safe to run more than once.
-- Does not recreate doctor_go_live_runs, doctor_go_live_steps, stripe_webhook_health,
-- doctor_checkout_claims, or processed_webhooks.

begin;

alter table public.profiles
  add column if not exists notification_preferences jsonb default '{}'::jsonb;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'processed_webhooks'
  ) then
    alter table public.processed_webhooks add column if not exists status text;
    alter table public.processed_webhooks add column if not exists event_type text;
    alter table public.processed_webhooks add column if not exists updated_at timestamptz default now();
  end if;
end $$;

alter table public.doctor_go_live_steps drop constraint if exists doctor_go_live_steps_status_chk;
alter table public.doctor_go_live_steps
  add constraint doctor_go_live_steps_status_chk
  check (status in ('ok', 'failed', 'skipped', 'pending'));

create unique index if not exists doctor_go_live_steps_welcome_claim_uidx
  on public.doctor_go_live_steps (doctor_id)
  where step = 'welcome' and status in ('pending', 'ok');

create table if not exists public.doctor_go_live_locks (
  doctor_id uuid primary key,
  acquired_at timestamptz not null default now()
);

alter table public.doctor_go_live_locks enable row level security;
revoke all on table public.doctor_go_live_locks from public, anon, authenticated;
grant select, insert, update, delete on table public.doctor_go_live_locks to service_role;

create or replace function public.portal_password_is_set(target uuid)
returns boolean
language sql
stable
security invoker
set search_path = auth, public
as $$
  select coalesce((
    select length(btrim(encrypted_password)) > 0
    from auth.users
    where id = target
  ), false);
$$;

revoke all on function public.portal_password_is_set(uuid) from public, anon, authenticated;
grant execute on function public.portal_password_is_set(uuid) to service_role;

insert into public.doctor_go_live_runs (doctor_id, source, dry_run)
select d.id, 'backfill', false
from public.doctors d
where d.verification_status = 'verified'
  and not exists (
    select 1 from public.doctor_go_live_runs r where r.doctor_id = d.id
  );

insert into public.doctor_go_live_steps (run_id, doctor_id, step, status, reason)
select r.id, r.doctor_id, 'checkout', 'ok', 'Existing member before automation'
from public.doctor_go_live_runs r
where r.source = 'backfill'
  and not exists (
    select 1 from public.doctor_go_live_steps s
    where s.run_id = r.id and s.step = 'checkout'
  );

insert into public.doctor_go_live_steps (run_id, doctor_id, step, status, reason)
select r.id, r.doctor_id, 'welcome', 'ok', 'Existing member before automation'
from public.doctor_go_live_runs r
where r.source = 'backfill'
  and not exists (
    select 1 from public.doctor_go_live_steps s
    where s.run_id = r.id and s.step = 'welcome'
  );

commit;
