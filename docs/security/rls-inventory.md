# RLS inventory (from code, Oct 31 2026)

Read-only SQL for the live database is `supabase/checks/20261031_rls_inventory.sql`. It has not been run. Counts below are the Oct 31 anon `count=exact` audit. A count of 0 is not treated as proof the table is protected.

Staff roles in code (`isAdminRole`) match the emergency SQL: `admin`, `super_admin`, `founder`, `regional_admin`. Confirm the live role list with Step 0 before running the SQL.

## Doctors columns

Stale generated types plus columns the directory search already reads.

| Column | Public? |
| --- | --- |
| id, slug, first_name, last_name, clinic_name, city, state, country, zip_code, address, latitude, longitude | Yes. On the public card or map. |
| instagram_url, facebook_url, website_url, bio, specialties, rating, review_count | Yes. |
| verification_status, membership_tier, is_hiring, is_mentoring, region_code | Yes. Used to filter the directory. |
| photo_url, video_url, seo_keywords, created_at, updated_at, profile_views | Yes. |
| is_founding_member, accepting_new_patients, offers_telehealth, accepts_walkins, languages, hours, booking_url | Yes. Live search reads these. Not all are in `src/types/supabase.ts`. |
| email | No. Private. |
| phone | No in `PUBLIC_DOCTOR_COLUMNS`. Still selected by `src/lib/directory/search.ts` and `src/app/(public)/directory/actions.ts` so DoctorCard can render a `tel:` link. Section E of the migration is the ask-first revoke. |
| user_id | No. Not needed on a public card. |
| stripe_* (if present) | No. |
| license columns (if present) | No. |
| notes columns (if present) | No. |
| patient_leads, average_case_value, referral_code, referred_by, google_place_id | No. Internal. |

`src/lib/security/public-columns.ts` is the section E list. Admin directory search stays on the service role and may read email.

## What anon could count on Oct 31

Exposed (count greater than 0): profiles 236, leads 252, job_applications 2, students 3, automation_queue 555, match_cycles 1, doctors 203 (doctors are supposed to be public).

Returned 0. Do not assume they are protected: messages, conversations, doctor_referrals, seminar_registrations, contact_requests, course_progress, student_calls, student_call_secrets, student_call_rsvps, shadow_requests, ai_usage, student_notices, and every `match_*` table except `match_cycles`.

## Tables

One row for every table in `src/types/supabase.ts` and every `create table` in `supabase/migrations/`. `match_cycles` and `contact_requests` are included because the audit and L6 name them; they are created under `sql/`, not in a migration.

