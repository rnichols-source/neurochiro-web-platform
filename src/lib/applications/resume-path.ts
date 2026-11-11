/** Right after the account exists, the next screen is practice details. */
export const ACCOUNT_CONTINUE_PATH = '/doctor/apply?step=2'

/** Signed-in doctors go straight to the next step. Everyone else logs in and returns there. */
export function continueAfterAccount(signedIn: boolean, nextPath = ACCOUNT_CONTINUE_PATH): string {
  if (signedIn) return nextPath
  return `/login?next=${encodeURIComponent(nextPath)}`
}
