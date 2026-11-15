-- Skip the signup welcome for doctors.
--
-- handle_new_user() runs on auth.users insert. It used to read only
-- raw_user_meta_data.role and default that to patient. Membership checkout
-- creates the auth user with app_metadata.role = doctor and no user-metadata
-- role, so every paid doctor was queued as a community member
-- (automation_queue.event_type = welcome_email, payload.role = patient).
--
-- Doctors already get a welcome when an admin clicks Approve at
-- /admin/applications. This function must not queue another one.
-- Community members (role patient), students, and vendors still queue.
--
-- APPLY THIS on NeuroChiro Supabase project gddapefwrmucimpdhjrz.
-- The existing on_auth_user_created trigger already calls this function.
-- Replacing the function is enough. Do not drop the trigger.
--
-- The doctor-row insert below is unchanged. It uses ON CONFLICT (user_id)
-- and there is no unique constraint on doctors.user_id, so that insert
-- fails closed and does not create a second listing.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  user_role_raw text;
  declared_role text;
  app_role text;
  user_full_name text;
begin
  -- App metadata is set by the server (membership checkout). Prefer it when
  -- it says doctor, so a missing user-metadata role cannot fall through to patient.
  app_role := lower(coalesce(nullif(trim(new.raw_app_meta_data->>'role'), ''), ''));
  declared_role := lower(coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), ''));
  if app_role like '%doctor%' then
    user_role_raw := app_role;
  elsif declared_role <> '' then
    user_role_raw := declared_role;
  else
    user_role_raw := 'patient';
  end if;

  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', 'New Member');

  begin
    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email, user_full_name, user_role_raw)
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
  exception when others then
    -- Continue if profile fails
  end;

  -- Unchanged doctor stub. It does not persist: doctors.user_id is not unique,
  -- so ON CONFLICT (user_id) raises and this block swallows the error.
  if user_role_raw like '%doctor%' then
    begin
      insert into public.doctors (user_id, first_name, last_name, slug, verification_status, email, clinic_name)
      values (
        new.id,
        split_part(user_full_name, ' ', 1),
        coalesce(replace(user_full_name, split_part(user_full_name, ' ', 1) || ' ', ''), 'Specialist'),
        'dr-' || lower(replace(replace(user_full_name, ' ', '-'), '.', '')) || '-' || substr(new.id::text, 1, 5),
        'pending',
        new.email,
        'Private Practice'
      )
      on conflict (user_id) do nothing;
    exception when others then
      -- Ignore if columns mismatch, ensures signup still works
    end;
  end if;

  -- Community members, students, and vendors still get the signup welcome.
  -- Doctors wait for the approval welcome.
  if user_role_raw not like '%doctor%' then
    begin
      insert into public.automation_queue (event_type, payload)
      values (
        'welcome_email',
        jsonb_build_object(
          'user_id', new.id,
          'email', new.email,
          'full_name', user_full_name,
          'role', user_role_raw
        )
      );
    exception when others then
      -- Fail silently to ensure user creation succeeds
    end;
  end if;

  return new;
end;
$function$;
