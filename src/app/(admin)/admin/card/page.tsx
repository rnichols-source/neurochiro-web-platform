import { StatsCardView } from '@/components/founder/stats-card'
import { PlaceHeader } from '@/components/founder/header'
import { openRequests } from '@/lib/founder/model'
import { roiCard } from '@/lib/founder/model'
import { formatMoney } from '@/lib/founder/format'
import { loadFounderRoster } from '@/lib/founder/roster'
import { loadFounderSettings } from '@/lib/founder/settings'

export const dynamic = 'force-dynamic'

export default async function StatsCardPage() {
  const [roster, settings] = await Promise.all([loadFounderRoster(), loadFounderSettings()])
  const open = openRequests(roster)
  const confirmed = open.filter((row) => row.outcome === 'patient_contacted_confirmed').length
  const live = roster.doctors.filter((doctor) => doctor.verified)
  const countries = new Set(live.map((doctor) => doctor.country)).size
  const roi = roiCard(roster)
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(new Date())

  return (
    <div>
      <PlaceHeader place="pulse" title="Stats card" subtitle="The numbers for a call. Followers are yours. The rest is live." />
      <StatsCardView
        dateLabel={dateLabel}
        followers={settings.figures.followers}
        peopleUsed={settings.figures.peopleUsed}
        approximate={settings.figures.peopleUsedApproximate}
        countries={roster.countries.length || null}
        asks={roster.mentionsOk ? roster.demandCount : null}
        doctorsLive={live.length}
        doctorCountries={countries}
        visits={open.length + (roster.communityVisits || 0)}
        confirmedRate={open.length ? `${Math.round((confirmed / open.length) * 100)}%` : null}
        visitPrice={roi.visit == null ? null : formatMoney(roi.visit)}
      />
    </div>
  )
}
