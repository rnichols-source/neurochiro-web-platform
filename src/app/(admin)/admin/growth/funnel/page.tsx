import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { Card, FunnelList, Tag, ToolLinks } from '@/components/founder/bits'
import { formatMoney } from '@/lib/founder/format'
import { buildFunnel, roiCard } from '@/lib/founder/model'
import { GROWTH_TOOLS } from '@/lib/founder/places'
import { loadFounderRoster } from '@/lib/founder/roster'
import { loadFounderSettings } from '@/lib/founder/settings'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

export default async function FunnelPage() {
  await requireAdminPage()
  const roster = await loadFounderRoster()
  const settings = await loadFounderSettings()
  const roi = roiCard(roster)
  const steps = buildFunnel(roster)

  return (
    <div>
      <PlaceHeader
        place="growth"
        title="Growth"
        subtitle="From “I need a doctor” to “I went in”, and what that’s worth to a doctor."
        segments={[
          { label: 'Demand map', href: '/admin/growth', on: false },
          { label: 'Funnel & ROI', href: '/admin/growth/funnel', on: true },
          { label: 'Doctor referrals', href: '/admin/doctor-referrals', on: false },
        ]}
      />
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_360px] xl:px-8">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="fd-ui text-[17px] font-extrabold">The full funnel</h2>
            <span className="text-[12px] text-[#8a95a1]">test accounts removed</span>
          </div>
          <FunnelList steps={steps} />
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#E9A77A] bg-[#FFF7F1] p-4">
            <div className="min-w-0 flex-1">
              <b className="fd-ui block">Close the loop</b>
              <span className="text-[13px] text-[#4a5865]">Ask the community member 7 days later: “Did you get in?” That turns the last bar into a real number. It is {settings.automations.didYouGetIn ? 'on' : 'off'}.</span>
            </div>
            <Link href="/admin/settings" className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-4 font-extrabold text-white">{settings.automations.didYouGetIn ? 'Review switch' : 'Turn on'}</Link>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="rounded-[24px] bg-[#1F4F8C] p-5 text-white">
            <p className="fd-ui text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/80">Doctor ROI · what you say on a call</p>
            <div className="mt-3 flex items-end gap-4">
              <div><b className="fd-ui block text-[40px] leading-none">$99</b><span className="text-[13px]">per month</span></div>
              <span className="pb-3 text-[14px] font-extrabold text-white/60">vs</span>
              <div><b className="fd-ui block text-[40px] leading-none">{roi.visit == null ? '—' : formatMoney(roi.visit)}</b><span className="text-[13px]">median first visit</span></div>
            </div>
            <p className="mt-3 text-[15px]">One new community member a month more than pays for NeuroChiro, when the first visit is priced.</p>
            <Row label="Doctors who got a request" value={String(roi.doctors)} />
            <Row label="Requests per doctor" value={roi.perDoctor == null ? '—' : String(roi.perDoctor)} />
            <Row label="First-visit value of confirmed contacts" value={roi.sentValue == null ? '—' : formatMoney(roi.sentValue)} />
            <Row label="Care plans started" value="?" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag kind="live">Live data</Tag>
              <Tag kind="estimate">Estimate</Tag>
              <Tag kind="tracking">Starts tracking now</Tag>
            </div>
          </div>
          <Card>
            <h2 className="fd-ui text-[15px] font-extrabold">How these are counted</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#5b6773]">
              $99 is the doctor price. {roi.visit == null ? 'No usable first-visit prices are on file, so the visit value stays blank.' : `${formatMoney(roi.visit)} is the median of ${roi.priceCount} doctors who list a first-visit price. ${roi.sentValue == null ? '' : `${formatMoney(roi.sentValue)} is ${roi.confirmed} confirmed contacts times that median. It is a ceiling until office visits are tracked.`}`}
              Care plans started from a request are not stored yet.
            </p>
          </Card>
          <Card>
            <h2 className="fd-ui text-[15px] font-extrabold">Content attribution</h2>
            {roster.sources.length === 0 ? <p className="mt-2 text-[13px]">Starts tracking now. No source is stored on the asks yet.</p> : (
              <ul className="mt-2 space-y-1 text-[13px]">
                {roster.sources.map((row) => <li key={row.label} className="flex justify-between"><span>{row.label}</span><b>{row.n.toLocaleString('en-US')}</b></li>)}
              </ul>
            )}
            {roster.posts.length ? (
              <ul className="mt-3 space-y-1 text-[13px] text-[#5b6773]">
                {roster.posts.map((row) => <li key={row.label}>{row.n.toLocaleString('en-US')} · {row.label}</li>)}
              </ul>
            ) : <p className="mt-2 text-[13px] text-[#5b6773]">Post and utm fields start filling when a link carries them. Nothing is stored there yet.</p>}
          </Card>
        </div>
      </div>
      <div className="px-4 pb-6 xl:px-8"><ToolLinks links={GROWTH_TOOLS} /></div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-t border-white/15 py-2 text-[14px]"><span>{label}</span><b className="fd-ui">{value}</b></div>
}
