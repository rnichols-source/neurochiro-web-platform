-- 1. Create Subscriptions Table
create table public.subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id uuid references public.profiles(id) not null,
  status text not null, -- active, past_due, canceled, trialing
  price_id text, -- Stripe Price ID
  billing_cycle text default 'monthly', -- monthly or annual
  next_billing_date timestamp with time zone,
  quantity integer,
  cancel_at_period_end boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

-- 2. Enable RLS
alter table public.subscriptions enable row level security;

-- 3. Policies
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using ( auth.uid() = user_id );

-- 4. Trigger to sync subscription status to profiles
create or replace function public.handle_subscription_update()
returns trigger as $$
begin
  update public.profiles
  set 
    subscription_status = new.status,
    billing_plan_type = new.billing_cycle,
    -- Map Stripe Price IDs to roles if needed, or just track status
    role = case 
      when new.price_id in ('price_doctor_pro_monthly', 'price_doctor_pro_annual') then 'doctor_pro'
      when new.price_id in ('price_doctor_growth_monthly', 'price_doctor_growth_annual') then 'doctor_growth'
      when new.price_id in ('price_student_paid_monthly', 'price_student_paid_annual') then 'student_paid'
      else role -- keep existing role if not a specific tier price
    end
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_subscription_created_or_updated
  after insert or update on public.subscriptions
  for each row execute procedure public.handle_subscription_update();
