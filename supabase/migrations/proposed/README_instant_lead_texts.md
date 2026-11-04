# Instant lead texts

This file has not been run. Raymond pastes `20261108000000_instant_lead_texts.sql` into the Supabase SQL editor himself.

## What it adds

- On each patient request: whether they asked for a text, when they agreed, the exact words they saw, and the mobile number to text.
- On each doctor: up to three mobile numbers for new-patient alerts, an on/off switch, and when the doctor agreed to those texts.
- A private `sms_log` table. It records each text, stops the same text from sending twice, and holds doctor texts that land between 9pm and 8am until the next morning.
- Patients and signed-in users cannot read or write `sms_log`. Only the server can.

The office phone already stored on the doctor is not used for these texts.

## How to undo it

Only do this if the feature should be removed. It deletes the text log and the new fields. It does not delete patient requests or doctor profiles.

```sql
drop table if exists public.sms_log;
alter table public.contact_requests
  drop column if exists sms_consent,
  drop column if exists sms_consent_at,
  drop column if exists sms_consent_version,
  drop column if exists sms_consent_text,
  drop column if exists sms_phone;
alter table public.doctors
  drop column if exists lead_alert_phones,
  drop column if exists sms_alerts_enabled,
  drop column if exists sms_alerts_consent_at,
  drop column if exists sms_alerts_consent_text;
```
