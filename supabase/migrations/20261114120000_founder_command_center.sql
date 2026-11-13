-- Founder command center.
-- Service role only. RLS is on and anon/authenticated have no policies, so the
-- Data API cannot read or write these tables. Do not apply this by hand from
-- an agent; the coordinator reviews it with the pull request.

create table if not exists public.founder_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text,
  target_id text,
  summary text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists founder_audit_log_created_idx
  on public.founder_audit_log (created_at desc);

create table if not exists public.founder_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  audience_key text not null,
  audience jsonb not null default '{}'::jsonb,
  channels text[] not null,
  subject text not null,
  body text not null,
  status text not null default 'draft',
  recipient_count integer not null default 0,
  scheduled_for timestamptz,
  sent_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists founder_broadcasts_status_idx
  on public.founder_broadcasts (status, scheduled_for);

create table if not exists public.founder_banners (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  audience_key text not null,
  title text not null,
  body text not null,
  href text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists founder_banners_active_idx
  on public.founder_banners (active, starts_at, ends_at);

create table if not exists public.founder_nudges (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  doctor_id uuid,
  kind text not null,
  request_ids uuid[] not null default '{}',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.contact_requests
  add column if not exists utm_source text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists office_visit_response text,
  add column if not exists office_visit_sent_at timestamptz,
  add column if not exists office_visit_responded_at timestamptz,
  add column if not exists office_visit_token text;

alter table public.community_visit_requests
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists office_visit_response text,
  add column if not exists office_visit_sent_at timestamptz,
  add column if not exists office_visit_responded_at timestamptz,
  add column if not exists office_visit_token text;

create unique index if not exists contact_requests_office_visit_token_idx
  on public.contact_requests (office_visit_token)
  where office_visit_token is not null;

create unique index if not exists community_visit_office_token_idx
  on public.community_visit_requests (office_visit_token)
  where office_visit_token is not null;

do $$ begin
  alter table public.contact_requests
    add constraint contact_requests_office_visit_chk
    check (office_visit_response is null or office_visit_response in ('yes', 'no'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.community_visit_requests
    add constraint community_visit_office_visit_chk
    check (office_visit_response is null or office_visit_response in ('yes', 'no'));
exception when duplicate_object then null;
end $$;

alter table public.founder_audit_log enable row level security;
alter table public.founder_broadcasts enable row level security;
alter table public.founder_banners enable row level security;
alter table public.founder_nudges enable row level security;

revoke all on table public.founder_audit_log from public, anon, authenticated;
revoke all on table public.founder_broadcasts from public, anon, authenticated;
revoke all on table public.founder_banners from public, anon, authenticated;
revoke all on table public.founder_nudges from public, anon, authenticated;

grant all on table public.founder_audit_log to service_role;
grant all on table public.founder_broadcasts to service_role;
grant all on table public.founder_banners to service_role;
grant all on table public.founder_nudges to service_role;
