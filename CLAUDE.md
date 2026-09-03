# NeuroChiro Web Platform

## Project Overview
NeuroChiro (neurochiro.co) is the global network and platform for nervous system chiropractors. Five user roles: Doctors, Students, Patients, Vendors, and Admin. Doctors pay $99/mo ($990/yr). Students pay $33/mo. Patients are free. All new doctors and students must complete a personal onboarding call with Dr. Ray before their account is activated. No free tier. No trial.

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
- `src/lib/stripe-links.ts` — Stripe payment links for doctor/student signups

## Critical Rules
- **All features must use Supabase** for data — never localStorage (cross-device sync requirement)
- **Doctor Pro: $99/mo ($990/yr). Student: $33/mo.** No free tier, no trial. Onboarding call required.
- **The doctors table requires admin client for writes** — RLS blocks regular client updates
- **Onboarding call gate:** New signups see "Book Your Call" screen until `onboarding_call_status === 'completed'`. Admin activates via directory panel.

## Build & Test
```bash
npm run dev          # Start dev server
npx tsc --noEmit     # Type check
npx next build       # Production build
```

## Database
- `profiles` table — user info (all roles), has authoritative `role` field
- `doctors` table — doctor listings, linked via `user_id`
- `students` table — student info
- `leads` table — password reset codes, email captures
- `notifications` table — in-app notifications
- `automation_queue` table — async jobs (geocoding, etc.)

## Pricing (Updated August 2026)
- Doctor Pro: $99/mo ($990/yr) — ONE tier, everything included, NO trial
- Student: $33/mo — one tier, includes monthly group call with Dr. Ray
- Patient: Free
- Vendors: Tiered (basic, professional, featured partner)
- Founding members: locked at original price, full Pro access
- Care Plan Closer: separate add-on (setup fee + small monthly, TBD)
- **Onboarding call with Dr. Ray required before account activation** for both doctors and students
