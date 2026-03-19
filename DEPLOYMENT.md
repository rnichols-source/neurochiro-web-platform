# NeuroChiro Web Platform - Deployment Guide

This document outlines the requirements and procedures for deploying the NeuroChiro Web Platform to production.

## 1. Prerequisites & Services

The platform relies on the following external services:
- **Vercel:** Hosting and Edge computing (Next.js 15 App Router).
- **Supabase:** PostgreSQL database, Row Level Security (RLS), and Authentication.
- **Stripe:** Subscription billing, payments, and webhooks.
- **Resend:** Transactional email delivery.
- **Mapbox (Optional):** Interactive map rendering for the directory.

## 2. Environment Variables

Ensure all required variables are set in your Vercel Project Settings before deploying. Refer to `.env.example` for the required keys.

## 3. Database Migration & Setup (Supabase)

Before the application goes live, the database schema and RLS policies must be applied.

1. **Schema Setup:** Run the schema migrations (if using Supabase CLI) or apply them directly via the SQL editor.
2. **Apply RLS Policies:** Execute the contents of `SUPABASE_RLS.sql` to enforce security boundaries.

## 4. Webhooks Configuration

### Stripe Webhooks
1. Go to your Stripe Dashboard -> Developers -> Webhooks.
2. Add an endpoint pointing to `https://your-domain.com/api/webhooks/stripe`.
3. Select the following events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy the **Signing Secret** (`whsec_...`) and add it to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`.

## 5. Deployment Steps (Vercel)

The project is optimized for deployment on Vercel.

1. Push your code to a Git repository (GitHub/GitLab).
2. Import the project into Vercel.
3. Configure the **Build Command** (default `npm run build`) and **Install Command** (default `npm install`).
4. Add the Environment Variables.
5. Click **Deploy**.

## 6. Performance Checks

- **Images:** All critical images should use the `next/image` component to leverage Vercel's automatic image optimization (WebP/AVIF formatting).
- **Maps:** Maps are currently rendered via static Mapbox image URLs. For interactive maps (e.g., using `react-map-gl`), ensure the component is dynamically imported with `{ ssr: false }` to prevent server-side rendering bottlenecks.
- **Edge Routing:** The custom RBAC middleware (`src/middleware.ts`) runs on the Edge, ensuring fast, localized permission checks without hitting the origin server for every request.
