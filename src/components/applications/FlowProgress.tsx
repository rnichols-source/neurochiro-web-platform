const STEPS = [
  { n: 1, label: 'You and your account' },
  { n: 2, label: 'Practice details' },
  { n: 3, label: 'Plan and card' },
] as const

export function FlowProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Application progress" className="mb-6">
      <p className="text-sm font-bold text-neuro-orange">Step {step} of 3</p>
      <ol className="mt-3 grid grid-cols-3 gap-2">
        {STEPS.map((item) => {
          const done = item.n < step
          const current = item.n === step
          return (
            <li key={item.n} aria-current={current ? 'step' : undefined} className="min-w-0">
              <div className={`h-1.5 rounded-full ${done || current ? 'bg-neuro-orange' : 'bg-black/10'}`} />
              <p className={`mt-2 text-xs font-bold leading-snug ${current ? 'text-neuro-navy' : 'text-neuro-navy/70'}`}>
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
