/**
 * Exact "true" turns the flow on. Exact "false" turns it off.
 * A Vercel preview with the flag unset shows the flow, because the flag
 * currently lives on Production only and a preview is how this gets reviewed.
 * Anywhere else, unset leaves today's signup in place.
 */
export function isApplicationFlowEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.APPLICATION_FLOW_ENABLED === 'true') return true
  if (env.APPLICATION_FLOW_ENABLED === 'false') return false
  return env.VERCEL_ENV === 'preview'
}

/** Short button label next to Log in, in the mobile menu, and on /pro. */
export function doctorJoinCtaLabel(env: NodeJS.ProcessEnv = process.env): string {
  return isApplicationFlowEnabled(env) ? 'Apply to join' : 'Join as a doctor'
}

/** First item in the chiropractor menu. */
export function doctorJoinMenuLabel(env: NodeJS.ProcessEnv = process.env): string {
  return isApplicationFlowEnabled(env) ? 'Apply to join' : 'Join NeuroChiro'
}

/** One quiet homepage line. The page stays patient-first. */
export function doctorJoinHomeLine(env: NodeJS.ProcessEnv = process.env): string {
  return `Are you a nervous system chiropractor? ${doctorJoinMenuLabel(env)}`
}
