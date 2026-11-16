# Student membership decisions

Approved by Raymond on Oct 31, 2026. The config in `src/config/students.ts` matches this file.

## Decided

1. The first 50 paying students get $9.99/month or $99/year, locked until they graduate. Checkout uses that price while fewer than 50 founding subscriptions (active, trialing, or past due) exist. After that, checkout uses $33/month or $333/year. The public line is `Founding 50: X spots left at $9.99/mo`.
2. Do not change existing subscribers, except the one Raymond approved on Nov 16, 2026. `sub_1TWyUBQ4WJOENoxrOxzuf9i8` was moved from the legacy $12/month price onto the founding $9.99 price (`price_1UbYJUQ4WJOENoxrsDIl4gzE`). That subscription counts toward the 50 while it is active, trialing, or past due.
3. Current free students get 30 days of access after `launchAt`, then $33. `launchAt` is null until Raymond sets it.
4. No free trial.
5. Member doctors get 2 active job posts. Featured boost is $49 for 30 days.
6. Outside clinics pay $149 per post for 60 days. Admin approval is required. A rejection refunds the full charge.
7. Students can browse jobs free. Membership is required to apply, match, message mentors, book shadow days, and join the monthly call.
8. The name stays ChiroMatch. Matching is always on. Twice-a-year cycles are retired. Doctors appear only if they opt in. Students verify their school before doctors can see them. v1 weights are in `src/lib/match/score.ts`. See `docs/matching/how-scoring-works.md`. A weight change needs Raymond's approval.
9. Welcome and profile save the school and graduation year on `students.school_name` and `students.graduation_year`. The same school, current trimester, graduation year, city, state, and technique interest are saved on `profiles` (`school_name`, `chiropractic_school`, `current_year_in_school`, `graduation_year`, `practice_city`, `practice_state`, `areas_of_interest`). Those columns already exist. No new migration is required.

## Still open

These do not block the build.

- Monthly call day, time, platform, where recordings live, and the first guests. Schedule the first one in `/admin/students/calls`.
- Seminar student discount is 25% off, with 5 student seats, until you change `STUDENT_CONFIG.seminars`.
- Shadow-day waiver text is a placeholder for legal review. It is the string `shadowWaiver` in the config.
- Academy courses stay inside membership. They are not sold separately.
- International students pay the same $33 USD.

## Env names

Set these in Vercel. If one is missing, checkout uses the price ID in `src/config/students.ts`.

- `STRIPE_STUDENT_FOUNDING_MONTHLY_PRICE_ID` — `price_1UbYJUQ4WJOENoxrsDIl4gzE` ($9.99/month)
- `STRIPE_STUDENT_FOUNDING_ANNUAL_PRICE_ID` — `price_1UbYJUQ4WJOENoxrZLq76Ret` ($99/year)
- `STRIPE_STUDENT_MEMBERSHIP_MONTHLY_PRICE_ID` — `price_1UWo40Q4WJOENoxrTf8tS6Pt` ($33/month)
- `STRIPE_STUDENT_MEMBERSHIP_ANNUAL_PRICE_ID` — `price_1UWo46Q4WJOENoxroQmr3XwK` ($333/year)
- `STRIPE_STUDENT_FOUNDING_PROMO_CODE_ID` (optional)
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