| Table | Who should read | Who should write | Code path | Audit anon | Gap and fix |
| --- | --- | --- | --- | --- | --- |
| profiles | Own row, or staff | Own allowlisted columns. Role, tier, and stripe_customer_id are server-only. | Browser own row: `src/components/layout/Sidebar.tsx`, portal and doctor settings. Server admin: `src/lib/admin-auth.ts`. | 236 exposed (email, role, tier, Stripe customer id) | L0/L2 revoke anon and drop open SELECT. Trigger blocks privileged columns. Column update grant is the allowlist. Temp authenticated-read-all policy is dropped in L2. |
| doctors | Anon for public columns | Owner or staff. Membership tier changes stay on the server. | `src/lib/directory/search.ts` admin client, explicit columns, includes phone. `src/app/(public)/directory/actions.ts` explicit columns. Admin `select('*')` is staff-only. | 203, expected | Section E asks before revoking table select. Phone stays in the live search until then. |
| students | Own row, or staff. Never anon. | Own profile fields only. Never school_verified, verified_at, or verification_token. | Public map removed in `src/app/(public)/directory/actions.ts`. Own row: `src/app/(student)/student/jobs/page.tsx` `.eq('id', user.id)`. | 3 exposed (school email and verification token) | L0/L2. Token column select revoked. Tokens hashed in code. |
| seminars | Anon for published rows | Host or staff | `src/app/(public)/seminars/actions.ts` | Not in the count. Reason: audit did not query it. Treat as public content. | No change. Confirm policies with the inventory SQL. |
| vendors | Anon for active marketplace rows | That vendor, or staff | `src/app/actions/vendors.ts` | Not in the count. Reason: audit did not query it. | Role change to vendor moved to the admin client. |
| audit_logs | Server only | Server only | Admin tooling | Not in the count. Reason: audit did not query it. | Confirm no anon policy. |
| leads | Staff. Anon may insert. | Public forms insert. Staff update. | `src/app/actions/leads.ts` insert without `.select()`. `src/app/(public)/seminars/actions.ts` insert. Admin leads stay on the user client after `checkAdminAuth()`. | 252 exposed | L0/L2. Insert policy has no returning select. |
| notifications | Own row | Server, or the user for read state | `src/lib/messaging/db.ts` admin client | Not in the count. Reason: audit did not query it. | Confirm own-row policy. |
| notification_preferences | Own row | Own row | Read with profiles.notification_preferences | Not in the count. Reason: audit did not query it. | Allowlisted on profiles when the column lives there. |
| automation_queue | Staff and server | Server after `checkAdminAuth()` | Was a browser insert in `src/components/admin/AnnouncementBuilder.tsx`. Now a server action. | 555 exposed | L0/L2. Browser insert removed. |
| job_postings | Anon for open posts | The doctor who owns the post | `src/app/(public)/jobs/actions.ts` | Not in the count. Reason: audit did not query it. Public board. | Leave public. |
| applications | The candidate, the hiring doctor, staff | Those parties | `src/app/(doctor)/doctor/jobs/actions.ts` after an ownership check, admin client | Not in the count. Reason: audit did not query it. | Open anon SELECT policies dropped in L2 if they exist. |
| job_applications | The applicant, staff, the hiring doctor | Server on apply | Student page now uses `src/app/(student)/student/jobs/actions.ts` (admin, session user only). | 2 exposed | L0/L2. Browser `.from('job_applications')` removed. |
| seminar_registrations | The host of that seminar, the registrant, staff | Server | `src/app/(doctor)/doctor/seminars/actions.ts` loads rows only after `host_id = user.id`, then reads attendee email on the admin client. | 0, not proven protected | Confirmed in this inventory. Embed of `profiles(...)` removed. |
| conversations | Participants and staff | Participants via server | `src/lib/messaging/db.ts` admin client, participant check | 0, not proven protected | Confirmed. No anon path in app code. |
| messages | Participants and staff | The sender, via server | `src/lib/messaging/db.ts` | 0, not proven protected | Confirmed. No anon path in app code. |
| announcements | Signed-in users for active rows | Staff | `src/components/admin/AnnouncementBuilder.tsx` still inserts announcements from the browser if that policy allows. Queue insert does not. | Not in the count. Reason: audit did not query it. | Queue split out. |
| announcement_dismissals | Own row | Own row | Client dismiss, own user id | Not in the count. Reason: audit did not query it. | Confirm own-row policy. |
| market_benchmarks | Staff or server | Server | Benchmark pages | Not in the count. Reason: audit did not query it. | No open policy found in migrations. Confirm with SQL. |
| analytics_events | Server | Server | Portal stats, admin client | Not in the count. Reason: audit did not query it. | Confirm no anon select. |
| contracts | The doctor who owns the row | That doctor or server | Doctor tools | Not in the count. Reason: audit did not query it. | Confirm own-row policy. |
| daily_logs | The owning user | That user | Portal | Not in the count. Reason: audit did not query it. | Confirm own-row policy. |
| patient_stories | Published rows may be public | The doctor or staff | Public stories if a page selects published only | Not in the count. Reason: audit did not query it. | Do not open unpublished rows. |
| courses | Anon for published courses | Staff | Academy | Not in the count. Reason: audit did not query it. Public content if published. | Confirm a published filter. |
| course_progress | Own row | Own row | Student academy | 0, not proven protected | Confirmed. Keep own-row. |
| host_profiles | Anon for public host pages | That host or staff | `src/app/(public)/hosts/[id]/actions.ts` | Not in the count. Reason: audit did not query it. | `sql_archive` has an open select. Confirm live policy before tightening. |
| email_preferences | Own row or server | Own row or server | Unsubscribe flow | Not in the count. Reason: audit did not query it. | Confirm no anon table read. |
| processed_webhooks | Server only | Server only | Stripe webhook | Not in the count. Reason: audit did not query it. | Server only. |
| campaigns | Staff | Staff or server | Admin | Not in the count. Reason: audit did not query it. | Confirm no anon select. |
| seminar_ticket_types | Anon for active tickets on a public seminar | Host or server | `src/app/(doctor)/doctor/seminars/actions.ts` | Not in the count. Reason: audit did not query it. | Created in `20261031120000_seminars_phase1.sql`. |
| seminar_outbound_clicks | Server | Server | Seminar analytics | Not in the count. Reason: audit did not query it. | Same migration. |
| seminar_email_jobs | Server | Server | Seminar mailer | Not in the count. Reason: audit did not query it. | RLS enabled in that migration. |
| lead_notifications | Server | Server | Lead follow-up | Not in the count. Reason: audit did not query it. | `20261030000000_lead_followup.sql`. |
| link_clicks | Server | Server | Click tracking | Not in the count. Reason: audit did not query it. | `20261022_click_tracking.sql`. |
| doctor_referrals | The two doctors and staff | Server | `src/lib/referrals/` admin client | 0, not proven protected | Confirmed. `20261020_create_doctor_referrals.sql`. |
| job_post_views | Server | Server via `record_job_view` | `src/lib/jobs/board.ts` admin RPC | Not in the count. Reason: audit did not query it. | Anon execute on `record_job_view` revoked in L2. |
| student_email_sends | Server | Server | Job board mail | Not in the count. Reason: audit did not query it. | `20261105000000_job_board_v2.sql`. |
| portal_logins | Own row and staff | Server | Portal login log | Not in the count. Reason: audit did not query it. | `20261101010000_portal_logins.sql`. |
| match_profiles | The user and staff | The user or server | ChiroMatch | 0, not proven protected | Confirmed. `20261106000000_chiromatch_v1.sql`. |
| match_interests | The two users and staff | The sender, via server | `src/lib/match/store.ts` | 0, not proven protected | Confirmed. |
| matches | The two users and staff | Server | `src/lib/match/store.ts` | 0, not proven protected | Confirmed. |
| match_outcomes | The two users and staff | Server | Match outcome flow | 0, not proven protected | Confirmed. |
| match_weights | Staff or server | Server | Scoring config | 0, not proven protected | Confirmed. Not a public schedule. |
| match_outcome_tokens | Server only | Server | Outcome links | 0, not proven protected | Confirmed. Token table. |
| match_outcome_prompts | Server | Server | `src/lib/match/prompts.ts` | 0, not proven protected | Confirmed. |
| seminar_hosts | Public host page or staff | Staff | Seminar hosts | Not in the count. Reason: audit did not query it. | `20261031130000_seminars_phase2.sql`. |
| host_packages | Public pricing or staff | Staff | Host packages | Not in the count. Reason: audit did not query it. | Same migration. |
| seminar_featured_purchases | The buyer and staff | Server | Stripe | Not in the count. Reason: audit did not query it. | Same migration. |
| seminar_audit_log | Staff | Server | Seminar audit | Not in the count. Reason: audit did not query it. | Same migration. |
| student_calls | Signed-in students and staff. Not anon. | Staff or server | Student membership migration | 0, not proven protected | Confirmed. Authenticated policy is `using (true)`. Section E4 asks before narrowing it. |
| student_call_secrets | Server only | Server only | Migration comment: no client policies | 0, not proven protected | Confirmed. Join links must stay off anon. |
| student_call_rsvps | Own row | Own row | `user_id = auth.uid()` in the membership migration | 0, not proven protected | Confirmed. |
| student_roadmap_progress | Own row | Own row | Own-row policy in that migration | Not in the count. Reason: audit did not name it. | Keep own-row. |
| shadow_requests | The student and the doctor on that row | Those users, via server | Own-row policies in the membership migration | 0, not proven protected | Confirmed. |
| ai_usage | Server | Server | Membership migration, RLS on | 0, not proven protected | Confirmed. |
| student_notices | Own row | Server | Grace and membership notices | 0, not proven protected | Confirmed. |
| quiz_events | Server | Server | Quiz funnel. Migration not run yet. | Not in the count. Reason: table is not applied. | Do not overwrite `20261107000000_quiz_events.sql`. |
| referral_attachments | The doctors on that referral | Server | Referrals v2 | Not in the count. Reason: audit did not query it. | `20261102000000_referrals_v2.sql`. |
| referral_emails | Server | Server | Referral mail | Not in the count. Reason: audit did not query it. | Same migration. |
| doctor_favorites | Own row | Own row | Doctor favorites | Not in the count. Reason: audit did not query it. | Same migration. |
| user_blocks | The blocker | The blocker, via server | `src/lib/messaging/db.ts` | Not in the count. Reason: audit did not query it. | `20261020_messaging_rebuild.sql`. |
| message_reports | Staff | The recipient, via server | `src/lib/messaging/db.ts` | Not in the count. Reason: audit did not query it. | Same migration. |
| conversation_mutes | Own row | Own row, via server | `src/lib/messaging/db.ts` | Not in the count. Reason: audit did not query it. | Same migration. |
| message_email_log | Server | Server | Messaging mail log | Not in the count. Reason: audit did not query it. | Same migration. |
| match_cycles | Staff in the database. The app returns the schedule through the service role. | Staff via the admin client | `src/lib/portal/context.ts` admin. Student and doctor actions moved to the admin client with an explicit column list. | 1 exposed | Fixed in L2: anon select revoked, open policy dropped, staff select remains. Columns are schedule only (name, season, year, status, dates). |
| contact_requests | The doctor and staff | Server | `src/lib/portal/stats-load.ts` admin client | 0, not proven protected | Confirmed. Created under `sql/`, not a migration. Included because L6 names it. |

