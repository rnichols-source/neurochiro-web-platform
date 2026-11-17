import { APPLICATION_FLOW_STEPS, type ApplicationFlowStep } from '@/lib/applications/flow-steps'

export function FlowProgress({ step }: { step: ApplicationFlowStep }) {
  return (
    <nav aria-label="Application progress" className="mb-6">
      <p className="text-sm font-bold text-neuro-orange">Step {step} of {APPLICATION_FLOW_STEPS.length}</p>
      <ol className="mt-3 grid grid-cols-4 gap-2">
        {APPLICATION_FLOW_STEPS.map((item) => {
          const done = item.n < step
          const current = item.n === step
          return (
            <li key={item.n} aria-current={current ? 'step' : undefined} className="min-w-0">
              <div className={`h-1.5 rounded-full ${done || current ? 'bg-neuro-orange' : 'bg-black/10'}`} />
              <p className={`mt-2 break-words text-xs font-bold leading-snug ${current ? 'text-neuro-navy' : 'text-neuro-navy/70'}`}>
                <span className="sr-only">{done ? 'Completed. ' : current ? 'Current step. ' : 'Upcoming. '}</span>
                {item.n}. {item.label}
              </p>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
