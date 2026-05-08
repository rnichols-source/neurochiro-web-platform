---
name: deploy
description: Type check, commit, and push to deploy the latest changes
allowed-tools: Bash, Read
---

Deploy the current changes:
1. Run `npx tsc --noEmit` to type check — fix any errors before proceeding
2. Run `git status` and `git diff --stat` to see what changed
3. Show the user a summary of changes and ask for confirmation
4. Stage the relevant files, create a descriptive commit, and push to main
5. Confirm the push was successful
