---
name: stats
description: Show current NeuroChiro platform stats — doctor count, signups, states, tier breakdown
allowed-tools: Bash
---

Pull current platform stats from Supabase and display a clean summary:
- Total doctors (verified vs pending)
- Total students
- Total profiles/users
- Tier/membership breakdown
- Top states by doctor count
- Countries represented
- Recent signups (last 7 days)

Use `npx tsx -e` with dotenv/config and the Supabase admin client.
