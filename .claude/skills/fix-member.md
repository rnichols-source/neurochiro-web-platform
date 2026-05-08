---
name: fix-member
description: Fix a member's account issue — email change, password reset, missing doctor record, role fix, etc.
allowed-tools: Bash, Read
---

Help fix a member's account issue. Common scenarios:
- Change their email address (delete duplicate if exists, update auth + profiles table, confirm email)
- Reset their password or send them login instructions  
- Create a missing doctor record for a paid member
- Fix their role (e.g., stuck as 'patient' instead of 'doctor')
- Link an unclaimed doctor profile to their auth account

Always use the Supabase admin client via `npx tsx -e` with dotenv/config. Always verify the current state before making changes. Show what you found and what you plan to do before executing.
