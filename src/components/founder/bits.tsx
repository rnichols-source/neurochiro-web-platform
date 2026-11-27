import Link from 'next/link'

export function Tag({ kind, children }: { kind: 'live' | 'estimate' | 'yours' | 'tracking' | 'reported'; children: React.ReactNode }) {
  const styles = {
    live: 'bg-[#DDF3E6] text-[#1E7A45]',
    estimate: 'bg-[#E2ECF8] text-[#1F4F8C]',
    yours: 'bg-[#EFE5F5] text-[#5C3473]',
    reported: 'bg-[#EFE5F5] text-[#5C3473]',
    tracking: 'border border-dashed border-[#E9A77A] bg-[#FFF1E6] text-[#B4501A]',
  }
  return <span className={`fd-ui inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${styles[kind]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[22px] bg-white p-4 shadow-[0_10px_26px_-20px_rgba(21,32,43,0.45)] md:p-5 ${className}`}>{children}</section>
}

export function ToolLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link prefetch={false} key={link.href} href={link.href} className="fd-ui inline-flex min-h-11 items-center rounded-full bg-white px-3 text-[13px] font-bold text-[#3d4a57] shadow-sm">
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export function ReachCounts({ counts }: { counts: { label: string; detail: string; value: string }[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {counts.map((count) => (
        <div key={count.label} className="rounded-2xl bg-[#F7F9FC] p-3">
          <b className="fd-ui block text-[26px] leading-none">{count.value}</b>
          <span className="fd-ui mt-1 block text-[13px] font-extrabold">{count.label}</span>
          <span className="mt-1 block text-[12px] text-[#5b6773]">{count.detail}</span>
        </div>
      ))}
    </div>
  )
}

export function FunnelList({ steps }: { steps: { label: string; detail: string; value: string; width: number; tone: string; tracking: boolean; tag?: string; href?: string }[] }) {
  const color: Record<string, string> = { growth: '#2C6BB4', people: '#0E857A', pulse: '#D66829' }
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const quiet = step.tracking || step.tag === 'Off' || step.tag === 'Unavailable'
        const tag = step.tag || (step.tracking ? 'Not tracking' : 'Live data')
        const width = Math.max(0, Math.min(100, step.width))
        return (
          <div key={step.label} className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="fd-ui text-[14px] font-extrabold">{step.label}</p>
              <div className="flex items-center gap-2">
                <span className="fd-ui text-[18px] font-extrabold tabular-nums">{step.value}</span>
                <Tag kind={quiet ? 'tracking' : 'live'}>{tag}</Tag>
              </div>
            </div>
            <p className="text-[12px] leading-snug text-[#6b7785]">{step.detail}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F3F1EC]" aria-hidden="true">
              <div
                className="h-full rounded-full"
                style={step.tracking
                  ? { width: `${width}%`, background: '#E9A77A' }
                  : { width: `${width}%`, background: color[step.tone] || '#D66829' }}
              />
            </div>
            {step.href ? <Link href={step.href} className="fd-ui mt-2 inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-3 text-[13px] font-extrabold text-white">Turn on in Settings</Link> : null}
          </div>
        )
      })}
    </div>
  )
}
