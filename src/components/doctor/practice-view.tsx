import Link from 'next/link'
import type { ProfileChecklist } from '@/lib/doctor/places'

const TOOLS = [
  { href: '/doctor/kpi', title: 'KPI tracker', detail: 'Today’s numbers and goals' },
  { href: '/doctor/pl-analyzer', title: 'P&L analyzer', detail: 'Where the practice makes and spends money' },
  { href: '/doctor/scan-report', title: 'Scan reports', detail: 'Turn scan numbers into a report' },
  { href: '/doctor/ce-tracker', title: 'CE tracker', detail: 'Certificates from seminars you attended' },
  { href: '/doctor/care-plan-closer', title: 'Care Plan Closer', detail: 'Done-for-you care plan setup' },
  { href: '/doctor/care-plan', title: 'Care plan', detail: 'A visit-by-visit plan for your office' },
  { href: '/doctor/billing-guide', title: 'Billing guide', detail: 'Coding notes included with practice tools' },
  { href: '/doctor/content-library', title: 'Content library', detail: 'Posts and handouts for your office' },
  { href: '/doctor/workshops', title: 'Workshops', detail: 'Workshop kits' },
  { href: '/doctor/screenings', title: 'Screenings', detail: 'Screening kits' },
  { href: '/doctor/contracts', title: 'Contracts', detail: 'Agreement templates' },
  { href: '/doctor/report', title: 'This month', detail: 'Views, requests, and the day view you had before' },
  { href: '/doctor/purchases', title: 'My purchases', detail: 'Kits you have bought' },
  { href: '/doctor/badges', title: 'Achievements', detail: 'Badges on your account' },
]

export function PracticeView({
  checklist,
  clinic,
  place,
  plan,
  views,
  hasPracticeTools,
  showNeuros,
}: {
  checklist: ProfileChecklist
  clinic: string
  place: string
  plan: string
  views: string
  hasPracticeTools: boolean
  showNeuros: boolean
}) {
  return (
    <div className="mt-4 space-y-3">
      <section className="flex items-center gap-4 rounded-[20px] bg-white p-4">
        <div className="grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#D66829 ${checklist.percent}%, #ECEAE5 0)` }}>
          <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-white dp-ui text-[15px] font-extrabold text-[#15202B]">{checklist.percent}%</span>
        </div>
        <div className="min-w-0">
          <p className="dp-ui text-[11px] font-extrabold tracking-[0.1em] text-[#6b7785]" style={{ textTransform: 'uppercase' }}>Your profile</p>
          <p className="dp-ui truncate text-[18px] font-extrabold text-[#15202B]">{clinic || 'Your practice'}</p>
          <p className="text-[13px] text-[#5b6773]">{place || 'Add a city on your profile'} · {plan}</p>
        </div>
      </section>
      <Link href="/doctor/profile" className="dp-ui flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D66829] text-[16px] font-extrabold text-white">
        Edit my profile
      </Link>
      <Row href="/doctor/analytics" title="Analytics" detail={views} iconBg="#2C6BB4" />
      <Row href="/doctor/billing" title="Membership and billing" detail={plan} iconBg="#1E2D3B" />
      <section className="rounded-[20px] bg-white p-4">
        <h2 className="dp-ui text-[16px] font-extrabold text-[#15202B]">Practice tools</h2>
        <p className="mt-1 text-[13px] text-[#5b6773]">KPI, P&L, scans, CE, and Care Plan Closer.</p>
        {!hasPracticeTools ? <p className="mt-2 text-[14px] text-[#5b6773]">Founding members and Pro accounts created before July 15, 2026 include the office tools. Care Plan Closer stays open.</p> : null}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link href={tool.href} className="block min-h-11 rounded-xl bg-[#F5F3EF] px-3 py-2">
                <span className="dp-ui block text-[14px] font-extrabold text-[#15202B]">{tool.title}</span>
                <span className="block text-[13px] text-[#5b6773]">{tool.detail}</span>
              </Link>
            </li>
          ))}
          {showNeuros ? (
            <li>
              <Link href="/doctor/neuros" className="block min-h-11 rounded-xl bg-[#F5F3EF] px-3 py-2">
                <span className="dp-ui block text-[14px] font-extrabold text-[#15202B]">Neuros program</span>
                <span className="block text-[13px] text-[#5b6773]">Your Neuros home</span>
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
      <Row href="/doctor/settings" title="Settings and help" detail="Notifications, account, and a way to reach us" iconBg="#0E857A" />
      <Link href="/doctor/help" className="dp-ui inline-flex min-h-11 items-center px-1 text-[14px] font-extrabold text-[#1E2D3B]">Help</Link>
      <Link href="/doctor/coming-soon" className="flex items-center justify-between rounded-[20px] border border-dashed border-[#E3C27A] bg-[#FFF8F1] px-4 py-4">
        <span>
          <span className="dp-ui block text-[16px] font-extrabold text-[#B4501A]">Coming soon</span>
          <span className="text-[13px] text-[#5b6773]">Synapse, the Network feed, and shadow requests</span>
        </span>
        <span aria-hidden="true">›</span>
      </Link>
    </div>
  )
}

function Row({ href, title, detail, iconBg }: { href: string; title: string; detail: string; iconBg: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3">
      <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: iconBg }} />
      <span className="min-w-0 flex-1">
        <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">{title}</span>
        <span className="block truncate text-[13px] text-[#5b6773]">{detail}</span>
      </span>
      <span className="text-[#b0b8c1]" aria-hidden="true">›</span>
    </Link>
  )
}
