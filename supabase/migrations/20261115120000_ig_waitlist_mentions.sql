-- Additive columns for the Instagram waitlist used by the doctor go-live flow.
-- Does not copy demand_mentions rows. That backfill is scripts/backfill-ig-waitlist.sql
-- and is not part of this migration.
-- Safe to run more than once. Does not send comments or DMs.
-- Server-only: RLS stays on, and anon/authenticated keep no grants.

begin;

alter table public.ig_waitlist
  alter column ig_handle drop not null;

alter table public.ig_waitlist
  add column if not exists display_name text,
  add column if not exists comment_url text,
  add column if not exists dm_thread_url text,
  add column if not exists source_mention_id uuid references public.demand_mentions (id) on delete set null,
  add column if not exists last_doctor_sent uuid references public.doctors (id) on delete set null,
  add column if not exists last_doctor_sent_miles numeric,
  add column if not exists flagged_business boolean not null default false;

drop index if exists public.ig_waitlist_handle_uidx;

create unique index if not exists ig_waitlist_handle_uidx
  on public.ig_waitlist (lower(ig_handle))
  where ig_handle is not null;

create unique index if not exists ig_waitlist_source_mention_uidx
  on public.ig_waitlist (source_mention_id)
  where source_mention_id is not null;

alter table public.ig_dm_batches
  add column if not exists doctor_ig_handle text;

alter table public.ig_dm_items
  alter column ig_handle drop not null;

alter table public.ig_dm_items
  add column if not exists display_name text,
  add column if not exists comment_url text,
  add column if not exists dm_thread_url text,
  add column if not exists comment_message text,
  add column if not exists doctor_ig_handle text;

alter table public.ig_waitlist enable row level security;
alter table public.ig_dm_batches enable row level security;
alter table public.ig_dm_items enable row level security;

revoke all on table public.ig_waitlist from public, anon, authenticated;
revoke all on table public.ig_dm_batches from public, anon, authenticated;
revoke all on table public.ig_dm_items from public, anon, authenticated;

commit;
