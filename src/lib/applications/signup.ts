import { isApplicationFlowEnabled } from './flag.ts'

export function doctorSignupStatus(env: NodeJS.ProcessEnv = process.env): 'hidden' | 'pending' {
  return isApplicationFlowEnabled(env) ? 'hidden' : 'pending'
}