## Omitted on purpose

These names appear under `sql/` or `sql_archive/` and are not created by `supabase/migrations/` and are not in `src/types/supabase.ts`. The inventory SQL still lists every live `public` table when Raymond runs it. They are omitted here so this doc does not invent a policy for a table the migrations do not own: subscribers, chiro_schools, ce_certificates, demand_mentions, reply_logs, outreach_prospects, slug_redirects, conversion_events, site_activity, pl_snapshots, kpi_entries, course_purchases, patient_checkins, patient_exercises, patient_articles_read, patient_requests, technique_quiz_state, interview_prep_state, financial_plans, student_certifications, employer_feedback, doctor_tool_data, vendor_content, reply_templates, outreach_targets, sequence_state, subscriptions, vendor_rfps, vendor_products, vendor_reviews, zip_codes.

`match_positions` is in that SQL set and is restricted in L2 (anon select revoked, "Anyone can read active positions" dropped). Doctor-owned rows stay on the existing doctor policy. Student position lists already use the admin client. It is not in `src/types/supabase.ts`. It is named here so the match gap is not silent.

## Security definer functions the code calls

| Function | Who calls it | Anon |
| --- | --- | --- |
| seminar_reserve_seat | `src/app/(public)/seminars/register-actions.ts` via admin | Revoke in L2. Not a browser RPC. |
| create_match_if_mutual | `src/lib/match/store.ts` via admin | Revoke in L2. |
| record_job_view | `src/lib/jobs/board.ts` via admin. Public jobs page does not call it with the publishable key. | Revoke in L2. |
| get_inbox, get_unread_summary | `src/lib/messaging/db.ts` with the user session, if the function exists | Revoke anon in L2 when the function is installed. Authenticated execute stays. |

The live list is whatever section A and the inventory SQL return. Do not treat this table as complete for the database.
