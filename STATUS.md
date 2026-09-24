# NeuroChiro Platform Status

Last updated: 2026-09-24

---

## What's built and deployed

### Directory (patient-facing)
- **Location-first search** — ZIP/city primary input, geolocation, prompts instead of showing 148 unsorted results
- **Distance sort** — nearest first, always. Tier-based sorting removed from patient results.
- **Contact ungated** — phone, website, booking visible for all doctors regardless of tier. Flag-reversible via `NEXT_PUBLIC_GATE_CONTACT_INFO`.
- **Fake urgency removed** — "157 patients found their doctor" popups deleted site-wide
- **FOUNDER/PRO badges replaced** with Verified badge
- **Conversion tracking** — Book, Call, Directions, Profile View tracked in `conversion_events` table. No patient identifiers.
- **Cards clickable** — whole card links to profile, action buttons work independently

### City Pages (`/chiropractor/[city]-[state]`)
- 125 doctor cities + 24 empty metros, server-rendered
- 30-mile radius query with real geocoded city center coordinates
- Distance labels ("15 mi from Charleston") on every card
- No-doctors page: nearest doctors with distances, waitlist signup, "help me find someone" form
- Structured data (JSON-LD), sitemap entries, canonical tags, internal linking
- 301 redirect from old `/directory/city/` path

### Doctor Profiles
- **Phase 1 (claims):** fabricated stats removed, medical claims stripped from Spotlight descriptions, free-text tags filtered, metrics moved to dashboard
- **Phase 2 (cost/availability):** first visit price, payment model, insurance, HSA/FSA, hours, evening/weekend flags, walk-ins, telehealth. "Contact the office" fallback when empty.
- **Phase 3 (restructure):** sticky booking bar on mobile, Spotlight video moved to position 2, redundant sections collapsed, first visit info prominent
- **Phase 4 (structured fields):** short_intro, philosophy, chiropractic_school, degree, graduation_year, post_doctoral_training. Validated (no URLs in prose, character limits). Falls back to old bio/education when empty.
- **Phase 5 (reviews):** Google Reviews link field, renders "Read patient reviews on Google" on profile
- **Phase 6 (form safety):** date field labeled, medical details warning, privacy copy updated to match reality
- **Unclaimed profiles:** disclosure banner with claim + removal links
- **Specialty vocabulary:** 35 controlled terms, picker enforced, 82 unmapped tags in review queue

### Patient Email List
- Capture at `/list`, double opt-in, welcome sequence (3 emails), broadcast UI, doctor-joined trigger
- Admin dashboard at `/admin/list` with ZIP-based recruiting targets
- Dedup on doctor-joined notifications

### /pro Sales Page
- Full sales page with math block, honest no-guarantee, source tracking
- Monthly ($99) + Annual ($990) Stripe links + Calendly fit call

### Data Privacy
- Discord webhooks: no patient data in any webhook (first name only for all)
- Admin leads list: message body hidden, detail view logged
- 12-month lead retention policy via weekly cron
- Privacy copy on consultation form matches reality

### Data Quality
- City/state normalized (133 states, 8 cities, 3 manual geocode fixes)
- 8 international doctors flagged with country column
- Validation on save: state must be 2-letter US abbr, city can't contain addresses
- Specialty vocabulary enforced, no free text

---

## Outstanding from the directory spec

### Needs code
- **Directory Phase 2:** surface insurance, evening/weekend, walk-ins, telehealth as filters on the directory cards
- **Directory Phase 3:** symptom-to-specialty mapping, natural language search
- **Directory Phase 5:** empty result experience (nearest doctors + waitlist + "help me find someone" on the main directory, not just city pages)
- **Directory Phase 7:** light theme behind a flag
- **Profile completeness meter in dashboard** — built but needs the frontend picker for specialties (currently a text input, should be a multi-select from vocabulary)
- **Conversion admin view** — `conversion_events` table exists but no admin dashboard to view Book/Call/empty-result rates over time

### Needs me (Dr. Ray), not code
- **Kaden's bio** — scraped text ending in a URL. Rewrite via admin editor at `/admin/directory`.
- **D'Amico's profile** — bio pasted into specialty field, needs full rebuild in admin.
- **5 NeuroFunctional Care doctors** — ask them what they mean, then add to vocabulary or map to existing term.
- **Dr. Tiffany Johnson** — "Polyvagal-Informed Care" in review queue, ask her.
- **82 specialty review queue tags** — work through in `/admin/list` or Supabase table `specialty_review_queue`.
- **27 unclaimed business-name profiles** (13 with partial data, visible) — work through, contact practices, get real doctor names.
- **Google Reviews URLs** — add to each doctor's profile in their dashboard. High-value field.
- **Cost & insurance fields** — empty for all doctors. Prompt them to fill in during onboarding calls.

---

## Migrations to run (if not already)
Check Supabase SQL Editor. All should be done, but verify:
- `sql/cost_availability_fields_migration.sql`
- `sql/structured_profile_fields_migration.sql`
- `sql/google_reviews_url_migration.sql`
- `sql/specialty_review_queue_migration.sql`
- `sql/find_requests_migration.sql`
- `sql/conversion_events_migration.sql`
- `sql/subscribers_migration.sql`
- `sql/doctor_notifications_migration.sql`
