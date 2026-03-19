# NeuroChiro Web Platform - Architecture & Implementation Plan

**Project Name:** NeuroChiro Web Platform (`neurochiro-web-platform`)
**Version:** 1.0.0
**Date:** March 5, 2026

## 1. Sitemap

### Public
- `/` (Home)
- `/about` (About NeuroChiro)
- `/directory` (Find a Chiropractor - Search & Map)
- `/directory/[doctor_slug]` (Doctor Profile)
- `/learn` (Education Hub)
- `/learn/[topic_slug]` (Article/Video)
- `/seminars` (Public Seminar Listing)
- `/seminars/[seminar_id]` (Seminar Details)
- `/jobs` (Public Job Board Preview)
- `/pricing` (Membership Tiers)
- `/contact`
- `/login`
- `/register` (Role Selection: Patient, Student, Doctor)

### Patient Portal (`/portal`)
- `/portal/dashboard` (Pulse/Home)
- `/portal/track` (Nervous System Tracking)
- `/portal/care` (My Doctors & Plans)
- `/portal/learn` (Personalized Education)
- `/portal/settings`

### Student Portal (`/student`)
- `/student/dashboard`
- `/student/academy` (LMS)
- `/student/seminars` (Student-specific view)
- `/student/jobs` (Job Board & Applications)
- `/student/mentorship` (Find a Mentor)
- `/student/profile` (CV & Portfolio)

### Doctor Portal (`/doctor`)
- `/doctor/dashboard` (Analytics & Insights)
- `/doctor/profile` (Edit Public Profile)
- `/doctor/network` (Referral Network)
- `/doctor/recruit` (Job Postings & Candidate Search)
- `/doctor/seminars` (Host & Manage Seminars)
- `/doctor/settings` (Billing & Account)

### Admin Portal (`/admin`)
- `/admin/dashboard` (Platform Stats)
- `/admin/users` (User Management)
- `/admin/content` (CMS for Learn/Academy)
- `/admin/approvals` (Doctor Verification, Job Posts)
- `/admin/system` (Settings & Logs)

### Programs
- `/mastermind` (Landing Page)
- `/mastermind/dashboard` (Member Area)
- `/council` (Landing Page)
- `/council/dashboard` (Member Area)

---

## 2. Route Structure (Next.js App Router)

```text
src/app/
├── (public)/
│   ├── page.tsx
│   ├── about/
│   ├── directory/
│   │   ├── page.tsx
│   │   └── [slug]/
│   ├── learn/
│   └── ...
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (portal)/
│   ├── layout.tsx (Patient Layout)
│   ├── portal/
│   │   └── ...
├── (student)/
│   ├── layout.tsx (Student Layout)
│   ├── student/
│   │   └── ...
├── (doctor)/
│   ├── layout.tsx (Doctor Layout)
│   ├── doctor/
│   │   └── ...
├── (admin)/
│   ├── layout.tsx (Admin Layout)
│   ├── admin/
│   │   └── ...
└── api/
    ├── webhooks/
    │   └── stripe/
    └── ...
```

---

## 3. Role-Based Access Control (RBAC)

**Roles:** `public`, `patient`, `student_free`, `student_paid`, `doctor_non_member`, `doctor_member`, `admin`, `mastermind`, `council`.

**Implementation:**
- **Database:** `users` table with `role` and `subscription_tier` columns.
- **Middleware:** `src/middleware.ts` checks user session and role claims. Redirects unauthorized access.
- **RLS (Row Level Security):** Supabase policies to restrict data access at the database level.

**Matrix:**
| Feature | Public | Patient | Student (Free) | Student (Paid) | Doctor (Non) | Doctor (Mem) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Directory Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Patient Data | ❌ | Own | ❌ | ❌ | ❌ | Connected | All |
| Academy Content | ❌ | ❌ | Preview | Full | ❌ | Full | Full |
| Post Jobs | ❌ | ❌ | ❌ | ❌ | Paid | Included | ✅ |
| Apply to Jobs | ❌ | ❌ | View | Apply | ❌ | ❌ | ✅ |
| Mastermind | ❌ | ❌ | ❌ | ❌ | ❌ | Invitation | Manage |

---

## 4. Database Schema (Supabase/PostgreSQL)

```sql
-- Enums
create type user_role as enum ('patient', 'student', 'doctor', 'admin');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

-- Users (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  role user_role not null default 'patient',
  full_name text,
  avatar_url text,
  stripe_customer_id text,
  subscription_status subscription_status,
  created_at timestamptz default now()
);

-- Doctors
create table public.doctors (
  id uuid references public.profiles not null primary key,
  slug text unique,
  specialties text[],
  techniques text[],
  bio text,
  clinic_name text,
  location_lat float,
  location_lng float,
  is_verified boolean default false
);

-- Students
create table public.students (
  id uuid references public.profiles not null primary key,
  school text,
  graduation_year int,
  interests text[],
  is_looking_for_mentorship boolean default false
);

-- Content (Academy/Learn)
create table public.content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  body text,
  type text check (type in ('article', 'video', 'course')),
  access_level text check (access_level in ('public', 'student_free', 'student_paid', 'doctor'))
);

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors,
  title text not null,
  description text,
  location text,
  status text default 'open'
);

-- Seminars
create table public.seminars (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles,
  title text not null,
  date timestamptz,
  location text,
  price decimal
);
```

---

## 5. Branding & UX

**Colors:**
- **Navy:** `#1E2D3B` (Primary Brand)
- **Orange:** `#D66829` (Action/Accent)
- **Cream:** `#F5F3EF` (Backgrounds)
- **Black:** `#131313` (Text)
- **Gray:** `#4B5563` (Secondary Text)

**Typography:**
- **Headings:** `Lato` (Bold, assertive)
- **Body:** `Montserrat` (Clean, modern)

**Design System (Tailwind):**
- `bg-neuro-navy`
- `text-neuro-orange`
- `font-heading`
- `font-body`

---

## 6. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database/Auth:** Supabase
- **Payments:** Stripe
- **Email:** Resend
- **Maps:** Mapbox or Google Maps API

---

## 7. Build Phases

1.  **Scaffolding:** Setup Next.js, Tailwind, Fonts, Supabase client.
2.  **Auth & Profiles:** Login/Register flows, Profile creation for different roles.
3.  **Public Directory:** Doctor listings, search, map integration.
4.  **Dashboards V1:** Basic role-specific layouts (Student, Doctor, Patient).
5.  **Content Engine:** Academy and Learn sections with CMS.
6.  **Marketplace:** Job board and Seminar listings.
7.  **Payments:** Stripe integration for memberships.
8.  **Advanced Features:** Tracking for patients, Analytics for doctors.

