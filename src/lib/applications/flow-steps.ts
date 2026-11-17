export const APPLICATION_FLOW_STEPS = [
  { n: 1, label: 'You and your account' },
  { n: 2, label: 'How you practice' },
  { n: 3, label: 'Your office' },
  { n: 4, label: 'Plan and card' },
] as const

export type ApplicationFlowStep = (typeof APPLICATION_FLOW_STEPS)[number]['n']

export function flowStepLabel(step: ApplicationFlowStep): string {
  return APPLICATION_FLOW_STEPS.find((item) => item.n === step)?.label || ''
}
