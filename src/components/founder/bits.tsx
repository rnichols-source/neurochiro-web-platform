import Link from 'next/link'

export function Tag({ kind, children }: { kind: 'live' | 'estimate' | 'yours' | 'tracking'; children: React.ReactNode }) {
  const styles = {
    live: 'bg-[#DDF3E6] text-[#1E7A45]',
    estimate: 'bg-[#E2ECF8] text-[#1F4F8C]',
    yours: 'bg-[#EFE5F5] text-[#5C3473]',
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
        <Link key={link.href} href={link.href} className="fd-ui inline-flex min-h-11 items-center rounded-full bg-white px-3 text-[13px] font-bold text-[#3d4a57] shadow-sm">
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export function FunnelList({ steps }: { steps: { label: string; detail: string; value: string; width: number; tone: string; tracking: boolean }[] }) {
  const color: Record<string, string> = { growth: '#2C6BB4', people: '#0E857A', pulse: '#D66829' }
  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.label} className="grid items-center gap-2 md:grid-cols-[190px_1fr_auto]">
          <div>
            <p className="fd-ui text-[13px] font-extrabold">{step.label}</p>
            <p className="text-[12px] text-[#6b7785]">{step.detail}</p>
          </div>
          <div className="h-8 overflow-hidden rounded-[10px] bg-[#F3F1EC]">
            <div
              className="flex h-full min-w-12 items-center justify-end rounded-[10px] pr-2 text-white"
              style={step.tracking
                ? { width: `${step.width}%`, background: 'repeating-linear-gradient(45deg,#FFF1E6,#FFF1E6 8px,#FBE3D2 8px,#FBE3D2 16px)', color: '#B4501A', border: '1.5px dashed #E9A77A' }
                : { width: `${step.width}%`, background: color[step.tone] || '#D66829' }}
            >
              <span className="fd-ui text-[14px] font-extrabold">{step.value}</span>
            </div>
          </div>
          {step.tracking ? <Tag kind="tracking">Starts tracking now</Tag> : <Tag kind="live">Live data</Tag>}
        </div>
      ))}
    </div>
  )
}
