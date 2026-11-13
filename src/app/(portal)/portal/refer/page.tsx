import type { Metadata } from 'next'
import { ReferView } from '@/components/community/refer-view'
import { requireCommunityMember } from '@/lib/community/data'
import { findDoctorsForPlace, loadInvitations, loadTrips } from '@/lib/community/phase-data'
import type { ParsedPlace } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'Find & Refer · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = {
  sent: 'Sent',
  opened: 'Opened',
  found: 'Found',
}

export default async function ReferPage() {
  const session = await requireCommunityMember()
  const [trips, invitations] = await Promise.all([
    loadTrips(session.userId),
    loadInvitations(session.userId),
  ])
  const upcoming = trips.trips.find((trip) => trip.status === 'upcoming') || null
  let doctors = 0
  if (upcoming) {
    const place: ParsedPlace = {
      label: upcoming.place,
      city: upcoming.city,
      stateCode: upcoming.stateCode,
      countryCode: upcoming.countryCode,
      scope: upcoming.city ? 'city' : upcoming.stateCode ? 'state' : 'country',
    }
    const nearby = await findDoctorsForPlace(place)
    doctors = nearby.doctors.length
  }
  return (
    <ReferView
      trip={upcoming ? {
        place: upcoming.place,
        when: upcoming.when,
        doctors,
        href: '/portal/passport',
      } : null}
      invites={invitations.invitations.map((invite) => ({
        id: invite.id,
        name: invite.recipientWords,
        meta: `${invite.place} · sent ${sentOn(invite.createdAt)}`,
        status: STATUS[invite.status] || 'Sent',
      }))}
    />
  )
}

function sentOn(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(date)
}
