import { PlaceHeader } from '@/components/founder/header'
import { ToolLinks } from '@/components/founder/bits'
import { BroadcastForm } from '@/components/founder/broadcast-form'
import { resolveAudience, type AudienceKey } from '@/lib/founder/audience'
import { BROADCAST_TOOLS } from '@/lib/founder/places'
import { waitingRequests } from '@/lib/founder/model'
import { loadFounderRoster } from '@/lib/founder/roster'

export const dynamic = 'force-dynamic'

export default async function BroadcastPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const audience = typeof params.audience === 'string' ? params.audience : 'founding'
  const roster = await loadFounderRoster()
  const count = (key: AudienceKey) => resolveAudience(roster, key).length
  const presets = [
    { id: 'ignoring', count: new Set(waitingRequests(roster).map((row) => row.doctorId).filter(Boolean)).size, label: 'doctors ignoring requests 48h+' },
    { id: 'stalled', count: count('stalled'), label: 'stalled doctor applications' },
    { id: 'unconfirmed', count: count('unconfirmed'), label: 'subscribers who never confirmed' },
    { id: 'founding', count: count('founding'), label: 'founding-member doctors' },
  ]

  return (
    <div>
      <PlaceHeader
        place="broadcast"
        title="Broadcast"
        subtitle="Reach anyone on NeuroChiro: a banner, an email, a message, or a text."
        segments={[
          { label: 'New broadcast', href: '/admin/broadcast', on: true },
          { label: 'Earlier in-app', href: '/admin/broadcast/messages', on: false },
          { label: 'History', href: '/admin/audit', on: false },
          { label: 'Templates', href: '/admin/coverage/templates', on: false },
        ]}
      />
      <div className="px-4 py-4 lg:px-8">
        <BroadcastForm presets={presets} initialAudience={audience} />
        <div className="mt-4"><ToolLinks links={BROADCAST_TOOLS} /></div>
      </div>
    </div>
  )
}
