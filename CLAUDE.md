# NeuroChiro Web Platform

## Project Overview
NeuroChiro (neurochiro.co) is the global directory and platform for nervous system chiropractors. Five user roles: Doctors, Students, Patients, Vendors, and Admin. Doctors pay $49-$129/mo (Basic, Growth, Pro). Students pay $12/mo. Patients are free. Doctors can claim a pre-built profile for free but dashboard is locked until they subscribe.

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
- **All doctors and students are paid** — Basic $49/mo, Growth $69/mo, Pro $129/mo for doctors; $12/mo for students. Patients free.
- **The doctors table requires admin client for writes** — RLS blocks regular client updates

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

## Pricing (Updated July 2026)
- Doctor Pro: $49/mo ($490/yr) — ONE tier, everything included, 7-day trial
- NO free tier for claimed profiles. NO Growth tier. NO $69/$129.
- Unclaimed profiles visible with masked contact info, "Claim" CTA leads to $49/mo signup
- Student: $12/mo ($120/yr) — one tier, everything included
- Patient: Free
- Vendors: Tiered (basic, professional, featured partner)
- Founding members: locked at original price, full Pro access
