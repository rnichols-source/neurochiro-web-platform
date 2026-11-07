# NeuroChiro Web Platform

## Project Overview
NeuroChiro (neurochiro.co) is the global network and platform for nervous system chiropractors. Five user roles: Doctors, Students, Patients, Vendors, and Admin. New US doctors pay $99/mo ($990/yr) until Dec 1, 2026 at 00:00 America/New_York, then $199/mo ($1,990/yr). Doctors who already subscribed keep their current rate. Students pay $33/mo. Patients are free. All new doctors and students must complete a personal onboarding call with Dr. Ray before their account is activated. No free tier. No trial. The US new-member amounts live in `src/lib/pricing.ts`. Do not hard-code $99 back onto new-member pages.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments:** Stripe (payment links + webhooks)
- **Email:** Resend
- **Styling:** Tailwind CSS
- **Fonts:** Lato (headings), Montserrat (body)
- **Colors:** Navy #1E2D3B, Orange #D66829, Cream #F5F3EF
- **Deployment:** Vercel

## Architecture
- `src/app/(public)/` — Public pages (directory, pricing, landing)
- `src/app/(auth)/` — Login, register, onboarding
- `src/app/(doctor)/doctor/` — Doctor dashboard, profile, analytics, jobs, seminars
- `src/app/(student)/student/` — Student dashboard, jobs, academy, financial planning
- `src/app/(portal)/portal/` — Patient portal, health tracking, exercises
- `src/app/(admin)/admin/` — Admin dashboard, moderation, users
- `src/lib/supabase-admin.ts` — Admin client (bypasses RLS, use for writes to doctors table)
- `src/lib/pricing.ts` — US new-member price. Flips on Dec 1, 2026. Existing members are not repriced here.
- `src/lib/stripe-links.ts` — unused legacy payment links. Not the live US price. Leave it alone.

## Critical Rules
- **All features must use Supabase** for data — never localStorage (cross-device sync requirement)
- **New US doctors: $99/mo ($990/yr) until Dec 1, 2026 00:00 America/New_York, then $199/mo ($1,990/yr). Existing members keep their rate. Student: $33/mo.** No free tier, no trial. Onboarding call required. Do not revert the Dec 1 price.
- **The doctors table requires admin client for writes** — RLS blocks regular client updates
- **Onboarding call gate:** New signups see "Book Your Call" screen until `onboarding_call_status === 'completed'`. Admin activates via directory panel.

## Build & Test
```bash
npm run dev          # Start dev server
npx tsc --noEmit     # Type check
npx next build       # Production build
```

## Critical: Server Component vs Client Component
**Never put `onClick`, `onChange`, or any event handler in a Server Component.** Turbopack dev server silently accepts it, but the production build (and Vercel) throws a 500 error: "Event handlers cannot be passed to Client Component props." This cost us all 149 city pages going down in production while working fine in dev.

If a component needs interactivity (click handlers, state, effects), it must have `"use client"` at the top. When a Server Component needs an interactive piece, extract that piece into a separate client component file and import it.

## Critical: State Column is 2-Letter Codes
The `doctors.state` column stores **2-letter US state abbreviations** (e.g. "SC", "TX", "CA"), NOT full names. Always use `resolveStateCode()` from `src/lib/resolve-state.ts` to convert user input to a code, then query with `.eq('state', code)`. **Never** use `.ilike('state', '%South Carolina%')` — this silently returns zero results and causes the search to fall back to a nationwide list.

## Database
- `profiles` table — user info (all roles), has authoritative `role` field
- `doctors` table — doctor listings, linked via `user_id`
- `students` table — student info
- `leads` table — password reset codes, email captures
- `notifications` table — in-app notifications
- `automation_queue` table — async jobs (geocoding, etc.)

## Pricing (US new-member rate changes Dec 1, 2026)
- New US doctors: $99/mo ($990/yr) through Nov 30, 2026, then $199/mo ($1,990/yr, saves $398) starting Dec 1, 2026 at 00:00 America/New_York. ONE tier, everything included, NO trial. Read the date from `src/lib/pricing.ts`. Do not hard-code the old price back onto signup, pricing, or upgrade screens.
- Doctors who already pay keep that rate, including $99/$990. Do not change a member's own subscription price or the label on their billing page.
- Student: $33/mo — one tier, includes monthly group call with Dr. Ray
- Patient: Free
- Vendors: Tiered (basic, professional, featured partner)
- Founding members: locked at original price, full Pro access
- Care Plan Closer: separate add-on (setup fee + small monthly, TBD)
- **Onboarding call with Dr. Ray required before account activation** for both doctors and students
