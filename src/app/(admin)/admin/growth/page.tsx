import Link from 'next/link'
import { Suspense } from 'react'
import { DemandMapLazy } from '@/components/founder/demand-map-lazy'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag, ToolLinks } from '@/components/founder/bits'
import { resolveGrowthPoint } from '@/lib/founder/geo-search'
import { demandNear, doctorsNear, liveDoctors } from '@/lib/founder/model'
import { GROWTH_TOOLS } from '@/lib/founder/places'
import { formatNumber } from '@/lib/founder/format'
import { loadFounderRoster } from '@/lib/founder/roster'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

export default async function GrowthPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage()
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const world = params.view === 'world'
  return (
    <div>
      <PlaceHeader
        place="growth"
        title="Growth"
        subtitle="Where people want a NeuroChiro doctor, and where we don’t have one yet."
        segments={[
          { label: 'Demand map', href: '/admin/growth', on: true },
          { label: 'Funnel & ROI', href: '/admin/growth/funnel', on: false },
          { label: 'Doctor referrals', href: '/admin/doctor-referrals', on: false },
        ]}
      />
      <Suspense fallback={<AdminRouteSkeleton />}>
        <GrowthBody q={q} world={world} />
      </Suspense>
    </div>
  )
}

async function GrowthBody({ q, world }: { q: string; world: boolean }) {
  const roster = await loadFounderRoster()
  const doctors = liveDoctors(roster).map((doctor) => ({
    lat: doctor.lat || 0,
    lng: doctor.lng || 0,
    name: doctor.name,
    where: [doctor.city, doctor.state].filter(Boolean).join(', '),
  }))
  const gaps = roster.gaps.filter((gap) => world || gap.country === 'US').slice(0, 12).map((gap) => ({
    lat: gap.lat,
    lng: gap.lng,
    label: [gap.city, gap.state].filter(Boolean).join(', '),
    miles: gap.miles,
  }))
  let focus: { lat: number; lng: number; label: string } | null = null
  let searchNote = ''
  let choices: { label: string; query: string }[] = []
  let nearby25 = 0
  let nearby50 = 0
  let nearest: { label: string; detail: string; miles: number; href: string }[] = []
  if (q.trim()) {
    const resolved = await resolveGrowthPoint(q)
    if (resolved.choices.length) {
      choices = resolved.choices
      searchNote = resolved.message
    } else if (resolved.resolved) {
      focus = { lat: resolved.resolved.lat, lng: resolved.resolved.lng, label: resolved.resolved.label || q }
      nearby25 = demandNear(roster, focus.lat, focus.lng, 25)
      nearby50 = demandNear(roster, focus.lat, focus.lng, 50)
      nearest = doctorsNear(roster, focus.lat, focus.lng, 5)
    } else {
      searchNote = resolved.message || 'Could not find that place.'
    }
  }
  const showWorld = world || Boolean(focus)
  const points = roster.clusters
    .filter((point) => showWorld || (point.lat > 14 && point.lat < 72 && point.lng > -170 && point.lng < -50))
    .map((point) => ({ lat: point.lat, lng: point.lng, n: point.n }))

  const outside = roster.countries.filter((row) => row.label !== 'United States')

  return (
    <>
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_320px] xl:px-8">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="fd-ui text-[17px] font-extrabold">Demand vs. doctors · {world ? 'World' : 'United States'}</h2>
            <Tag kind="live">Live data</Tag>
          </div>
          <form className="mb-3 flex flex-wrap gap-2" action="/admin/growth">
            <input name="q" defaultValue={q} placeholder="City, ZIP, or address" className="min-h-12 min-w-[220px] flex-1 rounded-xl border-2 border-[#D7DEE6] px-3 text-[15px]" />
            {world ? <input type="hidden" name="view" value="world" /> : null}
            <button className="fd-ui min-h-12 rounded-xl bg-[#2C6BB4] px-4 font-extrabold text-white">Center map</button>
            <Link href={world ? '/admin/growth' : '/admin/growth?view=world'} className="fd-ui inline-flex min-h-12 items-center rounded-xl bg-[#E2ECF8] px-4 font-extrabold text-[#1F4F8C]">{world ? 'United States' : 'World'}</Link>
          </form>
          {searchNote ? <p className="mb-3 text-[14px] text-[#B4501A]">{searchNote}</p> : null}
          {choices.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {choices.map((choice) => (
                <Link key={choice.query} href={`/admin/growth?q=${encodeURIComponent(choice.query)}`} className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#E2ECF8] px-3 text-[13px] font-extrabold text-[#1F4F8C]">
                  {choice.label}
                </Link>
              ))}
            </div>
          ) : null}
          {focus ? (
            <div className="mb-3 rounded-2xl bg-[#E2ECF8] p-4">
              <h3 className="fd-ui text-[16px] font-extrabold">{focus.label}</h3>
              <p className="text-[14px]">{formatNumber(nearby25)} asks within 25 miles · {formatNumber(nearby50)} within 50 miles</p>
              <ul className="mt-2 space-y-1">
                {nearest.length === 0 ? <li>No live doctor on the map yet.</li> : nearest.map((doctor) => (
                  <li key={doctor.href}><Link href={doctor.href} className="font-bold text-[#1F4F8C]">{doctor.label}</Link> · {doctor.miles} mi · {doctor.detail}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <DemandMapLazy points={points} doctors={showWorld ? doctors : doctors.filter((doctor) => doctor.lng < -50 && doctor.lat > 14)} gaps={gaps} focus={focus} world={showWorld} />
          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-[#4a5865]">
            <span>Blue circles: people asking</span>
            <span className="text-[#D66829]">Orange: live doctor</span>
            <span className="text-[#C2413B]">Dashed: measured gap, 50+ miles</span>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="rounded-[22px] bg-[#2C6BB4] p-5 text-white">
            <b className="fd-ui block text-[40px] leading-none">{roster.mentionsOk ? formatNumber(roster.demandCount) : '—'}</b>
            <span className="text-[14px]">asks · {formatNumber(roster.cities)} cities · {roster.countryCount} countries</span>
          </div>
          <Card>
            <h2 className="fd-ui mb-2 text-[16px] font-extrabold">Top states</h2>
            {roster.states.map((row) => (
              <div key={row.label} className="mb-2 grid grid-cols-[36px_1fr_40px] items-center gap-2 text-[13px]">
                <b className="fd-ui">{row.label}</b>
                <span className="h-3 overflow-hidden rounded-full bg-[#F3F1EC]"><span className="block h-full bg-[#2C6BB4]" style={{ width: `${(row.n / (roster.states[0]?.n || 1)) * 100}%` }} /></span>
                <span className="text-right font-bold">{row.n}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="fd-ui mb-2 text-[16px] font-extrabold">Outside the US</h2>
            {outside.slice(0, 8).map((row) => (
              <div key={row.label} className="flex justify-between border-b border-[#F1EEE8] py-1 text-[13px]"><span>{row.label}</span><b className="fd-ui">{row.n.toLocaleString('en-US')}</b></div>
            ))}
          </Card>
          <Link href="#targets" className="fd-ui flex min-h-12 items-center justify-center rounded-2xl bg-[#2C6BB4] font-extrabold text-white">Recruit doctors in the {formatNumber(roster.gapAsks)} gap asks</Link>
        </div>
      </div>
      <section id="targets" className="px-4 pb-6 xl:px-8">
        <Card>
          <h2 className="fd-ui text-[17px] font-extrabold">Expansion targets</h2>
          <p className="mt-1 text-[14px] text-[#5b6773]">{formatNumber(roster.gapAsks)} asks already measured at 50 miles or more. {formatNumber(roster.unmeasured)} asks do not have a distance yet, so they are not in this list.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {roster.gaps.map((gap) => (
              <Link key={`${gap.city}-${gap.state}`} href={`/admin/growth?q=${encodeURIComponent(`${gap.city}, ${gap.state}`)}`} className="flex min-h-12 items-center justify-between rounded-xl bg-[#F7F9FC] px-3">
                <span className="font-bold">{gap.city}{gap.state ? `, ${gap.state}` : ''}</span>
                <span className="text-[13px] text-[#C2413B]">{gap.n} asks · {gap.miles} mi</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-[#5b6773]">These are places, not accounts. There is no email on the ask. Recruiting starts in outreach.</p>
          <Link href="/admin/outreach" className="mt-2 inline-flex min-h-11 items-center font-bold text-[#1F4F8C]">Open outreach</Link>
        </Card>
        <div className="mt-4"><ToolLinks links={GROWTH_TOOLS} /></div>
      </section>
    </>
  )
}
