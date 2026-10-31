-- NOT RUN — Raymond reviews and runs
-- Associateships board: approval, featured boost, views, applications, monthly sends.
-- Idempotent. Does not email anyone. Does not delete application rows.
-- Run sql/students_audit_readonly.sql and sql/students_role_audit_readonly.sql first.
-- Run 20261104000000_students_membership.sql before this file.

alter table public.job_postings add column if not exists poster_type text default 'member';
alter table public.job_postings add column if not exists approval_status text default 'approved';
alter table public.job_postings add column if not exists rejected_reason text;
alter table public.job_postings add column if not exists featured_until timestamptz;
alter table public.job_postings add column if not exists is_paid boolean default false;
alter table public.job_postings add column if not exists stripe_checkout_session_id text;
alter table public.job_postings add column if not exists stripe_payment_intent_id text;
alter table public.job_postings add column if not exists refund_id text;
alter table public.job_postings add column if not exists poster_email text;
alter table public.job_postings add column if not exists poster_name text;
alter table public.job_postings add column if not exists poster_phone text;
alter table public.job_postings add column if not exists clinic_name text;
alter table public.job_postings add column if not exists start_date date;
alter table public.job_postings add column if not exists technique_tags text[] default '{}';
alter table public.job_postings add column if not exists view_count int default 0;
alter table public.job_postings add column if not exists manage_token_hash text;
alter table public.job_postings add column if not exists approved_at timestamptz;
alter table public.job_postings add column if not exists approved_by uuid;

-- Existing Active rows stay public because approval_status defaults to approved.

create unique index if not exists job_postings_stripe_session_uidx
  on public.job_postings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'job_postings_poster_type_check') then
    alter table public.job_postings add constraint job_postings_poster_type_check
      check (poster_type in ('member', 'nonmember', 'admin')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'job_postings_approval_status_check') then
    alter table public.job_postings add constraint job_postings_approval_status_check
      check (approval_status in ('awaiting_payment', 'pending', 'approved', 'rejected')) not valid;
  end if;
end $$;

create table if not exists public.job_post_views (
  job_id uuid not null references public.job_postings(id) on delete cascade,
  viewer_hash text not null,
  day date not null,
  primary key (job_id, viewer_hash, day)
);

create table if not exists public.student_email_sends (
  month text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'monthly_digest',
  sent_at timestamptz not null default now(),
  primary key (month, user_id, kind)
);

alter table public.job_applications add column if not exists student_user_id uuid;
alter table public.job_applications add column if not exists stage text default 'new';
alter table public.job_applications add column if not exists resume_url text;
alter table public.job_applications add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'job_applications_stage_check') then
    alter table public.job_applications add constraint job_applications_stage_check
      check (stage is null or stage in ('new', 'reviewing', 'interview', 'offer', 'hired', 'declined')) not valid;
  end if;
end $$;

create index if not exists job_applications_student_idx on public.job_applications (student_user_id);
create index if not exists job_postings_board_idx on public.job_postings (status, approval_status, expires_at);

insert into storage.buckets (id, name, public)
values ('student-resumes', 'student-resumes', false)
on conflict (id) do nothing;

alter table public.job_postings enable row level security;
alter table public.job_post_views enable row level security;
alter table public.student_email_sends enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists job_postings_public_read on public.job_postings;
create policy job_postings_public_read on public.job_postings
  for select to anon, authenticated
  using (
    status in ('Active', 'open')
    and approval_status = 'approved'
    and (expires_at is null or expires_at > now())
  );

-- doctor_id and applicant_id are text in production. Compare as text.
drop policy if exists job_postings_owner_select on public.job_postings;
create policy job_postings_owner_select on public.job_postings
  for select to authenticated
  using (doctor_id::text = auth.uid()::text);

drop policy if exists job_postings_owner_update on public.job_postings;
create policy job_postings_owner_update on public.job_postings
  for update to authenticated
  using (doctor_id::text = auth.uid()::text)
  with check (doctor_id::text = auth.uid()::text);

drop policy if exists job_postings_owner_insert on public.job_postings;
create policy job_postings_owner_insert on public.job_postings
  for insert to authenticated
  with check (doctor_id::text = auth.uid()::text and coalesce(poster_type, 'member') = 'member');

-- job_post_views: no client policies. Writes go through record_job_view.
-- student_email_sends: no client policies.

drop policy if exists job_applications_applicant_read on public.job_applications;
create policy job_applications_applicant_read on public.job_applications
  for select to authenticated
  using (applicant_id::text = auth.uid()::text or student_user_id::text = auth.uid()::text);

drop policy if exists job_applications_owner_read on public.job_applications;
create policy job_applications_owner_read on public.job_applications
  for select to authenticated
  using (
    exists (
      select 1 from public.job_postings p
      where p.id::text = job_applications.job_id::text and p.doctor_id::text = auth.uid()::text
    )
  );

drop policy if exists student_resumes_owner_read on storage.objects;
create policy student_resumes_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists student_resumes_owner_insert on storage.objects;
create policy student_resumes_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'student-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists student_resumes_poster_read on storage.objects;
create policy student_resumes_poster_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-resumes'
    and exists (
      select 1
      from public.job_applications a
      join public.job_postings p on p.id::text = a.job_id::text
      where p.doctor_id::text = auth.uid()::text
        and (storage.foldername(name))[1] = coalesce(a.student_user_id::text, a.applicant_id::text)
    )
  );

create or replace function public.record_job_view(job uuid, viewer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if viewer is null or length(viewer) < 32 or length(viewer) > 128 then
    return;
  end if;
  with ins as (
    insert into public.job_post_views (job_id, viewer_hash, day)
    values (job, viewer, (timezone('utc', now()))::date)
    on conflict do nothing
    returning 1
  )
  update public.job_postings
  set view_count = coalesce(view_count, 0) + 1
  where id = job
    and exists (select 1 from ins);
end $$;

revoke all on function public.record_job_view(uuid, text) from public;
grant execute on function public.record_job_view(uuid, text) to anon, authenticated, service_role;
