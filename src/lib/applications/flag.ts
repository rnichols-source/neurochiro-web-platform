/** Exact string "true". Anything else, including unset, leaves today's signup in place. */
export function isApplicationFlowEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.APPLICATION_FLOW_ENABLED === 'true'
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
