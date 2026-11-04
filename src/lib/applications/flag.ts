/** Exact string "true". Anything else, including unset, leaves today's signup in place. */
export function isApplicationFlowEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.APPLICATION_FLOW_ENABLED === 'true'
}
