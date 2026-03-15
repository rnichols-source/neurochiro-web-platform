-- STEP 13: Supabase RLS Policy Configuration

-- 1. Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.students enable row level security;
alter table public.content enable row level security;
alter table public.jobs enable row level security;
alter table public.seminars enable row level security;

--------------------------------------------------------------------------------
-- PROFILES (Users)
--------------------------------------------------------------------------------
-- Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- Users can update their own profiles (Restrict to non-sensitive fields in production via a trigger or specific columns if Supabase supported it directly in 'using', but typically handled via API/RPC)
-- For now, we ensure they only update their own record. 
-- SECURITY NOTE: In a real production app, use a service-role-only function to update roles/tiers.
create policy "Users can update their own profiles"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Admins can do everything
create policy "Admins have full access to profiles"
  on public.profiles for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'founder', 'super_admin', 'regional_admin')) );


--------------------------------------------------------------------------------
-- DOCTORS (Practice Info)
--------------------------------------------------------------------------------
-- Public users can only see verified doctors
create policy "Public can only see verified doctors"
  on public.doctors for select
  using ( verification_status = 'verified' );

-- Doctors can see their own record regardless of status
create policy "Doctors can see their own record"
  on public.doctors for select
  using ( auth.uid() = user_id );

-- Doctors can update their own practice details
create policy "Doctors can update their own info"
  on public.doctors for update
  using ( auth.uid() = user_id );

-- Admins can manage all doctors
create policy "Admins can manage all doctors"
  on public.doctors for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'founder', 'super_admin', 'regional_admin')) );


--------------------------------------------------------------------------------
-- CONTENT (Academy / Learn)
--------------------------------------------------------------------------------
-- Public content (access_level = 'public') is viewable by all
create policy "Public content is viewable by everyone"
  on public.content for select
  using ( access_level = 'public' );

-- Student content (access_level = 'student_free' or 'student_paid')
create policy "Student content access"
  on public.content for select
  using ( 
    access_level in ('student_free', 'student_paid') 
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('student_free', 'student_paid', 'admin', 'founder', 'super_admin'))
  );

-- Paid Student content
create policy "Paid student content access"
  on public.content for select
  using ( 
    access_level = 'student_paid' 
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('student_paid', 'admin', 'founder', 'super_admin'))
  );


--------------------------------------------------------------------------------
-- JOBS
--------------------------------------------------------------------------------
-- Anyone can view open jobs
create policy "Jobs are viewable by everyone"
  on public.jobs for select
  using ( status = 'open' );

-- Only doctors can post jobs
create policy "Doctors can post jobs"
  on public.jobs for insert
  with check ( 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('doctor_member', 'doctor_growth', 'doctor_pro', 'admin', 'founder', 'super_admin'))
  );

-- Only job owner (doctor) can update their jobs
create policy "Doctors can update their own jobs"
  on public.jobs for update
  using ( doctor_id = auth.uid() );


--------------------------------------------------------------------------------
-- WEBHOOK PROTECTION (Security Best Practice)
--------------------------------------------------------------------------------
-- Ensure only service_role (Admin/Server) can write to sensitive subscription tables
-- (Assuming a 'subscriptions' table exists)
-- alter table public.subscriptions disable row level security; -- NO!
-- create policy "Service role only" on public.subscriptions for all using (auth.role() = 'service_role');
