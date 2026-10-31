# Student membership decisions

Approved by Raymond on Oct 31, 2026. The config in `src/config/students.ts` matches this file.

## Decided

1. Founding rate: none. `founding.enabled` is false. Everyone pays $33/month or $333/year.
2. The one existing $12/month student subscriber stays at $12, with full access. Do not touch that subscription.
3. Current free students get 30 days of access after `launchAt`, then $33. `launchAt` is null until Raymond sets it.
4. No free trial.
5. Member doctors get 2 active job posts. Featured boost is $49 for 30 days.
6. Outside clinics pay $149 per post for 60 days. Admin approval is required. A rejection refunds the full charge.
7. Students can browse jobs free. Membership is required to apply, match, message mentors, book shadow days, and join the monthly call.
8. The name stays ChiroMatch. Matching is always on. Twice-a-year cycles are retired. Doctors appear only if they opt in. Students verify their school before doctors can see them.

## Still open

These do not block the build.

- Monthly call day, time, platform, where recordings live, and the first guests. Schedule the first one in `/admin/students/calls`.
- Seminar student discount is 25% off, with 5 student seats, until you change `STUDENT_CONFIG.seminars`.
- Shadow-day waiver text is a placeholder for legal review. It is the string `shadowWaiver` in the config.
- Academy courses stay inside membership. They are not sold separately.
- International students pay the same $33 USD.

## Env names (values stay in Vercel, never in git)

- `STRIPE_STUDENT_MEMBERSHIP_MONTHLY_PRICE_ID`
- `STRIPE_STUDENT_MEMBERSHIP_ANNUAL_PRICE_ID`
- `STRIPE_STUDENT_FOUNDING_PROMO_CODE_ID` (optional, unused while founding is off)
- `STRIPE_JOB_FEATURED_PRICE_ID`
- `STRIPE_JOB_NONMEMBER_PRICE_ID`
- `STUDENT_PRICE_CHANGE_EMAILS` set to `on` only after you approve the draft in `docs/students/price-change-email.md`

Reused: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `DISCORD_WEBHOOK_URL`, `ANTHROPIC_API_KEY`.

## SQL order

1. `sql/students_audit_readonly.sql`
2. `sql/students_role_audit_readonly.sql`
3. `supabase/migrations/20261104000000_students_membership.sql`
4. `supabase/migrations/20261105000000_job_board_v2.sql`
5. `supabase/migrations/20261106000000_chiromatch_v1.sql`

Nothing in this folder has been run by the app.
