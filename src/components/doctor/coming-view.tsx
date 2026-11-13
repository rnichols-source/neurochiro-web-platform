import Link from 'next/link'
import NotifyButton from '@/app/(doctor)/doctor/coming-soon/NotifyButton'
import { COMING_SOON_TOOLS } from '@/lib/doctor/places'

const EARLIER = [
  {
    key: 'community',
    title: 'The Network feed',
    body: 'Announcements and member spotlights. A few notes are already posted.',
    href: '/doctor/community',
    action: 'Open the feed',
    border: '#7A4A94',
  },
  {
    key: 'shadow_requests',
    title: 'Shadow requests',
    body: 'Students ask to shadow you, right from Network.',
    href: '/doctor/students/shadow',
    action: 'Open the inbox',
    border: '#D66829',
  },
]

export function ComingView() {
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMING_SOON_TOOLS.map((card) => (
          <article key={card.id} id={card.id} className="rounded-[22px] border-2 border-dashed border-[#E3C27A] bg-white p-4">
            <p className="dp-ui text-[11px] font-extrabold tracking-[0.08em] text-[#6b7785]" style={{ textTransform: 'uppercase' }}>Coming soon</p>
            <h2 className="dp-ui mt-2 text-[20px] font-extrabold text-[#15202B]">{card.title}</h2>
            <p className="mt-1 text-[14px] leading-snug text-[#5b6773]">{card.body}</p>
            <div className="mt-3"><NotifyButton featureKey={card.id} /></div>
          </article>
        ))}
        {EARLIER.map((card) => (
          <article key={card.key} id={card.key === 'shadow_requests' ? 'shadow' : card.key} className="rounded-[22px] border-2 border-dashed bg-white p-4" style={{ borderColor: card.border }}>
            <p className="dp-ui text-[11px] font-extrabold tracking-[0.08em] text-[#6b7785]" style={{ textTransform: 'uppercase' }}>Coming soon</p>
            <h2 className="dp-ui mt-2 text-[20px] font-extrabold text-[#15202B]">{card.title}</h2>
            <p className="mt-1 text-[14px] leading-snug text-[#5b6773]">{card.body}</p>
            <div className="mt-3"><NotifyButton featureKey={card.key} /></div>
            <Link prefetch href={card.href} className="dp-ui mt-2 inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#1E2D3B]">{card.action}</Link>
          </article>
        ))}
      </div>
      <Link prefetch href="/doctor/help" className="flex items-center justify-between rounded-[20px] bg-[#FFF5E9] px-4 py-4">
        <span>
          <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">What should we build next?</span>
          <span className="text-[14px] text-[#5b6773]">Tell us what would help your practice.</span>
        </span>
        <span aria-hidden="true">›</span>
      </Link>
    </div>
  )
}
