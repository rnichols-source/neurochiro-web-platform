import Link from 'next/link'
import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
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
      <Suspense fallback={<AdminRouteSkeleton />}>
        <FunnelBody />
      </Suspense>
    </div>
  )
}

async function FunnelBody() {
  const [roster, settings] = await Promise.all([loadFounderRoster(), loadFounderSettings()])
  const roi = roiCard(roster, new Date(), settings.figures.carePlansStarted, settings.figures.averageCarePlan)
  const steps = buildFunnel(roster)

  return (
    <>
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
            <p className="mt-3 text-[15px]">{roi.carePlansStarted} care plans started ≈ {formatMoney(roi.carePlanValue)}, vs $99 a month</p>
            <p className="mt-2 text-[15px]">One new community member a month more than pays for NeuroChiro, when the first visit is priced. Doctors have reported {roi.carePlansStarted} community members who started a care plan.</p>
            <Row label="Doctors who got a request" value={String(roi.doctors)} />
            <Row label="Requests per doctor" value={roi.perDoctor == null ? '—' : String(roi.perDoctor)} />
            <Row label="First-visit value of confirmed contacts" value={roi.sentValue == null ? '—' : formatMoney(roi.sentValue)} />
            <Row label="Care plans started" value={String(roi.carePlansStarted)} />
            <Row label="Average care plan" value={formatMoney(roi.averageCarePlan)} tag="estimate" />
            <Row label="Care plan value of care plans started" value={formatMoney(roi.carePlanValue)} />
            <Row label="First-visit value of care plans started" value={roi.carePlanVisitValue == null ? '—' : formatMoney(roi.carePlanVisitValue)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag kind="live">Live data</Tag>
              <Tag kind="estimate">Estimate</Tag>
              <Tag kind="reported">Doctor-reported</Tag>
            </div>
          </div>
          <Card>
            <h2 className="fd-ui text-[15px] font-extrabold">How these are counted</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#5b6773]">{howCounted(roi)}</p>
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
    </>
  )
}

function howCounted(roi: {
  visit: number | null
  priceCount: number
  sentValue: number | null
  confirmed: number
  carePlansStarted: number
  averageCarePlan: number
  carePlanValue: number
  carePlanVisitValue: number | null
}): string {
  const sentences = ['$99 is the doctor price.']
  if (roi.visit != null) {
    sentences.push(`${formatMoney(roi.visit)} is the median of ${roi.priceCount} doctors who list a first-visit price.`)
    sentences.push(`${formatMoney(roi.sentValue)} is ${roi.confirmed} confirmed contacts times that median. It is a first-visit ceiling until office visits are tracked.`)
  }
  sentences.push(`${roi.carePlansStarted} is the number of community members doctors reported had started a care plan, when asked. It is doctor-reported, not counted from visit-request records. Update it in Settings.`)
  sentences.push(`${formatMoney(roi.averageCarePlan)} is the average care plan. It is an industry-survey average (Chiropractic Economics 2025) until doctors report their own prices. It is editable in Settings.`)
  sentences.push(`${formatMoney(roi.carePlanValue)} is ${roi.carePlansStarted} care plans started times that average.`)
  if (roi.carePlanVisitValue != null) {
    sentences.push(`${formatMoney(roi.carePlanVisitValue)} is ${roi.carePlansStarted} care plans started times the same median first visit. It is a first-visit value only.`)
  }
  return sentences.join(' ')
}

function Row({ label, value, tag }: { label: string; value: string; tag?: 'estimate' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/15 py-2 text-[14px]">
      <span className="flex items-center gap-2">{label}{tag === 'estimate' ? <Tag kind="estimate">Estimate</Tag> : null}</span>
      <b className="fd-ui">{value}</b>
    </div>
  )
}
