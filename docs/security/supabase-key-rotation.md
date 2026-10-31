# Supabase key rotation

The public site was shipping the Supabase admin key to browsers because `NEXT_PUBLIC_SUPABASE_ANON_KEY` held the service-role key. These steps replace it. Do them in order. Steps 1–6 can be done in about 30 minutes.

Do not paste key values into chat, pull requests, or this file.

1. **Create the new keys.** Go to Supabase Dashboard → project `gddapefwrmucimpdhjrz` → Settings → **API Keys** → "Publishable and secret API keys" tab → **Create new API keys**. This adds a `sb_publishable_…` and an `sb_secret_…` key. The old keys keep working for now.
2. **Check RLS (read-only).** In the SQL Editor, paste `sql/rls_audit_readonly.sql` and run it. It only reads. Send the output to Grok Bot, and only then decide whether to run `supabase/migrations/20261101000000_portal_rls.sql`.
3. **Update Vercel Preview env first.** Go to Vercel → project serving neurochiro.co → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the **publishable** key (Preview)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the same publishable key (Preview). This replaces the wrong value.
   - `SUPABASE_SECRET_KEY` = the **secret** key (Preview, marked Sensitive)

   Redeploy the PR A preview, then run the test plan from PR A. The build will **fail on purpose** if a public var still holds a secret key.
4. **Merge PR A, then set Production the same way.** Set the same 3 vars for Production, set `SUPABASE_SERVICE_ROLE_KEY` = the new secret key (Production + Preview), and redeploy production. Then run `node scripts/check-public-bundle.mjs https://www.neurochiro.co`. It must print **PASS**.
5. **Update every other place that has a Supabase key:**
   - the other Vercel projects (`neurochiro-web-platform`, `raymondnichols`, `neurochiro-staging`, `master-neurochiro-mdnr`; check which one serves the domain)
   - your local `.env`
   - GitHub Actions secrets (if any)
   - Supabase Database Webhooks / Edge Functions / `pg_net` jobs
   - n8n/Zapier/ManyChat or any other tool that calls Supabase
6. **Kill the leaked key.** Go to Supabase → Settings → API Keys → **Legacy API keys** → **Disable legacy API keys**. This turns off both the leaked service_role key and the old anon key. Then go to Settings → **JWT Keys** and migrate to JWT signing keys, then **revoke the legacy JWT secret**. Supabase's guide: https://supabase.com/docs/guides/security/rotate-leaked-api-keys. If anything breaks, move that caller to the new key. **Don't re-enable the legacy keys**, because that restores the leaked one.
7. **Rotate the Resend API key.** Go to Resend → API Keys, create a new key, update `RESEND_API_KEY` in Vercel, then delete the old key. The old one is in the public repo.
8. **Reset leaked passwords:** Dr. Kara Zuleg's account (her temp password was in `promote-kara.js`), `drray@neurochirodirectory.com` if it ever used the seed password, and any account created by `scripts/create-sebastian.ts`/`seed-test-users.ts`.
9. **Make the GitHub repo private.** Go to GitHub → repo Settings → General → Danger Zone → Change visibility → Private. Vercel keeps deploying from a private repo. Rotating the keys (steps 6–7) makes the copies in git history useless, so a history rewrite is optional.
10. **Look for misuse.** Go to Supabase → Logs → API/Edge logs and filter for requests using the service role from unknown IPs or user agents since the key went public. Check Authentication → Users for accounts you don't recognise, and check `leads`/`doctors` for unexpected edits or deletes.
11. **Delete test data** using `sql/portal_test_data_cleanup.sql`. Run each SELECT first, then the DELETE inside `BEGIN … COMMIT`. Delete auth users from Authentication → Users.
12. **Fix the "New Beginnings" seminar date** in admin, and approve or flip the feature-state table in `src/config/portal-features.ts`. Confirm whether The Weekly Adjustment is currently running.
13. Send Grok Bot the preview links to review.
14. **Referrals (after PR C is reviewed):** read `supabase/migrations/20261102000000_referrals_v2.sql`, run it in the Supabase SQL Editor, and confirm the `referral-attachments` bucket shows as **Private** under Storage. Then flip `referrals` to `live` in `src/config/portal-features.ts`.
15. Decide whether to add a real "techniques" field to doctor profiles (today the technique filter uses specialty tags).
16. Tell members once it's live, if you want to. Referrals sent from public profiles before this fix weren't delivered.
17. **Messaging check (read-only, after PR A is live):** in the Supabase SQL Editor run `sql/messaging_audit_readonly.sql` and send Grok Bot the output. It shows which old policies/triggers are live and whether there are duplicate threads or messages that look tampered with. Then decide: should admin accounts be able to read **every** private message (today's legacy policy), or only reported ones? (Recommended: only reported.)
18. **Create two test doctors for the messaging tests** (e.g. `e2e-doctor-a@…` and `e2e-doctor-b@…`, using an inbox you control), verified and on a paid tier. Set `profiles.is_test = true` for both after the migration, so they never appear in the directory or search. Put their logins into the Vercel **Preview** env or your local `.env.e2e` (never in chat or the repo) as `E2E_DOCTOR_A_EMAIL/PASSWORD`, `E2E_DOCTOR_B_EMAIL/PASSWORD`, plus `E2E_ALLOW_WRITES=1`, then run `npx playwright test e2e/messaging.spec.ts` against the PR D preview URL. Note: previews use the same Supabase database as production, which is why only these two test accounts are ever messaged.
19. Decide what happens to message history when a member deletes their account. Today it's deleted for the other person too. Recommended: keep the thread and show "Former member".
20. After reviewing PR D, run `supabase/migrations/20261103000000_messaging_hardening.sql` (and the duplicate-merge block only if the audit found duplicates). Then flip `messagingV2` to `live` in `src/config/portal-features.ts`.

After step 4, confirm the public bundle:

```bash
node scripts/check-public-bundle.mjs https://www.neurochiro.co
```

It must print `PASS: only anon/publishable keys found`. It never prints a key.
