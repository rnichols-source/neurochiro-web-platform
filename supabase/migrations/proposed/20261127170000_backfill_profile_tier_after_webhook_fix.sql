-- NOT RUN. Raymond reviews and runs. Read-only checks first, then one small update.
-- Why: from Nov 1 2026 4:27 PM ET until the webhook fix ships, every Stripe
-- customer.subscription.updated / .deleted event for a member with a linked profile failed to
-- save profiles.tier and profiles.payment_issue_since, because the update also sent
-- profiles.subscription_status, a column production does not have (PostgREST PGRST204).
-- doctors.membership_tier, referral rewards, and payments were still saved.
--
-- Net effect today: 7 paying doctors still have profiles.tier = 'standard' even though
-- doctors.membership_tier = 'pro' and their Stripe subscription is active.
-- Nobody has payment_issue_since or student_past_due_since set, so there is nothing to clear.
-- The one paying student (Damontae Dewitt) cannot be set to 'student_paid' because the
-- profiles.tier enum only has standard, pro, admin. Left unchanged on purpose.
-- Before running, confirm in Stripe that each customer below still has an active subscription.

-- ===================== CHECK FIRST (read-only) =====================
select p.id, p.full_name, p.email, p.tier as profile_tier, d.membership_tier, d.is_founding_member, p.stripe_customer_id
from public.profiles p
join public.doctors d on d.user_id = p.id
where p.stripe_customer_id in (
  'cus_VU7duVOFoIuftH', -- Brandon Hart
  'cus_VQH8V5hD3xBtmG', -- Kace & Kaylee Groff
  'cus_VKKeDCirNHkvfk', -- Chris Boman
  'cus_VU4gNxppOLa6oh', -- Marco Caravaggio
  'cus_VQgbjzPhea2ft6', -- Jessica Ellsworth
  'cus_VUU6UOFSJ8aH5T', -- Scott Campbell-Lloyd
  'cus_VPD8KJufeudm6a'  -- Adam Lamb
)
order by p.full_name;
-- Expect 7 rows, profile_tier = 'standard', membership_tier = 'pro'.

-- Wider net: any other paying doctor whose profile tier is behind the listing tier.
-- On Nov 27 this returned 19 rows: the 7 above plus 12 whose gap did NOT come from this
-- webhook error (no subscription event since Nov 1, or joined through a path that never set
-- profiles.tier). They are left out of the update below until Raymond decides.
select p.id, p.full_name, p.tier, d.membership_tier, p.stripe_customer_id
from public.profiles p
join public.doctors d on d.user_id = p.id
where p.role = 'doctor' and p.tier = 'standard' and d.membership_tier = 'pro'
  and p.stripe_customer_id is not null and coalesce(p.is_test, false) = false
order by p.full_name;

-- ===================== CHANGE =====================
begin;
update public.profiles p
   set tier = 'pro', updated_at = now()
  from public.doctors d
 where d.user_id = p.id
   and p.tier = 'standard'
   and d.membership_tier = 'pro'
   and p.stripe_customer_id in (
     'cus_VU7duVOFoIuftH','cus_VQH8V5hD3xBtmG','cus_VKKeDCirNHkvfk','cus_VU4gNxppOLa6oh',
     'cus_VQgbjzPhea2ft6','cus_VUU6UOFSJ8aH5T','cus_VPD8KJufeudm6a'
   );
-- Expect: UPDATE 7
commit;

-- ===================== CHECK AFTER =====================
select count(*) as still_behind
from public.profiles p join public.doctors d on d.user_id = p.id
where p.stripe_customer_id in (
  'cus_VU7duVOFoIuftH','cus_VQH8V5hD3xBtmG','cus_VKKeDCirNHkvfk','cus_VU4gNxppOLa6oh',
  'cus_VQgbjzPhea2ft6','cus_VUU6UOFSJ8aH5T','cus_VPD8KJufeudm6a'
) and p.tier <> 'pro';  -- expect 0
