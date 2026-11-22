-- Document the spam quarantine status on contact_requests.
-- status is unconstrained text today, so this does not add a check constraint
-- and does not change existing rows. Do not apply this to production until
-- Raymond says merge.

comment on column public.contact_requests.status is
  'new | acknowledged | withdrawn | doctor_unreachable | spam';
