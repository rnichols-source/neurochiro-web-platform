---
name: lookup-doctor
description: Look up a doctor in the NeuroChiro database by name, email, or clinic
allowed-tools: Bash
---

Look up a doctor in the Supabase database. Search the `doctors` table and `profiles` table by name, email, or clinic name. Also check the auth user status (email confirmed, last sign in). Show all relevant info including their user_id, verification_status, membership_tier, slug, and whether they have a linked auth account.

Use `npx tsx -e` with dotenv/config and the Supabase admin client to query the database.
