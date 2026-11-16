-- Additive leftover from payment go-live.
-- doctor_go_live_runs, doctor_go_live_steps, stripe_webhook_health, and
-- doctors.needs_ai_enrich already exist (20261116043000_doctor_go_live_log.sql).
-- Safe to run more than once. Does not send email or SMS.

begin;

alter table public.doctors
  add column if not exists profile_publish_mode text;

-- An earlier draft of this change created parallel tables. Drop them if present.
drop table if exists public.go_live_steps;
drop table if exists public.go_live_runs;

commit;
