# Portal test data — what each suggestion means

Do not run these yourself from the app. Raymond reviews `sql/portal_test_data_cleanup.sql`, runs each SELECT, then decides.

1. **Sophia Chen demo doctor.** A fake listing (`dr-sophia-chen-demo`) and the login `drsophia@neurovitalchiro.com`. Remove the row only after you confirm it is the demo. Auth users are deleted in the Supabase dashboard, not with SQL.
2. **doctor@test.com and student@test.com.** Old seed accounts. Same dashboard note for the auth user.
3. **Duplicate CE certificates.** Some check-ins created more than one certificate. Keep the oldest. Also look at certificates dated before the seminar started. After the duplicates are gone, the unique index in the portal RLS draft can be turned on.
4. **Portal login notifications.** The old dashboard wrote a "you logged in" row into the doctor's own bell. Those can be deleted. New logins go to Discord, not the bell.
5. **Stale ChiroMatch cycles.** A cycle can still say ranking is open after the close date. Mark those matched so the portal stops saying ranking is open.
6. **Leads pointed at the wrong id.** A few leads may store the auth user id instead of the doctor row id. This is a lead-system question. Look only. Talk to Grok Bot before any update.
7. **New Beginnings and other pre-2020 seminars.** The date is wrong. Fix it in admin. Do not delete the row.

Dr. Mariya Shaeffer's account is a real member. Do not change her name or which public profile the account points at.

PR E additions, still not run:

8. Test messages with Dr. John Caruso whose text is "Test Test Test" or starts with "Test". The suggestion is a soft delete that clears the text.
9. Leads or contact requests that use this doctor's own email or contain the word test. Look only, and talk to Grok Bot before changing them.
10. The job titled Associate Job Test. The doctor screen uses the status Closed. Confirm the current status, then close it if you want it off the board.
11. The 2017 New Beginnings seminar. Fix the date in admin. Do not delete the row.
12. The seminar review "Thank you so much!" from Raymond on the public profile. There is no hide column, so the suggestion is a commented delete.
13. Stored achievement rows on this doctor. The public page no longer reads them. The list is for information only.
