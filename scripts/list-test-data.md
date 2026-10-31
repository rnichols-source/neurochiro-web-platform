# Portal test data — what each suggestion means

Do not run these yourself from the app. Raymond reviews `sql/portal_test_data_cleanup.sql`, runs each SELECT, then decides.

1. **Sophia Chen demo doctor.** A fake listing (`dr-sophia-chen-demo`) and the login `drsophia@neurovitalchiro.com`. Remove the row only after you confirm it is the demo. Auth users are deleted in the Supabase dashboard, not with SQL.
2. **doctor@test.com and student@test.com.** Old seed accounts. Same dashboard note for the auth user.
3. **Duplicate CE certificates.** Some check-ins created more than one certificate. Keep the oldest. Also look at certificates dated before the seminar started. After the duplicates are gone, the unique index in the portal RLS draft can be turned on.
4. **Portal login notifications.** The old dashboard wrote a "you logged in" row into the doctor's own bell. Those can be deleted. New logins go to Discord, not the bell.
5. **Stale ChiroMatch cycles.** A cycle can still say ranking is open after the close date. Mark those matched so the portal stops saying ranking is open.
6. **Leads pointed at the wrong id.** A few leads may store the auth user id instead of the doctor row id. This is a lead-system question. Look only. Talk to Grok Bot before any update.
7. **New Beginnings and other pre-2020 seminars.** The date is wrong. Fix it in admin. Do not delete the row.

Dr. Mariya Shaeffer's account is a real member. Do not change it except where items 3 and 4 happen to include her rows.
