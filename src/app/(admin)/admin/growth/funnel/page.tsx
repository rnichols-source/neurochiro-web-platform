import Link from 'next/link'
import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
import { Card, FunnelList, ReachCounts, Tag, ToolLinks } from '@/components/founder/bits'
import { CouldNotLoad } from '@/components/founder/load-error'
import { formatMoney } from '@/lib/founder/format'
import { DOCTOR_PRO_MONTHLY } from '@/lib/founder/format'
import { buildReach, buildRequestFunnel, listingViewTotal, roiCard } from '@/lib/founder/model'
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
  let roster
  let settings
  try {
    ;[roster, settings] = await Promise.all([loadFounderRoster(), loadFounderSettings()])
  } catch {
    return <CouldNotLoad what="the funnel" />
  }
  const plans = settings.error ? null : settings.figures.carePlansStarted
  const average = settings.error ? null : settings.figures.averageCarePlan
  const roi = roiCard(roster, new Date(), plans, average)
  const steps = buildRequestFunnel(roster, new Date(), !settings.error && settings.automations.didYouGetIn)
  const figuresReady = plans != null && average != null

  return (
    <>
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_360px] xl:px-8">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="fd-ui text-[17px] font-extrabold">Reach</h2>
            <span className="text-[12px] text-[#8a95a1]">not a funnel</span>
          </div>
          <ReachCounts counts={buildReach(roster)} />
          <p className="mt-3 text-[12px] text-[#6b7785]">Doctor listing counters add up to {listingViewTotal(roster).toLocaleString('en-US')}. That is a different tracker from the site view above.</p>
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="fd-ui text-[17px] font-extrabold">Request funnel</h2>
            <span className="text-[12px] text-[#8a95a1]">percentages are inside this part only</span>
          </div>
          <FunnelList steps={steps} />
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#E9A77A] bg-[#FFF7F1] p-4">
            <div className="min-w-0 flex-1">
              <b className="fd-ui block">Did you get in?</b>
              <span className="text-[13px] text-[#4a5865]">{settings.error ? 'Settings could not be loaded.' : settings.automations.didYouGetIn ? 'On. The question goes out 7 days after a visit request.' : 'Off. Turn on in Settings before this row can count office visits.'}</span>
            </div>
            <Link href="/admin/settings" className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-4 font-extrabold text-white">{settings.automations.didYouGetIn ? 'Review switch' : 'Turn on in Settings'}</Link>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="rounded-[24px] bg-[#1F4F8C] p-5 text-white">
            <p className="fd-ui text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/80">What you say on a call</p>
            <div className="mt-3 flex items-end gap-4">
              <div><b className="fd-ui block text-[40px] leading-none">${DOCTOR_PRO_MONTHLY}</b><span className="text-[13px]">Doctor Pro per month</span></div>
              <span className="pb-3 text-[14px] font-extrabold text-white/60">vs</span>
              <div><b className="fd-ui block text-[40px] leading-none">{roi.visit == null ? 'Unavailable' : formatMoney(roi.visit)}</b><span className="text-[13px]">median first visit</span></div>
            </div>
            <p className="mt-3 text-[15px]">One new patient a month more than pays for NeuroChiro.</p>
            {figuresReady && roi.carePlanValue != null && roi.carePlansStarted != null && roi.averageCarePlan != null ? (
              <p className="mt-2 text-[15px]">Doctors have reported {roi.carePlansStarted} patients who started a care plan, at an average of {formatMoney(roi.averageCarePlan)}. That is {formatMoney(roi.carePlanValue)}.</p>
            ) : (
              <p className="mt-2 text-[15px]">Add your figures in Settings. Care plan counts are not shown until you save them.</p>
            )}
            <Row label="Doctors who got a request" value={String(roi.doctors)} />
            <Row label="Requests per doctor" value={roi.perDoctor == null ? 'Unavailable' : String(roi.perDoctor)} />
            <Row label="First-visit value of confirmed contacts" value={roi.sentValue == null ? 'Unavailable' : formatMoney(roi.sentValue)} />
            {figuresReady && roi.carePlansStarted != null && roi.averageCarePlan != null && roi.carePlanValue != null ? (
              <>
                <Row label="Care plans started" value={String(roi.carePlansStarted)} tag="estimate" />
                <Row label="Average care plan" value={formatMoney(roi.averageCarePlan)} tag="estimate" />
                <Row label="Care plan value" value={formatMoney(roi.carePlanValue)} />
                <Row label="First-visit value of those care plans" value={roi.carePlanVisitValue == null ? 'Unavailable' : formatMoney(roi.carePlanVisitValue)} />
              </>
            ) : (
              <Row label="Care plan figures" value="Add in Settings" />
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag kind="live">Live data</Tag>
              {figuresReady ? <Tag kind="estimate">Your figures</Tag> : <Tag kind="tracking">Add in Settings</Tag>}
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
  carePlansStarted: number | null
  averageCarePlan: number | null
  carePlanValue: number | null
  carePlanVisitValue: number | null
}): string {
  const sentences = [`$${DOCTOR_PRO_MONTHLY} is the Doctor Pro price.`]
  if (roi.visit != null) {
    sentences.push(`${formatMoney(roi.visit)} is the median of ${roi.priceCount} doctors who list a first-visit price.`)
    sentences.push(`${formatMoney(roi.sentValue)} is ${roi.confirmed} confirmed contacts times that median. It is a first-visit ceiling until office visits are tracked.`)
  }
  if (roi.carePlansStarted == null || roi.averageCarePlan == null || roi.carePlanValue == null) {
    sentences.push('Care plan counts stay hidden until you save them in Settings. Nothing here uses a placeholder.')
  } else {
    sentences.push(`${roi.carePlansStarted} is the number of patients doctors reported had started a care plan. It is what you saved in Settings, not a count from visit requests.`)
    sentences.push(`${formatMoney(roi.averageCarePlan)} is the average care plan you saved in Settings.`)
    sentences.push(`${formatMoney(roi.carePlanValue)} is those care plans times that average.`)
    if (roi.carePlanVisitValue != null) {
      sentences.push(`${formatMoney(roi.carePlanVisitValue)} is ${roi.carePlansStarted} care plans times the same median first visit. It is a first-visit value only.`)
    }
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
