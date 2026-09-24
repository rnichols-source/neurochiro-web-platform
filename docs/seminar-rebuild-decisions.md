# Seminar Page Rebuild — Decisions Log

Updated: 2026-09-11

## RLS Hotfix (shipping today)

### Seminars Table
- RLS ON. Anon SELECT approved only. Authenticated SELECT approved + own.
- No INSERT/UPDATE/DELETE policies for anon or authenticated.
- All writes through service-role server actions that verify auth and whitelist fields.
- Column-level grants: REVOKE ALL, GRANT SELECT on public columns only.
- Hidden from anon/authenticated: admin_notes, payment_status, host_type_at_submission, featured_image_url, venue.
- Every future column needs an explicit grant decision.
- increment_seminar_page_view: single-purpose RPC, service_role only, SET search_path = '', schema-qualified.
- Page view beacon: /api/seminars/pageview, validates UUID, skips bots, per-IP throttle (in-memory, won't hold across serverless instances — acceptable for now), always returns 204, only increments approved seminars.
- Membership check: isPaidMember = membership_tier === 'pro'. All paid doctors get 'pro' from Stripe webhook (hardcoded server-side). free/null/undefined/unknown = not paid.
- Non-members: is_approved=false, payment_status='pending'. Requires admin approval.
- Paid external hosts: Stripe webhook sets is_approved=false, payment_status='paid'. Admin approves manually. Discord notification already in place.
- registration_link validated as HTTPS on create and update.
- Deploy order: code first (explicit column lists work against current table), verify site, then run SQL.

### Seminars Checkin (report only, not fixing today)
- POST /api/seminars/checkin: auth check via getUser (line 9). Checks seminar_registrations for matching profile_id or user_id (line 22). Anyone registered can check in — no proximity/time/admin gate. Could allow check-in without attending. Low risk for now (CE certificates are informational, not state-accepted).

### Backlog (noted, not fixing today)
- automations.ts:288 writes latitude/longitude to seminars (columns don't exist, silently fails)
- automations.ts:760 writes is_boosted/promotion_tier (columns don't exist, silently fails)
- cron/student-opportunity selects `date` instead of `dates` (column name bug)
- admin/search selects `state` from seminars (column doesn't exist)
- Per-IP throttle on pageview route is in-memory, resets on cold start. Consider KV or rate-limit middleware.

## Stripe Tier Derivation (verified)
- checkout.session.completed: membershipTier = 'pro' (hardcoded line 63 of stripe webhook). metaTier from metadata is read but never used.
- customer.subscription.updated: newTier = subscription.status === 'active' ? 'pro' : 'free' (line 916). Derived from Stripe subscription status.
- automations.ts subscription_updated: newTier from priceToTier map keyed on Stripe price ID (line 841-852). Not from client input.
- All membership_tier writers use admin/service role client.

## Admin Auth
- checkAdminAuth: reads profiles.role via admin client (service role). user_metadata fallback REMOVED (users can edit their own metadata).
- Admin roles: ['founder', 'admin', 'super_admin', 'regional_admin'] via isAdminRole().
