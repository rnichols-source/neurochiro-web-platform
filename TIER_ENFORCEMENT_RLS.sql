-- 1. Hardened Content Access (Academy)
-- Only 'student_paid' or 'admin' can see premium academy content
-- Founder and Admin always have access regardless of subscription status
create policy "Premium Academy Access"
  on public.content for select
  using ( 
    access_level = 'premium' 
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (
        role in ('admin', 'founder', 'super_admin', 'regional_admin')
        or (role in ('student_paid', 'doctor_growth', 'doctor_pro') and subscription_status = 'active')
      )
    )
  );

-- 2. Hardened Job Posting (Doctors)
-- Only 'doctor_growth' or 'doctor_pro' can post more than 1 job
-- (This requires a function to count existing jobs)
create or replace function public.can_post_job()
returns boolean as $$
declare
  user_role text;
  job_count integer;
begin
  select role into user_role from public.profiles where id = auth.uid();
  select count(*) into job_count from public.jobs where doctor_id = auth.uid();

  if user_role in ('admin', 'founder', 'super_admin', 'regional_admin') then return true; end if;
  if user_role = 'doctor_pro' then return true; end if;
  if user_role = 'doctor_growth' and job_count < 5 then return true; end if;
  if user_role = 'doctor_member' and job_count < 1 then return true; end if;
  
  return false;
end;
$$ language plpgsql security definer;

create policy "Doctors can post jobs based on tier"
  on public.jobs for insert
  with check ( public.can_post_job() );

-- 3. Candidate Search Access (Elite Feature)
-- Only 'doctor_pro' or 'admin' can view the students table (Candidate Search)
create policy "Elite Candidate Search"
  on public.students for select
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (
        role in ('admin', 'founder', 'super_admin', 'regional_admin')
        or (role = 'doctor_pro' and subscription_status = 'active')
      )
    )
  );
